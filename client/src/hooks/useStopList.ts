import { useCallback, useEffect, useState } from 'react';
import {
  createStopEntry,
  fetchActive,
  fetchDishes,
  fetchHistory,
  HttpError,
  returnEntry,
} from '../api/stopList.api';
import type {
  CreateStopInput,
  Dish,
  HistoryResponse,
  StopListEntryView,
} from '../api/types';

interface UseStopListResult {
  // Данные
  dishes: Dish[];
  active: StopListEntryView[];
  history: HistoryResponse | null;

  // Состояния
  loading: boolean;
  error: string | null;

  // Действия
  reload: () => Promise<void>;
  createStop: (input: CreateStopInput) => Promise<void>;
  returnFromStop: (id: string) => Promise<void>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
}

export function useStopList(): UseStopListResult {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [active, setActive] = useState<StopListEntryView[]>([]);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Перезагрузить основные данные: блюда + активные записи.
   * Вызывается при монтировании и после каждой мутации.
   */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dishesData, activeData] = await Promise.all([
        fetchDishes(),
        fetchActive(),
      ]);
      setDishes(dishesData);
      setActive(activeData);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Первичная загрузка при монтировании.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [dishesData, activeData] = await Promise.all([
          fetchDishes(),
          fetchActive(),
        ]);
        if (cancelled) return;
        setDishes(dishesData);
        setActive(activeData);
      } catch (err) {
        if (cancelled) return;
        setError(toErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Поставить блюдо в стоп.
   * После успеха — перезагружаем active.
   * Ошибка пробрасывается наверх — форма покажет её под полем.
   */
  const createStop = useCallback(
    async (input: CreateStopInput) => {
      await createStopEntry(input);
      await reload();
    },
    [reload]
  );

  /** Досрочный возврат блюда в продажу. */
  const returnFromStop = useCallback(
    async (id: string) => {
      await returnEntry(id);
      await reload();
    },
    [reload]
  );

  /** Загрузить историю (по требованию, не при монтировании). */
  const loadHistory = useCallback(async (limit = 20, offset = 0) => {
    try {
      const data = await fetchHistory(limit, offset);
      setHistory(data);
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }, []);

  return {
    dishes,
    active,
    history,
    loading,
    error,
    reload,
    createStop,
    returnFromStop,
    loadHistory,
  };
}

/**
 * Преобразовать ошибку в человекочитаемое сообщение.
 * Если это HttpError — берём message с сервера.
 */
function toErrorMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Неизвестная ошибка';
}