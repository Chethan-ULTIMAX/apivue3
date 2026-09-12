import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './env';
import { ensureSession } from './middleware/session';
import integrationsRouter from './routes/integrations';
import providerSyncRouter from './routes/provider-sync';
import activityRouter from './routes/activity';

const app = express();

/* ============================================================
 * Baseline
 * ============================================================ */

app.disable('x-powered-by');

app.set('trust proxy', 1);

/* ============================================================
 * CORS
 * ============================================================ */

const LOCAL_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
]);

function isCodespacesOrigin(origin: string): boolean {
  return (
    origin.endsWith('.app.github.dev') ||
    origin.endsWith('.github.dev') ||
    origin.endsWith('.githubpreview.dev')
  );
}

function isOriginAllowed(origin: string): boolean {
  if (origin === env.clientUrl) return true;
  if (LOCAL_ORIGINS.has(origin)) return true;
  if (isCodespacesOrigin(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      console.warn(`[cors] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
  }),
);

/* ============================================================
 * Body + cookie parsing
 * ============================================================ */

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ============================================================
 * Health check
 * ============================================================ */

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'apivue-server',
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/* ============================================================
 * Authentication
 * ============================================================ */

app.use('/api', ensureSession);

/* ============================================================
 * Routes
 * ============================================================ */

app.use('/api/integrations', integrationsRouter);
app.use('/api/integrations', providerSyncRouter);
app.use('/api/activity', activityRouter);

/* ============================================================
 * 404 for unknown /api/* routes
 * ============================================================ */

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'API route not found' });
});

/* ============================================================
 * Global error handler
 * ============================================================ */

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof Error && error.message === 'Not allowed by CORS') {
      res.status(403).json({ ok: false, error: 'CORS origin not allowed' });
      return;
    }

    console.error('[apivue] Unhandled server error:', error);

    res.status(500).json({
      ok: false,
      error: env.isProduction
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error',
    });
  },
);

/* ============================================================
 * Startup + graceful shutdown
 * ============================================================ */

const server = app.listen(env.port, () => {
  console.log('');
  console.log('======================================');
  console.log('        APIVue Backend Server');
  console.log('======================================');
  console.log(`  Env:     ${env.nodeEnv}`);
  console.log(`  Port:    ${env.port}`);
  console.log(`  Client:  ${env.clientUrl}`);
  console.log(`  Health:  http://localhost:${env.port}/api/health`);
  console.log('======================================');
  console.log('');
});

function shutdown(signal: string): void {
  console.log(`\n[apivue] Received ${signal}, shutting down…`);

  server.close((err) => {
    if (err) {
      console.error('[apivue] Error during shutdown:', err);
      process.exit(1);
    }
    console.log('[apivue] Server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[apivue] Forced exit after 10s.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
