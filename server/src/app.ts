import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';

/**
 * Собирает Express-приложение: middleware + роуты.
 * НЕ слушает порт — это делает index.ts.
 * Такое разделение позволит позже импортировать app в тестах.
 */
export function createApp(): Application {
  const app = express();

  // CORS: разрешаем запросы с фронта
  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    })
  );

  // Парсер JSON-тел запросов
  app.use(express.json());

  // Health-check: простой эндпоинт для проверки, что сервер жив
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return app;
}