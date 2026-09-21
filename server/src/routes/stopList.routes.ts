import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  validateCreateStopEntry,
  validateHistoryQuery,
} from '../middleware/validate';
import type { StopListService } from '../services/stopList.service';

export function createStopListRouter(service: StopListService): Router {
  const router = Router();

  /**
   * POST /api/stop-list
   * Поставить блюдо в стоп.
   * Body: { dishId, reason, durationMinutes }
   * 201 — создано, 404 — блюдо не найдено, 409 — уже в стопе, 422 — невалидные поля.
   */
  router.post(
    '/',
    validateCreateStopEntry,
    asyncHandler(async (req, res) => {
      const { dishId, reason, durationMinutes } = req.body as {
        dishId: string;
        reason: string;
        durationMinutes: number;
      };

      const view = await service.stopDish({ dishId, reason, durationMinutes });
      res.status(201).json(view);
    })
  );

  /**
   * GET /api/stop-list
   * Активные записи, опционально фильтр ?category=Кухня|Бар|Десерты.
   * 200 — всегда (пустой список — тоже валидный ответ).
   */
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const list = await service.listActive(category);
      res.json(list);
    })
  );

  /**
   * GET /api/stop-list/history
   * История завершённых записей, от новых к старым.
   * Query: ?limit=20&offset=0 (валидация в validateHistoryQuery).
   * ВАЖНО: этот роут должен идти ДО '/:id', иначе 'history' будет
   * восприниматься как id. Но у нас нет GET '/:id' — так что порядок не критичен.
   */
  router.get(
    '/history',
    validateHistoryQuery,
    asyncHandler(async (req, res) => {
      const limit =
        req.query.limit !== undefined ? Number(req.query.limit) : undefined;
      const offset =
        req.query.offset !== undefined ? Number(req.query.offset) : undefined;

      const result = await service.listHistory(limit, offset);
      res.json(result);
    })
  );

  /**
   * PATCH /api/stop-list/:id/return
   * Досрочный возврат блюда в продажу.
   * 200 — возвращено, 404 — запись не найдена, 409 — уже неактивна.
   */
  router.patch(
    '/:id/return',
    asyncHandler(async (req, res) => {
      const view = await service.returnToSale(req.params.id);
      res.json(view);
    })
  );

  return router;
}