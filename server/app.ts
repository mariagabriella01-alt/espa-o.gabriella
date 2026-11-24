import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import {
  appendClinicReply,
  appendPatientMessage,
  claimFirstRunPasscode,
  createPatientConversation,
  deleteClinicPatient,
  getAuthStatus,
  getPatientIfAuthorized,
  getSessionSecret,
  isSessionJtiRevoked,
  listAllPatientsForClinic,
  revokeSessionJti,
  updateClinicPatientStatus,
  verifyClinicPasscode,
  type CareChannel,
  type PatientStatus,
} from './store.ts';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const VALID_STATUSES: PatientStatus[] = ['aguardando', 'em-atendimento', 'concluido'];
const VALID_CHANNELS: CareChannel[] = ['Chat agora', 'Online', 'Presencial'];

async function issueClinicToken(): Promise<string> {
  const secret = await getSessionSecret();
  const jti = crypto.randomBytes(16).toString('hex');
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ jti, exp, role: 'clinic' })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

async function verifyClinicToken(
  token: string | null
): Promise<{ valid: boolean; jti?: string }> {
  if (!token) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;

  const secret = await getSessionSecret();
  const expectedSig = crypto
    .createHmac('sha256', secret)
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
      decoded.exp < Date.now()
    ) {
      return { valid: false };
    }

    if (await isSessionJtiRevoked(decoded.jti)) {
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

export function createApiApp() {
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

  app.get('/api/chats/:id', async (req: Request, res: Response) => {
    const bearer = extractBearerToken(req);
    const clinicAuth = await verifyClinicToken(bearer);
    const patient = await getPatientIfAuthorized(
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

  app.get('/api/clinic/auth/status', async (req: Request, res: Response) => {
    const status = await getAuthStatus();
    const bearer = extractBearerToken(req);
    const tokenCheck = await verifyClinicToken(bearer);
    res.json({
      configured: status.configured,
      envConfigured: status.envConfigured,
      persistentDb: status.persistentDb,
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
      const token = await issueClinicToken();
      res.status(201).json({ token, authenticated: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao configurar senha.';
      res.status(400).json({ error: msg });
    }
  });

  app.post('/api/clinic/auth/login', async (req: Request, res: Response) => {
    const status = await getAuthStatus();
    if (!status.configured) {
      res.status(400).json({
        error: 'Defina primeiro a senha do painel clínico.',
      });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const password = typeof body.password === 'string' ? body.password : '';
    const ok = await verifyClinicPasscode(password);
    if (!ok) {
      res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
      return;
    }
    const token = await issueClinicToken();
    res.json({ token, authenticated: true });
  });

  app.post('/api/clinic/auth/logout', async (req: Request, res: Response) => {
    const bearer = extractBearerToken(req);
    const check = await verifyClinicToken(bearer);
    if (check.valid && check.jti) {
      await revokeSessionJti(check.jti);
    }
    res.json({ ok: true });
  });

  const requireClinicAuth = async (req: Request, res: Response): Promise<boolean> => {
    const bearer = extractBearerToken(req);
    const check = await verifyClinicToken(bearer);
    if (!check.valid) {
      res.status(401).json({ error: 'Autenticação da clínica necessária.' });
      return false;
    }
    return true;
  };

  app.get('/api/clinic/patients', async (req: Request, res: Response) => {
    if (!(await requireClinicAuth(req, res))) return;
    const patients = await listAllPatientsForClinic();
    res.json({ patients });
  });

  app.post('/api/clinic/patients/:id/reply', async (req: Request, res: Response) => {
    if (!(await requireClinicAuth(req, res))) return;
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
    if (!(await requireClinicAuth(req, res))) return;
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
    if (!(await requireClinicAuth(req, res))) return;
    const deleted = await deleteClinicPatient(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Paciente não encontrado.' });
      return;
    }
    res.json({ ok: true });
  });

  return app;
}
