import type { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode = 500,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(readonly issues: ZodError) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
