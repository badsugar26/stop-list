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

interface ReloadOptions {
  silent?: boolean;
}

interface UseStopListResult {
  dishes: Dish[];
  active: StopListEntryView[];
  history: HistoryResponse | null;

  loading: boolean;
  error: string | null;

  /** Текущее время (обновляется раз в 30 сек). Для обратного отсчёта. */
  now: number;
  /** Момент последней успешной загрузки active. */
  lastLoadedAt: number;

  reload: (options?: ReloadOptions) => Promise<void>;
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

  // now и lastLoadedAt — в состоянии. Начальные 0; обновятся в эффектах.
  const [now, setNow] = useState<number>(0);
  const [lastLoadedAt, setLastLoadedAt] = useState<number>(0);

  const reload = useCallback(async (options: ReloadOptions = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [dishesData, activeData] = await Promise.all([
        fetchDishes(),
        fetchActive(),
      ]);
      setDishes(dishesData);
      setActive(activeData);
      setLastLoadedAt(Date.now()); // setState после await — линтер доволен
      if (silent) setError(null);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Первичная загрузка.
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
        setLastLoadedAt(Date.now());
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

  // now обновляется раз в 30 сек. setState — внутри setInterval-колбэка,
  // а не в теле effect — линтер set-state-in-effect не сработает.
  useEffect(() => {
    // Сразу выставить текущее время (внутри rAF, чтобы не было setState
    // синхронно в теле эффекта).
    const raf = requestAnimationFrame(() => {
      setNow(Date.now());
    });

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  const createStop = useCallback(
    async (input: CreateStopInput) => {
      await createStopEntry(input);
      await reload({ silent: true });
    },
    [reload]
  );

  const returnFromStop = useCallback(
    async (id: string) => {
      await returnEntry(id);
      await reload({ silent: true });
    },
    [reload]
  );

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
    now,
    lastLoadedAt,
    reload,
    createStop,
    returnFromStop,
    loadHistory,
  };
}

function toErrorMessage(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Неизвестная ошибка';
}