import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import {
  appendClinicReply,
  appendPatientMessage,
  claimFirstRunPasscode,
  createPatientConversation,
  deleteClinicPatient,
  getAuthStatus,
  getPatientIfAuthorized,
  listAllPatientsForClinic,
  updateClinicPatientStatus,
  verifyClinicPasscode,
  type CareChannel,
  type PatientStatus,
} from './server/store.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const revokedSessionIds = new Set<string>();

function issueClinicToken(): string {
  const jti = crypto.randomBytes(16).toString('hex');
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ jti, exp, role: 'clinic' })).toString(
    'base64url'
  );
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyClinicToken(token: string | null): { valid: boolean; jti?: string } {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return { valid: false };
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return { valid: false };

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { jti?: string; exp?: number; role?: string };
    if (
      decoded.role !== 'clinic' ||
      !decoded.jti ||
      typeof decoded.exp !== 'number' ||
      decoded.exp < Date.now() ||
      revokedSessionIds.has(decoded.jti)
    ) {
      return { valid: false };
    }
    return { valid: true, jti: decoded.jti };
  } catch {
    return { valid: false };
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.header('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

const VALID_STATUSES: PatientStatus[] = ['aguardando', 'em-atendimento', 'concluido'];
const VALID_CHANNELS: CareChannel[] = ['Chat agora', 'Online', 'Presencial'];

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/chats', async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name : '';
      const contact = typeof body.contact === 'string' ? body.contact : '';
      const topic = typeof body.topic === 'string' ? body.topic : '';
      const initialMessage =
        typeof body.initialMessage === 'string' ? body.initialMessage : '';

      if (initialMessage.trim().length < 3) {
        res.status(400).json({
          error: 'Escreva uma breve mensagem para iniciar a conversa.',
        });
        return;
      }

      const result = await createPatientConversation({
        name,
        contact,
        topic,
        channel: 'Chat agora',
        preferredPeriod: 'Imediato',
        initialMessage,
      });

      res.status(201).json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar conversa.';
      res.status(400).json({ error: msg });
    }
  });

  app.post('/api/bookings', async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
      const modalityRaw = typeof body.modality === 'string' ? body.modality : 'Online';
      const period = typeof body.period === 'string' ? body.period.trim() : '';
      const topic =
        typeof body.topic === 'string' && body.topic.trim()
          ? body.topic.trim()
          : 'Agendamento de sessão';
      const message = typeof body.message === 'string' ? body.message.trim() : '';

      if (name.length < 2 || !contact) {
        res.status(400).json({
          error: 'Informe nome completo e WhatsApp ou e-mail válido.',
        });
        return;
      }

      const channel: CareChannel = VALID_CHANNELS.includes(modalityRaw as CareChannel)
        ? (modalityRaw as CareChannel)
        : 'Online';

      const initialMessage =
        message ||
        `Olá Dra. Gabriella, gostaria de agendar uma sessão ${channel.toLowerCase()} no turno ${period || 'a combinar'}.`;

      const result = await createPatientConversation({
        name,
        contact,
        topic,
        channel,
        preferredPeriod: period || 'A combinar',
        initialMessage,
        priorityNote:
          message ||
          `Solicitou horário ${channel.toLowerCase()} no turno ${period || 'a combinar'}.`,
      });

      res.status(201).json(result);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao registrar solicitação.';
      res.status(400).json({ error: msg });
    }
  });

  app.get('/api/chats/:id', (req: Request, res: Response) => {
    const bearer = extractBearerToken(req);
    const clinicAuth = verifyClinicToken(bearer);
    const patient = getPatientIfAuthorized(
      String(req.params.id),
      clinicAuth.valid ? null : bearer,
      clinicAuth.valid
    );

    if (!patient) {
      res.status(403).json({ error: 'Acesso não autorizado a esta conversa.' });
      return;
    }
    res.json({ patient });
  });

  app.post('/api/chats/:id/messages', async (req: Request, res: Response) => {
    try {
      const bearer = extractBearerToken(req);
      if (!bearer) {
        res.status(401).json({ error: 'Token da conversa ausente.' });
        return;
      }
      const body = req.body as Record<string, unknown>;
      const text = typeof body.text === 'string' ? body.text : '';
      const updated = await appendPatientMessage(String(req.params.id), bearer, text);

      if (!updated) {
        res.status(403).json({ error: 'Não foi possível enviar mensagem nesta conversa.' });
        return;
      }
      res.json({ patient: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar mensagem.';
      res.status(400).json({ error: msg });
    }
  });

  app.get('/api/clinic/auth/status', (req: Request, res: Response) => {
    const status = getAuthStatus();
    const bearer = extractBearerToken(req);
    const tokenCheck = verifyClinicToken(bearer);
    res.json({
      configured: status.configured,
      envConfigured: status.envConfigured,
      authenticated: tokenCheck.valid,
    });
  });

  app.post('/api/clinic/auth/setup', async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const password = typeof body.password === 'string' ? body.password : '';
      const claimed = await claimFirstRunPasscode(password);
      if (!claimed) {
        res.status(409).json({
          error: 'O acesso clínico já foi configurado. Faça login com a senha cadastrada.',
        });
        return;
      }
      const token = issueClinicToken();
      res.status(201).json({ token, authenticated: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao configurar senha.';
      res.status(400).json({ error: msg });
    }
  });

  app.post('/api/clinic/auth/login', (req: Request, res: Response) => {
    const status = getAuthStatus();
    if (!status.configured) {
      res.status(400).json({
        error: 'Defina primeiro a senha do painel clínico.',
      });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const password = typeof body.password === 'string' ? body.password : '';
    if (!verifyClinicPasscode(password)) {
      res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
      return;
    }
    const token = issueClinicToken();
    res.json({ token, authenticated: true });
  });

  app.post('/api/clinic/auth/logout', (req: Request, res: Response) => {
    const bearer = extractBearerToken(req);
    const check = verifyClinicToken(bearer);
    if (check.valid && check.jti) {
      revokedSessionIds.add(check.jti);
    }
    res.json({ ok: true });
  });

  const requireClinicAuth = (req: Request, res: Response): boolean => {
    const bearer = extractBearerToken(req);
    const check = verifyClinicToken(bearer);
    if (!check.valid) {
      res.status(401).json({ error: 'Autenticação da clínica necessária.' });
      return false;
    }
    return true;
  };

  app.get('/api/clinic/patients', (req: Request, res: Response) => {
    if (!requireClinicAuth(req, res)) return;
    const patients = listAllPatientsForClinic();
    res.json({ patients });
  });

  app.post('/api/clinic/patients/:id/reply', async (req: Request, res: Response) => {
    if (!requireClinicAuth(req, res)) return;
    try {
      const body = req.body as Record<string, unknown>;
      const text = typeof body.text === 'string' ? body.text : '';
      const updated = await appendClinicReply(String(req.params.id), text);
      if (!updated) {
        res.status(404).json({ error: 'Paciente não encontrado.' });
        return;
      }
      res.json({ patient: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar resposta.';
      res.status(400).json({ error: msg });
    }
  });

  app.patch('/api/clinic/patients/:id/status', async (req: Request, res: Response) => {
    if (!requireClinicAuth(req, res)) return;
    const body = req.body as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status : '';
    if (!VALID_STATUSES.includes(status as PatientStatus)) {
      res.status(400).json({ error: 'Situação inválida.' });
      return;
    }
    const updated = await updateClinicPatientStatus(
      String(req.params.id),
      status as PatientStatus
    );
    if (!updated) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json({ patient: updated });
  });

  app.delete('/api/clinic/patients/:id', async (req: Request, res: Response) => {
    if (!requireClinicAuth(req, res)) return;
    const deleted = await deleteClinicPatient(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Rota não encontrada.' });
        return;
      }
      const indexFile = path.resolve(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build não encontrado.');
      }
    });
  }

  const port = Number(process.env.PORT) || 3000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Servidor da Dra. Gabriella em execução na porta ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
