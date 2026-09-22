export type DishCategory = 'Кухня' | 'Бар' | 'Десерты';

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
}

export type StopListStatus = 'active' | 'returned' | 'expired';

export interface StopListEntryView {
  id: string;
  dishId: string;
  reason: string;
  stoppedAt: string;
  expiresAt: string;
  returnedAt: string | null;
  dish: Dish;
  status: StopListStatus;
  /** 0, если запись неактивна. */
  minutesLeft: number;
}

export interface CreateStopInput {
  dishId: string;
  reason: string;
  durationMinutes: number;
}

export interface HistoryResponse {
  items: StopListEntryView[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}