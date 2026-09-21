import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { DishRepo } from '../repositories/types';

export function createDishesRouter(dishes: DishRepo): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const list = await dishes.findAll();
      res.json(list);
    })
  );

  return router;
}