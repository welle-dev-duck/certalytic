import type { Request } from 'express';

/** Returns query params parsed by the `validate` middleware. */
export function getValidatedQuery<T>(req: Request): T {
  return req.query as T;
}

/** Returns body parsed by the `validate` middleware. */
export function getValidatedBody<T>(req: Request): T {
  return req.body as T;
}

/** Returns route params parsed by the `validate` middleware. */
export function getValidatedParams<T>(req: Request): T {
  return req.params as T;
}
