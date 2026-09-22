import type {
  ApiErrorResponse,
  CreateStopInput,
  Dish,
  HistoryResponse,
  StopListEntryView,
} from './types';

/** HTTP-ошибка с серверным code/message. */
export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  // 204 — нет тела. У нас такого нет, но на будущее.
  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as unknown;

  if (!response.ok) {
    const err = data as Partial<ApiErrorResponse>;
    const code = err.error?.code ?? 'UNKNOWN';
    const message = err.error?.message ?? `HTTP ${response.status}`;
    throw new HttpError(response.status, code, message);
  }

  return data as T;
}

/** GET /api/dishes — справочник блюд. */
export async function fetchDishes(): Promise<Dish[]> {
  return request<Dish[]>('/api/dishes');
}

/** GET /api/stop-list — активные, опционально с фильтром по категории. */
export async function fetchActive(
  category?: string
): Promise<StopListEntryView[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<StopListEntryView[]>(`/api/stop-list${query}`);
}

/** GET /api/stop-list/history — история завершённых записей. */
export async function fetchHistory(
  limit = 20,
  offset = 0
): Promise<HistoryResponse> {
  return request<HistoryResponse>(
    `/api/stop-list/history?limit=${limit}&offset=${offset}`
  );
}

/** POST /api/stop-list — поставить блюдо в стоп. */
export async function createStopEntry(
  input: CreateStopInput
): Promise<StopListEntryView> {
  return request<StopListEntryView>('/api/stop-list', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** PATCH /api/stop-list/:id/return — досрочный возврат блюда. */
export async function returnEntry(id: string): Promise<StopListEntryView> {
  return request<StopListEntryView>(`/api/stop-list/${id}/return`, {
    method: 'PATCH',
  });
}