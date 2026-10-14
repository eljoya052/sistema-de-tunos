import { spawn } from 'child_process';
import process from 'process';
import path from 'path';
import fs from 'fs';

// Check if running directly via plain `node` without TypeScript ESM loader
const isTsxActive = process.execArgv.some((arg) => arg.includes('tsx')) || process.env.__TSX_READY__ === '1';

if (!isTsxActive) {
  process.env.__TSX_READY__ = '1';
  const child = spawn(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }
    process.exit(code ?? 0);
  });
  // Parent process halts and cleanly awaits child process
  await new Promise(() => {});
} else {
  await runServer();
}

async function runServer() {
  const express = (await import('express')).default;
  const { storageEngine, generateInitialSeedState } = await import('./src/lib/storage-engine.ts');

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Persistent database storage directory
  const DATA_DIR = path.resolve('.data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const DB_FILE = path.join(DATA_DIR, 'db_state.json');

  let version = 1;

  // Load persisted state if exists, otherwise initialize fresh seed
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tickets) && Array.isArray(parsed.events)) {
        storageEngine.setState(parsed);
        console.log('[TurnoSocial Server] Database state loaded from .data/db_state.json');
      }
    } catch (err) {
      console.warn('[TurnoSocial Server] Failed to read db_state.json, initializing fresh seed:', err);
    }
  } else {
    const seed = generateInitialSeedState();
    storageEngine.setState(seed);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      console.log('[TurnoSocial Server] Seed state written to .data/db_state.json');
    } catch (err) {
      console.warn('[TurnoSocial Server] Failed to write db_state.json:', err);
    }
  }

  // Active Server-Sent Events clients across all devices (phones, TVs, PCs)
  const sseClients = new Set<any>();

  function broadcast(type: string, payload: unknown, state: unknown) {
    version++;
    const msg = JSON.stringify({ type, payload, state, version });
    for (const client of sseClients) {
      try {
        client.write(`data: ${msg}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  function saveStateToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(storageEngine.getState(), null, 2), 'utf-8');
    } catch (err) {
      console.error('[TurnoSocial Server] Error writing state to disk:', err);
    }
  }

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      clients: sseClients.size,
      version,
    });
  });

  app.get('/api/version', (_req, res) => {
    res.json({ version });
  });

  app.get('/api/state', (_req, res) => {
    res.json({ state: storageEngine.getState(), version });
  });

  // SSE Stream for real-time live events across all devices (phones, TVs, PCs)
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial state upon connection
    res.write(`data: ${JSON.stringify({ type: 'INIT', state: storageEngine.getState(), version })}\n\n`);

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Centralized Real-Time Action Endpoint
  app.post('/api/action', async (req, res) => {
    const { action, params } = req.body || {};
    if (!action || typeof (storageEngine as any)[action] !== 'function') {
      res.status(400).json({ success: false, error: `Acción inválida: ${action}` });
      return;
    }

    try {
      let result: any;
      if (action === 'setActiveEvent') {
        const eventId = typeof params === 'string' ? params : params?.eventId;
        result = storageEngine.setActiveEvent(eventId);
      } else if (action === 'createEvent') {
        result = storageEngine.createEvent(params.name, params.event_date, params.actor_id);
      } else if (action === 'toggleEventStatus') {
        result = storageEngine.toggleEventStatus(params.eventId, params.newStatus);
      } else if (action === 'toggleService') {
        result = storageEngine.toggleService(params.serviceId, params.active);
      } else if (action === 'updateProfessionalAssignments') {
        result = storageEngine.updateProfessionalAssignments(params.professionalId, params.serviceIds, params.deskNumber);
      } else if (action === 'toggleProfileActive') {
        result = storageEngine.toggleProfileActive(params.profileId, params.active);
      } else if (action === 'resetAllTicketsToZero') {
        result = await storageEngine.resetAllTicketsToZero();
      } else if (action === 'resetToInitialSeed') {
        result = storageEngine.resetToInitialSeed();
      } else {
        result = await (storageEngine as any)[action](params);
      }

      saveStateToDisk();
      broadcast(action, result, storageEngine.getState());
      res.json({
        success: true,
        result,
        state: storageEngine.getState(),
        version,
      });
    } catch (error) {
      console.error(`[TurnoSocial Server] Acción "${action}" falló:`, error);
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  });

  // Heartbeat to keep connections alive across mobile screens and proxies
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 15000);

  // Mounting Vite in development or static assets in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TurnoSocial] Servidor en tiempo real multi-dispositivo activo en http://0.0.0.0:${PORT}`);
  });
}
