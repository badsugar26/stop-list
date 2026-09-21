import {
  calculateExpiresAt,
  getStatus,
  isActive,
  toView,
  type CreateStopEntryInput,
  type StopListEntry,
  type StopListEntryView,
} from '../domain/stopList';
import { ConflictError, NotFoundError } from '../domain/errors';
import type { DishRepo, StopListRepo } from '../repositories/types';

export interface StopListServiceDeps {
  stopList: StopListRepo;
  dishes: DishRepo;
  /** Функция, возвращающая текущее время. В продакшене — () => new Date(). */
  now: () => Date;
}

/** Результат history: список + общее количество для пагинации. */
export interface HistoryResult {
  items: StopListEntryView[];
  total: number;
  limit: number;
  offset: number;
}

export function createStopListService(deps: StopListServiceDeps) {
  /**
   * Поставить блюдо в стоп.
   * Правила:
   * - блюдо должно существовать → 404
   * - не должно быть активной записи → 409
   * - durationMinutes уже провалидирован middleware'ом
   */
  async function stopDish(input: CreateStopEntryInput): Promise<StopListEntryView> {
    const dish = await deps.dishes.findById(input.dishId);
    if (!dish) {
      throw new NotFoundError(`Блюдо ${input.dishId} не найдено`);
    }

    const now = deps.now();
    const existing = await deps.stopList.findByDishId(input.dishId);
    const hasActive = existing.some((entry) => isActive(entry, now));

    if (hasActive) {
      throw new ConflictError('Блюдо уже в стоп-листе');
    }

    const created = await deps.stopList.create({
      dishId: dish.id,
      reason: input.reason,
      stoppedAt: now.toISOString(),
      expiresAt: calculateExpiresAt(now, input.durationMinutes),
      returnedAt: null,
    });

    return toView(created, dish, now);
  }

  /**
   * Активные записи, опционально с фильтром по категории блюда.
   * Категория — строка из query, сервис сам решает, применять ли фильтр.
   * Если категория передана и не совпадает ни с одной из известных — вернём пустой список.
   */
  async function listActive(category?: string): Promise<StopListEntryView[]> {
    const now = deps.now();
    const entries = await deps.stopList.findAll();
    const active = entries.filter((entry) => isActive(entry, now));

    // Загружаем блюда для каждой записи.
    // N+1 запрос — приемлемо для in-memory, но не для прода. На будущее можно добавить batch-загрузку или JOIN в репозитории.
    const views: StopListEntryView[] = [];
    for (const entry of active) {
      const dish = await deps.dishes.findById(entry.dishId);
      if (!dish) continue; // Защита от рассинхрона сида — на всякий случай.
      if (category !== undefined && dish.category !== category) continue;
      views.push(toView(entry, dish, now));
    }

    return views;
  }

  /**
   * Досрочный возврат блюда в продажу.
   * Правила:
   * - запись должна существовать → 404
   * - запись должна быть активной → 409 (нельзя вернуть возвращённую или истёкшую)
   * - returnedAt проставляется текущим временем
   */
  async function returnToSale(id: string): Promise<StopListEntryView> {
    const entry = await deps.stopList.findById(id);
    if (!entry) {
      throw new NotFoundError(`Запись стоп-листа ${id} не найдена`);
    }

    const now = deps.now();
    if (!isActive(entry, now)) {
      throw new ConflictError(
        `Запись ${id} нельзя вернуть: она уже ${getStatus(entry, now)}`
      );
    }

    const updated = await deps.stopList.update(id, {
      returnedAt: now.toISOString(),
    });
    if (!updated) {
      // Гонка: между findById и update запись удалили. Маловероятно in-memory,
      // но обработаем честно.
      throw new NotFoundError(`Запись стоп-листа ${id} не найдена`);
    }

    const dish = await deps.dishes.findById(updated.dishId);
    if (!dish) {
      throw new NotFoundError(`Блюдо ${updated.dishId} не найдено`);
    }

    return toView(updated, dish, now);
  }

  /**
   * История завершённых записей (returned + expired), от новых к старым.
   * Пагинация: limit (1..100, по умолчанию 20), offset (>= 0, по умолчанию 0).
   * Валидация limit/offset — в middleware, здесь только дефолты.
   */
  async function listHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<HistoryResult> {
    const now = deps.now();
    const entries = await deps.stopList.findAll();

    // Завершённые = не активные. Это returned или expired.
    const finished = entries.filter((entry) => !isActive(entry, now));

    // Сортировка от новых к старым по stoppedAt.
    finished.sort(
      (a, b) =>
        new Date(b.stoppedAt).getTime() - new Date(a.stoppedAt).getTime()
    );

    const total = finished.length;
    const page = finished.slice(offset, offset + limit);

    const items: StopListEntryView[] = [];
    for (const entry of page) {
      const dish = await deps.dishes.findById(entry.dishId);
      if (!dish) continue;
      items.push(toView(entry, dish, now));
    }

    return { items, total, limit, offset };
  }

  return {
    stopDish,
    listActive,
    returnToSale,
    listHistory,
  };
}

export type StopListService = ReturnType<typeof createStopListService>;