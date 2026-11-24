import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type PatientStatus = 'aguardando' | 'em-atendimento' | 'concluido';
export type CareChannel = 'Chat agora' | 'Online' | 'Presencial';

export interface ChatMessage {
  id: string;
  sender: 'paciente' | 'clinica';
  authorName: string;
  text: string;
  timestamp: string;
}

export interface PublicPatientRecord {
  id: string;
  name: string;
  contact: string;
  topic: string;
  channel: CareChannel;
  preferredPeriod: string;
  status: PatientStatus;
  arrivedAt: string;
  priorityNote: string;
  messages: ChatMessage[];
}

interface StoredPatientRecord extends PublicPatientRecord {
  accessTokenHash: string;
}

interface ClinicCredential {
  salt: string;
  hash: string;
}

interface StoreFileShape {
  adminCredential: ClinicCredential | null;
  signingSecret?: string;
  revokedJtis?: string[];
  patients: StoredPatientRecord[];
}

const STORE_KEY = 'dra_gabriella_clinic_store_v1';

function getStorePath(): string {
  if (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.resolve('/tmp', 'clinic-store.json');
  }
  return path.resolve(process.cwd(), 'data', 'clinic-store.json');
}

function getKvConfig(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return { url: url.replace(/\/+$/, ''), token };
  } catch {
    return null;
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sanitizeText(input: string, maxLength: number): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function toPublicRecord(record: StoredPatientRecord): PublicPatientRecord {
  const { accessTokenHash: _omitted, ...publicRecord } = record;
  return publicRecord;
}

function createInitialStore(): StoreFileShape {
  return {
    adminCredential: null,
    signingSecret: crypto.randomBytes(32).toString('hex'),
    revokedJtis: [],
    patients: [
      {
        id: 'pat-seed-1',
        accessTokenHash: hashToken(crypto.randomBytes(24).toString('hex')),
        name: 'Mariana Oliveira',
        contact: '(11) 99241-1804',
        topic: 'Motivos para Viver e Esperança',
        channel: 'Chat agora',
        preferredPeriod: 'Imediato',
        status: 'aguardando',
        arrivedAt: '14:18',
        priorityNote: 'Relata cansaço emocional intenso e busca acolhimento inicial.',
        messages: [
          {
            id: 'm-101',
            sender: 'paciente',
            authorName: 'Mariana Oliveira',
            text: 'Oi Dra. Gabriella, tenho acordado sem forças ultimamente e sinto que perdi a vontade de fazer as coisas que eu gostava. Queria conversar com alguém hoje.',
            timestamp: '14:18',
          },
        ],
      },
      {
        id: 'pat-seed-2',
        accessTokenHash: hashToken(crypto.randomBytes(24).toString('hex')),
        name: 'Lucas Ferreira',
        contact: '(11) 98103-4429',
        topic: 'Exclusão e Solidão',
        channel: 'Chat agora',
        preferredPeriod: 'Imediato',
        status: 'aguardando',
        arrivedAt: '14:05',
        priorityNote: 'Dificuldade de pertencimento após mudança de cidade e afastamento de colegas.',
        messages: [
          {
            id: 'm-201',
            sender: 'paciente',
            authorName: 'Lucas Ferreira',
            text: 'Mudei de cidade há quatro meses e me sinto muito excluído nos lugares que frequento. Parece que não me encaixo em nenhum grupo.',
            timestamp: '14:05',
          },
        ],
      },
      {
        id: 'pat-seed-3',
        accessTokenHash: hashToken(crypto.randomBytes(24).toString('hex')),
        name: 'Beatriz Santos',
        contact: 'beatriz.santos@email.com',
        topic: 'Trabalho e Esgotamento',
        channel: 'Online',
        preferredPeriod: 'Noite (18h–20h)',
        status: 'em-atendimento',
        arrivedAt: '13:40',
        priorityNote: 'Sobrecarga no trabalho, crises de choro aos domingos e insônia.',
        messages: [
          {
            id: 'm-301',
            sender: 'paciente',
            authorName: 'Beatriz Santos',
            text: 'Não consigo mais desligar a mente do trabalho nem no fim de semana. Tenho medo de adoecer se continuar nesse ritmo.',
            timestamp: '13:40',
          },
          {
            id: 'm-302',
            sender: 'clinica',
            authorName: 'Dra. Gabriella',
            text: 'Olá, Beatriz. Obrigada por compartilhar isso com tanta sinceridade. Vamos organizar um horário ainda esta semana no período da noite para cuidar dessa sobrecarga com calma.',
            timestamp: '13:46',
          },
        ],
      },
    ],
  };
}

function normalizeStore(parsed: Partial<StoreFileShape> | null): StoreFileShape {
  if (!parsed) return createInitialStore();
  return {
    adminCredential: parsed.adminCredential ?? null,
    signingSecret:
      typeof parsed.signingSecret === 'string' && parsed.signingSecret
        ? parsed.signingSecret
        : crypto.randomBytes(32).toString('hex'),
    revokedJtis: Array.isArray(parsed.revokedJtis)
      ? parsed.revokedJtis.slice(-200)
      : [],
    patients: Array.isArray(parsed.patients) ? parsed.patients : [],
  };
}

async function loadStore(): Promise<StoreFileShape> {
  const kv = getKvConfig();
  if (kv) {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(STORE_KEY)}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
    });
    if (!res.ok) {
      throw new Error('Falha ao consultar armazenamento remoto.');
    }
    const payload = (await res.json()) as { result?: string | null };
    if (!payload.result) {
      const initial = createInitialStore();
      await saveStore(initial);
      return initial;
    }
    return normalizeStore(JSON.parse(payload.result) as Partial<StoreFileShape>);
  }

  const storePath = getStorePath();
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(storePath)) {
    const initial = createInitialStore();
    fs.writeFileSync(storePath, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(storePath, 'utf8');
  return normalizeStore(JSON.parse(raw) as Partial<StoreFileShape>);
}

async function saveStore(data: StoreFileShape): Promise<void> {
  const kv = getKvConfig();
  if (kv) {
    const res = await fetch(kv.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', STORE_KEY, JSON.stringify(data)]),
    });
    if (!res.ok) {
      throw new Error('Falha ao salvar dados no armazenamento remoto.');
    }
    return;
  }

  const storePath = getStorePath();
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, storePath);
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueueMutation<T>(mutator: (data: StoreFileShape) => T): Promise<T> {
  const next = writeQueue.then(async () => {
    const current = await loadStore();
    const result = mutator(current);
    await saveStore(current);
    return result;
  });
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function getSessionSecret(): Promise<string> {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret) return envSecret;

  const data = await loadStore();
  if (data.signingSecret) return data.signingSecret;

  return enqueueMutation((draft) => {
    if (!draft.signingSecret) {
      draft.signingSecret = crypto.randomBytes(32).toString('hex');
    }
    return draft.signingSecret;
  });
}

