import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  DEFAULT_ALLOWED_ORIGINS,
  createSecurityHeadersMiddleware,
  createRateLimiter,
} from './server/middleware/security';
import { createGrievanceRouter } from './server/routes/grievances';

dotenv.config();

export function createApp(options?: { rateLimitMax?: number }) {
  const app = express();
  app.disable('x-powered-by');

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(createSecurityHeadersMiddleware(allowedOrigins));
  app.use('/api/', createRateLimiter(options?.rateLimitMax ?? 120, 60_000));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createGrievanceRouter());

  // Sanitized error handler prevents stack traces or malformed JSON leaks
  app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed' || err.status === 400) {
      return res.status(400).json({ success: false, error: 'Malformed JSON request payload.' });
    }
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1d' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`CivicResolve AI running on http://0.0.0.0:${PORT}\n`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
