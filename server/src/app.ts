import path from 'node:path';
import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { createContainer, type Container } from './container';
import { createDishesRouter } from './routes/dishes.routes';
import { createStopListRouter } from './routes/stopList.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(container: Container = createContainer()): Application {
  const app = express();

  // CORS: нужен только в dev, когда фронт на другом порту (5173).
  // В проде (один сервис) origin один и тот же — CORS не срабатывает.
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    })
  );

  app.use(express.json());

  // Health-check.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // API-роуты.
  app.use('/api/dishes', createDishesRouter(container.dishes));
  app.use('/api/stop-list', createStopListRouter(container.stopListService));

  // 404 для неизвестных /api/* — после API-роутов, до статики.
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Маршрут не найден',
      },
    });
  });

  // В проде раздаём собранный фронт из client/dist.
  // В dev этой папки нет — секция пропускается.
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA-fallback: любой не-API путь отдаёт index.html.
  // Express 5 требует именованный wildcard ('*splat'), Express 4 — '*'.
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        // В dev client/dist может не существовать — отдаём понятный текст.
        res
          .status(404)
          .send('Client build not found. Run `npm run build` first.');
      }
    });
  });

  // errorHandler — строго последним.
  app.use(errorHandler);

  return app;
}