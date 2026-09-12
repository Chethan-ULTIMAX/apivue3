import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './env';
import { ensureSession } from './middleware/session';
import integrationsRouter from './routes/integrations';
import activityRouter from './routes/activity';

const app = express();

const allowedOrigins = [
  env.clientUrl,
  'http://localhost:8080',
  'http://localhost:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.github.dev') || origin.endsWith('.githubpreview.dev')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(ensureSession);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'apivue-server',
  });
});

app.use(
  '/api/integrations',
  integrationsRouter
);

app.use('/api/activity', activityRouter);

app.listen(env.port, () => {
  console.log(
    `APIVue server running on http://localhost:${env.port}`
  );
});