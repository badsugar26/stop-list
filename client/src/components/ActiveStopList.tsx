import { useState } from 'react';
import type { StopListEntryView } from '../api/types';

interface ActiveStopListProps {
  entries: StopListEntryView[];
  /** Текущее время (обновляется в useStopList раз в 30 сек). */
  now: number;
  /** Момент последней успешной загрузки entries. */
  lastLoadedAt: number;
  onReturn: (id: string) => Promise<void>;
}

export function ActiveStopList({
  entries,
  now,
  lastLoadedAt,
  onReturn,
}: ActiveStopListProps) {
  const [returningId, setReturningId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function computeMinutesLeft(entry: StopListEntryView): number {
    if (lastLoadedAt === 0 || now === 0) return entry.minutesLeft;
    const elapsedMs = Math.max(0, now - lastLoadedAt);
    const elapsedMin = Math.floor(elapsedMs / 60_000);
    const result = entry.minutesLeft - elapsedMin;
    // Защита: не меньше 0 и не больше серверного значения.
    return Math.min(entry.minutesLeft, Math.max(0, result));
  }

  if (entries.length === 0) {
    return <p className="section__empty">Все блюда в продаже</p>;
  }

  async function handleReturn(id: string) {
    setReturningId(id);
    setErrorId(null);
    setErrorMessage(null);
    try {
      await onReturn(id);
    } catch (err) {
      setErrorId(id);
      setErrorMessage(
        err instanceof Error ? err.message : 'Не удалось вернуть блюдо'
      );
    } finally {
      setReturningId(null);
    }
  }

  return (
    <ul className="stop-list">
      {entries.map((entry) => {
        const minutesLeft = computeMinutesLeft(entry);
        const isReturning = returningId === entry.id;
        const hasError = errorId === entry.id;

        return (
          <li key={entry.id} className="stop-list__item">
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
                disabled={isReturning}
              >
                {isReturning ? 'Возврат…' : 'Вернуть'}
              </button>
            </div>
            {hasError && (
              <div className="form-field__error">{errorMessage}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}