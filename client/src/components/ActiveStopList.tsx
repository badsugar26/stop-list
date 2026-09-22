/**
 * Активный стоп-лист: карточки с обратным отсчётом и кнопкой «Вернуть».
 *
 * Компонент презентационный: получает now и lastLoadedAt через props,
 * не хранит состояние времени, не читает Date.now() в рендере.
 *
 * Анимация удаления:
 * 1. Пользователь кликнул «Вернуть» → добавляем id в `removingIds`.
 * 2. Карточка получает класс `--removing` → transition плавно уводит
 *    её в opacity: 0 за 200 мс.
 * 3. Через 200 мс вызываем onReturn(id) → сервер удаляет запись,
 *    хук перезагружает active, карточка исчезает из DOM.
 * 4. Если onReturn упал — снимаем id из removingIds, карточка
 *    возвращается обратно (transition проигрывается в обратную сторону).
 */

import { useState } from 'react';
import type { StopListEntryView } from '../api/types';

interface ActiveStopListProps {
  entries: StopListEntryView[];
  now: number;
  lastLoadedAt: number;
  onReturn: (id: string) => Promise<void>;
}

/** Длительность анимации удаления, должна совпадать с transition в CSS. */
const REMOVE_ANIMATION_MS = 200;

export function ActiveStopList({
  entries,
  now,
  lastLoadedAt,
  onReturn,
}: ActiveStopListProps) {
  // id карточек, которые сейчас в процессе удаления (fade-out).
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Ошибки при возврате: id → сообщение. Показываем под карточкой.
  const [errors, setErrors] = useState<Record<string, string>>({});

  function computeMinutesLeft(entry: StopListEntryView): number {
    if (lastLoadedAt === 0 || now === 0) return entry.minutesLeft;
    const elapsedMs = Math.max(0, now - lastLoadedAt);
    const elapsedMin = Math.floor(elapsedMs / 60_000);
    const result = entry.minutesLeft - elapsedMin;
    return Math.min(entry.minutesLeft, Math.max(0, result));
  }

  if (entries.length === 0) {
    return <p className="section__empty">Все блюда в продаже</p>;
  }

  async function handleReturn(id: string) {
    // 1. Помечаем карточку как удаляемую — она плавно исчезает.
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      // 2. Ждём окончания анимации, потом дёргаем сервер.
      await new Promise((resolve) =>
        setTimeout(resolve, REMOVE_ANIMATION_MS)
      );
      await onReturn(id);
      // 3. Успех — onReturn сделает reload, entries обновится,
      //    карточка исчезнет из DOM. Чистим removingIds на всякий случай.
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      // 4. Ошибка — снимаем пометку, карточка возвращается.
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setErrors((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : 'Не удалось вернуть блюдо',
      }));
    }
  }

  return (
    <ul className="stop-list">
      {entries.map((entry) => {
        const minutesLeft = computeMinutesLeft(entry);
        const isRemoving = removingIds.has(entry.id);
        const errorMessage = errors[entry.id];

        return (
          <li
            key={entry.id}
            className={`stop-list__item${isRemoving ? ' stop-list__item--removing' : ''}`}
          >
            <div className="stop-list__header">
              <div className="stop-list__name">{entry.dish.name}</div>
              <div className="stop-list__countdown">
                {minutesLeft > 0 ? `ещё ${minutesLeft} мин` : 'истекает'}
              </div>
            </div>
            <div className="stop-list__reason">{entry.reason}</div>
            <div className="stop-list__footer">
              <span className="stop-list__category">{entry.dish.category}</span>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => void handleReturn(entry.id)}
                disabled={isRemoving}
              >
                {isRemoving ? 'Возврат…' : 'Вернуть'}
              </button>
            </div>
            {errorMessage && (
              <div className="form-field__error">{errorMessage}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}