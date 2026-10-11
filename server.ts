import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// ---------------------------------------------------------------------------
// Persistent Local Data Store (Atomically synced for cross-device authentication)
// ---------------------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'x0_store.json');

interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
}

interface SessionRecord {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface ChatRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: any[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
  pinned?: boolean;
}

interface StoreData {
  users: UserRecord[];
  sessions: Record<string, SessionRecord>;
  chats: Record<string, ChatRecord[]>; // userId -> chats
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading store, initializing fresh:', err);
  }
  return { users: [], sessions: {}, chats: {} };
}

let store: StoreData = loadStore();

function saveStore(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmp = `${STORE_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE_PATH);
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getAuthUser(req: express.Request): UserRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const session = store.sessions[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete store.sessions[token];
    saveStore();
    return null;
  }
  const user = store.users.find((u) => u.id === session.userId);
  return user || null;
}

// ---------------------------------------------------------------------------
// Health & API Status Check
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    configured: Boolean(apiKey && apiKey.trim().length > 0),
    app: 'X0',
    version: '1.0.0',
    timestamp: Date.now(),
  });
});

// ---------------------------------------------------------------------------
// Authentication Endpoints
// ---------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length < 3 || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = store.users.find((u) => u.email === cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${crypto.randomBytes(12).toString('hex')}`;
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

    const newUser: UserRecord = {
      id: userId,
      email: cleanEmail,
      name: displayName,
      passwordHash,
      salt,
      createdAt: Date.now(),
    };

    store.users.push(newUser);

    // Create session (valid for 30 days)
    const token = `x0_${crypto.randomBytes(32).toString('hex')}`;
    store.sessions[token] = {
      userId: newUser.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    if (!store.chats[userId]) {
      store.chats[userId] = [];
    }

    saveStore();

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal registration failure.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = `x0_${crypto.randomBytes(32).toString('hex')}`;
    store.sessions[token] = {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    saveStore();

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized or expired session.' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    delete store.sessions[token];
    saveStore();
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Cloud Sync & Chat Persistence Endpoints
// ---------------------------------------------------------------------------
app.get('/api/chats', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized. Sign in to retrieve saved cloud conversations.' });
    return;
  }
  const userChats = store.chats[user.id] || [];
  res.json({ chats: userChats });
});

app.post('/api/chats', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in required to persist to cloud.' });
    return;
  }
  const chat = req.body;
  if (!chat || !chat.id) {
    res.status(400).json({ error: 'Malformed conversation payload.' });
    return;
  }

  if (!store.chats[user.id]) {
    store.chats[user.id] = [];
  }

  const existingIdx = store.chats[user.id].findIndex((c) => c.id === chat.id);
  const record: ChatRecord = {
    ...chat,
    userId: user.id,
    updatedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    store.chats[user.id][existingIdx] = record;
  } else {
    store.chats[user.id].unshift(record);
  }

  saveStore();
  res.json({ ok: true, chat: record });
});

app.delete('/api/chats/:id', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const { id } = req.params;
  if (store.chats[user.id]) {
    store.chats[user.id] = store.chats[user.id].filter((c) => c.id !== id);
    saveStore();
  }
  res.json({ ok: true });
});

app.post('/api/chats/sync', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in to sync local sessions.' });
    return;
  }
  const { chats } = req.body;
  if (!Array.isArray(chats)) {
    res.status(400).json({ error: 'Expected array of chats to sync.' });
    return;
  }

  if (!store.chats[user.id]) {
    store.chats[user.id] = [];
  }

  const existingMap = new Map(store.chats[user.id].map((c) => [c.id, c]));

  for (const c of chats) {
    if (!c || !c.id) continue;
    const existing = existingMap.get(c.id);
    if (!existing || (c.updatedAt && c.updatedAt > (existing.updatedAt || 0))) {
      existingMap.set(c.id, {
        ...c,
        userId: user.id,
      });
    }
  }

  store.chats[user.id] = Array.from(existingMap.values()).sort(
    (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
  );

  saveStore();
  res.json({ ok: true, chats: store.chats[user.id] });
});

