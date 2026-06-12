import type { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import { vi } from 'vitest';

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const testLogger = pino({ level: 'silent' });

export function createMockRequest(
  overrides: Partial<Request> = {},
): Request {
  return {
    id: 'test-request-id',
    log: testLogger,
    body: {},
    query: {},
    params: {},
    headers: {},
    session: null,
    ...overrides,
  } as Request;
}

export function createMockResponse(): MockResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  return res as unknown as MockResponse;
}

export function createMockNext(): NextFunction & ReturnType<typeof vi.fn> {
  return vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
}

export function getJsonBody(res: MockResponse): unknown {
  return res.json.mock.calls.at(-1)?.[0];
}

export function getStatusCode(res: MockResponse): number {
  return res.status.mock.calls.at(-1)?.[0];
}
