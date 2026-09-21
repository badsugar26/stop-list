import { randomUUID } from 'node:crypto';
import type { Dish, StopListEntry } from '../domain/stopList';
import type {
  CreateStopListEntryData,
  DishRepo,
  StopListRepo,
  UpdateStopListEntryData,
} from './types';

/**
 * In-memory репозиторий блюд.
 * Данные приходят из сида и больше не меняются.
 */
export function createInMemoryDishRepo(dishes: Dish[]): DishRepo {
  // Копируем массив, чтобы внешние изменения не влияли на «справочник».
  const store = [...dishes];

  return {
    async findAll(): Promise<Dish[]> {
      return [...store];
    },

    async findById(id: string): Promise<Dish | null> {
      return store.find((d) => d.id === id) ?? null;
    },
  };
}

/**
 * In-memory репозиторий стоп-листа.
 * Хранит записи в массиве; id назначается через randomUUID.
 */
export function createInMemoryStopListRepo(): StopListRepo {
  const store: StopListEntry[] = [];

  return {
    async findAll(): Promise<StopListEntry[]> {
      return [...store];
    },

    async findById(id: string): Promise<StopListEntry | null> {
      return store.find((e) => e.id === id) ?? null;
    },

    async findByDishId(dishId: string): Promise<StopListEntry[]> {
      return store.filter((e) => e.dishId === dishId);
    },

    async create(data: CreateStopListEntryData): Promise<StopListEntry> {
      const entry: StopListEntry = {
        ...data,
        id: randomUUID(),
      };
      store.push(entry);
      return entry;
    },

    async update(
      id: string,
      data: UpdateStopListEntryData
    ): Promise<StopListEntry | null> {
      const index = store.findIndex((e) => e.id === id);
      if (index === -1) return null;

      const current = store[index];
      if (!current) return null;

      const updated: StopListEntry = { ...current, ...data };
      store[index] = updated;
      return updated;
    },
  };
}