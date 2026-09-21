import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** 400 — плохой запрос в целом (нет body, не тот Content-Type и т.п.). */
class BadRequestError extends Error {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';
}

/** 422 — тело правильной формы, но значения полей невалидны. */
class UnprocessableEntityError extends Error {
  public readonly statusCode = 422;
  public readonly code = 'VALIDATION_ERROR';
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

/** Валидация тела запроса на создание записи стоп-листа. */
export const validateCreateStopEntry: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const body = req.body;

  if (body === null || typeof body !== 'object') {
    return next(new BadRequestError('Тело запроса должно быть JSON-объектом'));
  }

  const { dishId, reason, durationMinutes } = body as Record<string, unknown>;

  // dishId — обязательная непустая строка
  if (typeof dishId !== 'string' || dishId.trim().length === 0) {
    return next(new UnprocessableEntityError('dishId обязателен', 'dishId'));
  }

  // reason — строка, после trim от 5 до 200
  if (typeof reason !== 'string') {
    return next(new UnprocessableEntityError('reason обязателен', 'reason'));
  }
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5 || trimmedReason.length > 200) {
    return next(
      new UnprocessableEntityError(
        'reason должен быть от 5 до 200 символов после trim',
        'reason'
      )
    );
  }

  // durationMinutes — целое от 15 до 720
  if (typeof durationMinutes !== 'number' || !Number.isInteger(durationMinutes)) {
    return next(
      new UnprocessableEntityError(
        'durationMinutes должен быть целым числом',
        'durationMinutes'
      )
    );
  }
  if (durationMinutes < 15 || durationMinutes > 720) {
    return next(
      new UnprocessableEntityError(
        'durationMinutes должен быть от 15 до 720',
        'durationMinutes'
      )
    );
  }

  // Нормализуем body: reason уже trim'нут, чтобы сервис не повторял.
  // Это безопасно: req.body — обычный объект, мы его мутируем осознанно.
  (req.body as Record<string, unknown>).reason = trimmedReason;

  next();
};

/** Валидация query-параметров для истории (limit, offset). */
export const validateHistoryQuery: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { limit, offset } = req.query;

  // limit
  if (limit !== undefined) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
      return next(
        new UnprocessableEntityError('limit должен быть от 1 до 100', 'limit')
      );
    }
  }

  // offset
  if (offset !== undefined) {
    const parsed = Number(offset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return next(
        new UnprocessableEntityError('offset должен быть >= 0', 'offset')
      );
    }
  }

  next();
};