// ---------------------------------------------------------------------------
// Real Streaming AI Chat Endpoint (Server-Side @google/genai)
// ---------------------------------------------------------------------------
app.post('/api/chat/stream', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    res.status(503).json({
      error: 'API key is not configured on the server. Please attach a valid key in Secrets.',
    });
    return;
  }

  const {
    prompt,
    history = [],
    model = 'gemini-3.8-flash',
    attachments = [],
    systemInstruction,
    temperature = 0.7,
    thinkingLevel = 'high',
  } = req.body;

  if (!prompt && (!attachments || attachments.length === 0)) {
    res.status(400).json({ error: 'A prompt message or attachment is required.' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Flush headers immediately
  res.flushHeaders?.();

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Clean and assemble historical conversation turns
    const rawTurns: { role: 'user' | 'model'; parts: any[] }[] = [];

    // Prior messages: filter out broken/error turns to avoid breaking conversation context
    for (const msg of history) {
      if (msg.error) continue; // Skip prior error cards
      if (!msg.content && (!msg.attachments || msg.attachments.length === 0)) continue;

      const role: 'user' | 'model' = msg.role === 'assistant' ? 'model' : 'user';
      const parts: any[] = [];

      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.dataUrl && att.dataUrl.startsWith('data:')) {
            const matches = att.dataUrl.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2],
                },
              });
            }
          } else if (att.textPreview) {
            parts.push({
              text: `[Attachment: ${att.name}]\n${att.textPreview}`,
            });
          }
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        // Enforce strict alternating turns
        if (rawTurns.length > 0 && rawTurns[rawTurns.length - 1].role === role) {
          rawTurns[rawTurns.length - 1].parts.push(...parts);
        } else {
          rawTurns.push({ role, parts });
        }
      }
    }

    // Since current turn is always 'user', if history ends with 'user', remove that trailing user turn
    if (rawTurns.length > 0 && rawTurns[rawTurns.length - 1].role === 'user') {
      rawTurns.pop();
    }

    // Build current user turn parts
    const currentParts: any[] = [];

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.dataUrl && att.dataUrl.startsWith('data:')) {
          const matches = att.dataUrl.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
          if (matches) {
            currentParts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            });
          }
        } else if (att.textPreview) {
          currentParts.push({
            text: `[Attached File: ${att.name}]\n${att.textPreview}`,
          });
        }
      }
    }

    if (prompt) {
      currentParts.push({ text: prompt });
    }

    const contents = [...rawTurns, { role: 'user', parts: currentParts }];

    const config: any = {
      systemInstruction:
        systemInstruction ||
        'You are X0, an ultra-minimalist, exceptionally capable software and reasoning assistant. Provide direct, rigorous, beautifully formatted answers. Use clean Markdown for code blocks, tables, and lists. Avoid conversational filler or unsolicited flattery.',
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      thinkingConfig: {
        thinkingLevel:
          thinkingLevel === 'low' || thinkingLevel === 'medium'
            ? ThinkingLevel.LOW
            : ThinkingLevel.HIGH,
      },
    };

    // Valid selected model (prevent deprecated models)
    let targetModel =
      model === 'gemini-3.1-pro-preview' || model === 'gemini-3.1-flash-lite'
        ? model
        : 'gemini-3.8-flash';

    async function streamModel(modelName: string): Promise<void> {
      const responseStream = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config,
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    try {
      await streamModel(targetModel);
    } catch (modelErr: any) {
      console.warn(`[X0 Server] Model ${targetModel} failed:`, modelErr?.message || modelErr);
      if (targetModel !== 'gemini-3.8-flash') {
        // Fall back seamlessly to base X0 Flash
        targetModel = 'gemini-3.8-flash';
        res.write(
          `data: ${JSON.stringify({
            text: `> *Notice: Response delivered via X0 Flash for optimal reliability.*\n\n`,
          })}\n\n`
        );
        await streamModel(targetModel);
      } else {
        throw modelErr;
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Error during streaming:', err);
    let friendlyMessage = 'Unable to complete response. Please try again.';
    try {
      const rawMsg = String(err?.message || '');
      if (
        rawMsg.includes('429') ||
        rawMsg.includes('RESOURCE_EXHAUSTED') ||
        rawMsg.includes('quota') ||
        rawMsg.includes('limit: 0')
      ) {
        friendlyMessage =
          'Request limit reached. Please wait a brief moment and try again with X0 Flash.';
      } else if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('401')) {
        friendlyMessage = 'Authentication error. Please check server configuration.';
      } else {
        const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            friendlyMessage = parsed.error?.message || parsed.message || 'Streaming failed.';
          } catch {
            friendlyMessage = 'Streaming failed.';
          }
        }
      }
    } catch {
      friendlyMessage = 'Unable to complete response.';
    }

    res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
    res.end();
  }
});

// ---------------------------------------------------------------------------
// Server Mounting (Vite dev middlewares vs Production static)
// ---------------------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[X0 Server] Running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to launch X0 server:', err);
    process.exit(1);
  });
}

export default app;
