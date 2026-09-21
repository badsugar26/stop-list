import { seedDishes } from './seed/dishes';
import {
  createInMemoryDishRepo,
  createInMemoryStopListRepo,
} from './repositories/inMemory';
import { createStopListService, type StopListService } from './services/stopList.service';
import type { DishRepo, StopListRepo } from './repositories/types';

export interface Container {
  dishes: DishRepo;
  stopList: StopListRepo;
  stopListService: StopListService;
}

export function createContainer(): Container {
  const dishes = createInMemoryDishRepo(seedDishes);
  const stopList = createInMemoryStopListRepo();

  const stopListService = createStopListService({
    stopList,
    dishes,
    now: () => new Date(),
  });

  return { dishes, stopList, stopListService };
}