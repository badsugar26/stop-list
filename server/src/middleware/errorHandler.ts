import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../domain/errors';

/** Единый формат ответа об ошибке. */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface HttpError extends Error {
  code: string;
  statusCode: number;
}

function isHttpError(err: unknown): err is HttpError {
  return (
    err instanceof Error &&
    typeof (err as Partial<HttpError>).code === 'string' &&
    typeof (err as Partial<HttpError>).statusCode === 'number'
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Доменные ошибки — используем их code и statusCode.
  if (err instanceof DomainError) {
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Неожиданные ошибки — логируем и отдаём 500 в едином формате.
  // Стек наружу не отдаём — это утечка внутренностей.
  console.error('[errorHandler] unexpected error:', err);

  const body: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
    },
  };
  res.status(500).json(body);
};