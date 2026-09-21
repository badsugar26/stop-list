import type { Dish, StopListEntry } from '../domain/stopList';

/** Репозиторий справочника блюд. Только чтение — заводить блюда через API не нужно. */
export interface DishRepo {
  findAll(): Promise<Dish[]>;
  findById(id: string): Promise<Dish | null>;
}

/** Данные для создания новой записи стоп-листа. id и timestamps назначает репозиторий. */
export type CreateStopListEntryData = Omit<StopListEntry, 'id'>;

/** Данные для обновления записи стоп-листа. */
export type UpdateStopListEntryData = Partial<
  Pick<StopListEntry, 'returnedAt'>
>;

/** Репозиторий стоп-листа. */
export interface StopListRepo {
  /** Все записи (активные, возвращённые, истёкшие) — без фильтрации. */
  findAll(): Promise<StopListEntry[]>;

  /** Запись по id или null, если не найдена. */
  findById(id: string): Promise<StopListEntry | null>;

  /** Все записи по конкретному блюду. Сервис сам решает, есть ли среди них активная. */
  findByDishId(dishId: string): Promise<StopListEntry[]>;

  /** Создать новую запись. Возвращает созданную (с назначенным id). */
  create(data: CreateStopListEntryData): Promise<StopListEntry>;

  /** Обновить запись. Возвращает обновлённую или null, если не найдена. */
  update(id: string, data: UpdateStopListEntryData): Promise<StopListEntry | null>;
}