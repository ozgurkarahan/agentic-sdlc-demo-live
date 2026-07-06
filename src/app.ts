import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type RequestHandler } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CreateAppOptions {
  extraMiddleware?: RequestHandler[];
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const { extraMiddleware = [] } = options;

  app.use(express.json());
  if (extraMiddleware.length > 0) {
    app.use(...extraMiddleware);
  }

  app.get('/healthz', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  // Serve static UI — registered after all API routes so it never shadows /api/* or /healthz.
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('/', (_request, response) => {
    response.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