export async function revokeSessionJti(jti: string): Promise<void> {
  await enqueueMutation((data) => {
    const list = data.revokedJtis ?? [];
    if (!list.includes(jti)) {
      list.push(jti);
    }
    data.revokedJtis = list.slice(-200);
  });
}

export async function isSessionJtiRevoked(jti: string): Promise<boolean> {
  const data = await loadStore();
  return Boolean(data.revokedJtis?.includes(jti));
}

export async function getAuthStatus(): Promise<{
  configured: boolean;
  envConfigured: boolean;
  persistentDb: boolean;
}> {
  const envPass = process.env.CLINIC_PASSCODE?.trim();
  const persistentDb = Boolean(getKvConfig()) || process.env.VERCEL !== '1';
  if (envPass) {
    return { configured: true, envConfigured: true, persistentDb };
  }
  const data = await loadStore();
  return {
    configured: Boolean(data.adminCredential),
    envConfigured: false,
    persistentDb,
  };
}

export async function claimFirstRunPasscode(passcode: string): Promise<boolean> {
  const clean = passcode.trim();
  if (clean.length < 6 || clean.length > 128) {
    throw new Error('A senha deve ter entre 6 e 128 caracteres.');
  }
  return enqueueMutation((data) => {
    if (process.env.CLINIC_PASSCODE?.trim() || data.adminCredential) {
      return false;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(clean, salt, 64).toString('hex');
    data.adminCredential = { salt, hash: derived };
    return true;
  });
}

export async function verifyClinicPasscode(passcode: string): Promise<boolean> {
  const candidate = passcode.trim();
  if (!candidate) return false;

  const envPass = process.env.CLINIC_PASSCODE?.trim();
  if (envPass) {
    const a = crypto.createHash('sha256').update(candidate).digest();
    const b = crypto.createHash('sha256').update(envPass).digest();
    return crypto.timingSafeEqual(a, b);
  }

  const data = await loadStore();
  if (!data.adminCredential) {
    return false;
  }

  const derived = crypto.scryptSync(candidate, data.adminCredential.salt, 64);
  const expected = Buffer.from(data.adminCredential.hash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export async function createPatientConversation(input: {
  name: string;
  contact: string;
  topic: string;
  channel: CareChannel;
  preferredPeriod: string;
  initialMessage: string;
  priorityNote?: string;
}): Promise<{ patient: PublicPatientRecord; patientAccessToken: string }> {
  const name = sanitizeText(input.name, 80) || 'Visitante em acolhimento';
  const contact = sanitizeText(input.contact, 120) || 'Chat direto no site';
  const topic = sanitizeText(input.topic, 100) || 'Acolhimento emocional';
  const preferredPeriod = sanitizeText(input.preferredPeriod, 60) || 'Imediato';
  const messageText = sanitizeText(input.initialMessage, 2000);
  const priorityNote =
    sanitizeText(input.priorityNote ?? '', 240) ||
    `Iniciou contato sobre ${topic}.`;

  if (!messageText) {
    throw new Error('A mensagem inicial não pode ficar em branco.');
  }

  const rawToken = crypto.randomBytes(24).toString('hex');
  const accessTokenHash = hashToken(rawToken);
  const arrivedAt = formatTimeNow();
  const id = `pat-${crypto.randomUUID()}`;

  const record: StoredPatientRecord = {
    id,
    accessTokenHash,
    name,
    contact,
    topic,
    channel: input.channel,
    preferredPeriod,
    status: 'aguardando',
    arrivedAt,
    priorityNote,
    messages: [
      {
        id: `msg-${crypto.randomUUID()}`,
        sender: 'paciente',
        authorName: name,
        text: messageText,
        timestamp: arrivedAt,
      },
    ],
  };

  await enqueueMutation((data) => {
    data.patients.unshift(record);
  });

  return {
    patient: toPublicRecord(record),
    patientAccessToken: rawToken,
  };
}

export async function getPatientIfAuthorized(
  patientId: string,
  rawPatientToken: string | null,
  isClinicAdmin: boolean
): Promise<PublicPatientRecord | null> {
  const data = await loadStore();
  const found = data.patients.find((p) => p.id === patientId);
  if (!found) return null;

  if (isClinicAdmin) {
    return toPublicRecord(found);
  }

  if (!rawPatientToken) return null;
  const candidateHash = Buffer.from(hashToken(rawPatientToken), 'hex');
  const storedHash = Buffer.from(found.accessTokenHash, 'hex');
  if (candidateHash.length !== storedHash.length) return null;
  if (!crypto.timingSafeEqual(candidateHash, storedHash)) return null;

  return toPublicRecord(found);
}

export async function appendPatientMessage(
  patientId: string,
  rawPatientToken: string,
  text: string
): Promise<PublicPatientRecord | null> {
  const cleanText = sanitizeText(text, 2000);
  if (!cleanText) {
    throw new Error('Escreva uma mensagem antes de enviar.');
  }

  return enqueueMutation((data) => {
    const found = data.patients.find((p) => p.id === patientId);
    if (!found) return null;

    const candidateHash = Buffer.from(hashToken(rawPatientToken), 'hex');
    const storedHash = Buffer.from(found.accessTokenHash, 'hex');
    if (
      candidateHash.length !== storedHash.length ||
      !crypto.timingSafeEqual(candidateHash, storedHash)
    ) {
      return null;
    }

    found.messages.push({
      id: `msg-${crypto.randomUUID()}`,
      sender: 'paciente',
      authorName: found.name,
      text: cleanText,
      timestamp: formatTimeNow(),
    });
    return toPublicRecord(found);
  });
}

export async function listAllPatientsForClinic(): Promise<PublicPatientRecord[]> {
  const data = await loadStore();
  return data.patients.map(toPublicRecord);
}

export async function appendClinicReply(
  patientId: string,
  text: string
): Promise<PublicPatientRecord | null> {
  const cleanText = sanitizeText(text, 2000);
  if (!cleanText) {
    throw new Error('Escreva uma resposta antes de enviar.');
  }

  return enqueueMutation((data) => {
    const found = data.patients.find((p) => p.id === patientId);
    if (!found) return null;

    if (found.status === 'aguardando') {
      found.status = 'em-atendimento';
    }
    found.messages.push({
      id: `msg-${crypto.randomUUID()}`,
      sender: 'clinica',
      authorName: 'Dra. Gabriella',
      text: cleanText,
      timestamp: formatTimeNow(),
    });
    return toPublicRecord(found);
  });
}

export async function updateClinicPatientStatus(
  patientId: string,
  status: PatientStatus
): Promise<PublicPatientRecord | null> {
  return enqueueMutation((data) => {
    const found = data.patients.find((p) => p.id === patientId);
    if (!found) return null;
    found.status = status;
    return toPublicRecord(found);
  });
}

export async function deleteClinicPatient(patientId: string): Promise<boolean> {
  return enqueueMutation((data) => {
    const idx = data.patients.findIndex((p) => p.id === patientId);
    if (idx === -1) return false;
    data.patients.splice(idx, 1);
    return true;
  });
}
