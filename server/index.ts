import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './env';
import { ensureSession } from './middleware/session';
import integrationsRouter from './routes/integrations';

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
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

app.listen(env.port, () => {
  console.log(
    `APIVue server running on http://localhost:${env.port}`
  );
});