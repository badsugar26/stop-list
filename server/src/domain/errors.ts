export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

/** Базовая доменная ошибка. */
export class DomainError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, statusCode: number, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** 400 — некорректный запрос (невалидные данные в целом). */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', 400, message);
  }
}

/** 404 — сущность не найдена. */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('NOT_FOUND', 404, message);
  }
}

/** 409 — конфликт состояния (например, блюдо уже в стопе). */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
  }
}