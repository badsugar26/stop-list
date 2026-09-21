// ============================================================================
// Типы
// ============================================================================

/** Категории блюд. Одна из трёх — по ТЗ. */
export type DishCategory = 'Кухня' | 'Бар' | 'Десерты';

/** Блюдо из справочника. */
export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  /** Целое число, рубли. */
  price: number;
}

/** Запись стоп-листа — то, что хранится. */
export interface StopListEntry {
  id: string;
  dishId: string;
  reason: string;
  /** ISO 8601 — момент постановки в стоп. */
  stoppedAt: string;
  /** ISO 8601 — stoppedAt + durationMinutes. */
  expiresAt: string;
  /** ISO 8601 или null, если запись ещё не возвращена. */
  returnedAt: string | null;
}

/** Статус записи — вычисляется, не хранится. */
export type StopListStatus = 'active' | 'returned' | 'expired';

/** То, что уходит на клиент: запись + вычисленное состояние + блюдо. */
export interface StopListEntryView extends StopListEntry {
  dish: Dish;
  status: StopListStatus;
  /** Сколько минут осталось до истечения. 0, если запись неактивна. */
  minutesLeft: number;
}

/** Вход для постановки в стоп (то, что приходит от клиента в body). */
export interface CreateStopEntryInput {
  dishId: string;
  reason: string;
  durationMinutes: number;
}

// ============================================================================
// Чистые функции
// ============================================================================

/**
 * Активна ли запись на момент `now`.
 * Запись активна, если не возвращена и срок ещё не истёк.
 */
export function isActive(entry: StopListEntry, now: Date): boolean {
  if (entry.returnedAt !== null) return false;
  return new Date(entry.expiresAt).getTime() > now.getTime();
}

/**
 * Статус записи на момент `now`.
 * - returned — если возвращена досрочно (returnedAt !== null)
 * - active — если ещё не истекла
 * - expired — если срок прошёл, но возврата не было
 */
export function getStatus(entry: StopListEntry, now: Date): StopListStatus {
  if (entry.returnedAt !== null) return 'returned';
  return isActive(entry, now) ? 'active' : 'expired';
}

/**
 * Сколько минут осталось до истечения. 0, если запись неактивна.
 * Округляем вверх: 0.5 минуты осталось → показываем "1 минута".
 */
export function minutesLeft(entry: StopListEntry, now: Date): number {
  if (!isActive(entry, now)) return 0;
  const ms = new Date(entry.expiresAt).getTime() - now.getTime();
  return Math.ceil(ms / 60_000);
}

/**
 * Посчитать момент истечения: now + durationMinutes.
 * Возвращает ISO-строку — в этом формате храним в БД и отдаём клиенту.
 */
export function calculateExpiresAt(now: Date, durationMinutes: number): string {
  return new Date(now.getTime() + durationMinutes * 60_000).toISOString();
}

/**
 * Собрать view-объект для клиента: запись + блюдо + статус + minutesLeft.
 */
export function toView(
  entry: StopListEntry,
  dish: Dish,
  now: Date
): StopListEntryView {
  return {
    ...entry,
    dish,
    status: getStatus(entry, now),
    minutesLeft: minutesLeft(entry, now),
  };
}