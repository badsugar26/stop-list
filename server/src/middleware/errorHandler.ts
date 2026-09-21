import type { ErrorRequestHandler } from 'express';

/** Единый формат ответа об ошибке. */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Структурный тип «HTTP-ошибка»: у неё есть code (строка) и statusCode (число).
 * Так мы ловим и DomainError, и локальные ошибки валидатора, не связывая
 * errorHandler с конкретными классами. Утиная типизация.
 */
interface HttpError extends Error {
  code: string;
  statusCode: number;
}

function isHttpError(err: unknown): err is HttpError {
  if (!(err instanceof Error)) return false;
  const candidate = err as Partial<HttpError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.statusCode === 'number'
  );
}

/**
 * Проверка: это ошибка парсинга JSON от body-parser?
 * body-parser кидает SyntaxError с полем type = 'entity.parse.failed'.
 * Это ошибка клиента (невалидное тело), а не сервера — отдаём 400, не 500.
 */
function isJsonParseError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'type' in err &&
    (err as { type: unknown }).type === 'entity.parse.failed'
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 1. Невалидный JSON в теле — 400, а не 500.
  //    Проверяем ДО isHttpError, потому что у SyntaxError есть statusCode=400,
  //    и он бы попал в ветку isHttpError, но с менее понятным сообщением.
  if (isJsonParseError(err)) {
    const body: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Тело запроса не является валидным JSON',
      },
    };
    res.status(400).json(body);
    return;
  }

  // 2. HTTP-ошибки: доменные (DomainError) и валидационные.
  //    У всех них есть code и statusCode — используем их напрямую.
  if (isHttpError(err)) {
    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // 3. Всё остальное — 500. Стек и текст ошибки наружу не отдаём
  //    (утечка внутренностей), но логируем для отладки.
  console.error('[errorHandler] unexpected error:', err);

  const body: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера',
    },
  };
  res.status(500).json(body);
};