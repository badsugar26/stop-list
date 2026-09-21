import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { createContainer, type Container } from './container';
import { createDishesRouter } from './routes/dishes.routes';
import { createStopListRouter } from './routes/stopList.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(container: Container = createContainer()): Application {
  const app = express();

  // CORS: разрешаем запросы с фронта.
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    })
  );

  // Парсер JSON-тел запросов.
  app.use(express.json());

  // Health-check: простой эндпоинт для проверки, что сервер жив.
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Ресурсы API.
  app.use('/api/dishes', createDishesRouter(container.dishes));
  app.use('/api/stop-list', createStopListRouter(container.stopListService));

  // 404 для неизвестных /api/* путей — после всех роутов, до errorHandler.
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Маршрут не найден',
      },
    });
  });

  // errorHandler — строго последним. Ловит всё, что упало в роутах.
  app.use(errorHandler);

  return app;
}