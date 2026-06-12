import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getJsonBody,
} from '../test/helpers/express';
import { sendJson } from './response';
import { validate } from './validate';
import { ValidationError } from './errors';

describe('validate', () => {
  it('parses and assigns valid request parts', () => {
    const req = createMockRequest({
      body: { email: 'user@example.com' },
      query: { page: '2' },
    });
    const res = createMockResponse();
    const next = createMockNext();

    validate({
      body: z.object({ email: z.email() }),
      query: z.object({ page: z.coerce.number().int().positive() }),
    })(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: 'user@example.com' });
    expect(req.query).toEqual({ page: 2 });
  });

  it('forwards validation errors to next', () => {
    const req = createMockRequest({ body: { email: 'not-an-email' } });
    const res = createMockResponse();
    const next = createMockNext();

    validate({
      body: z.object({ email: z.email() }),
    })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(ValidationError);
  });
});

describe('sendJson', () => {
  it('serializes validated response payloads', () => {
    const res = createMockResponse();
    const schema = z.object({ status: z.literal('ok') });

    sendJson(res, schema, { status: 'ok' }, 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(getJsonBody(res)).toEqual({ status: 'ok' });
  });

  it('throws when the payload does not match the schema', () => {
    const res = createMockResponse();
    const schema = z.object({ status: z.literal('ok') });

    expect(() => sendJson(res, schema, { status: 'bad' }, 200)).toThrow();
    expect(res.json).not.toHaveBeenCalled();
  });
});
