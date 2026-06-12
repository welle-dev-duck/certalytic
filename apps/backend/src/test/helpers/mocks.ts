import { vi } from 'vitest';

import type { Database } from '../../db/index';

type MemberRecord = {
  organizationId: string;
  role?: string;
  userId?: string;
};

export function createMockDb(options?: {
  member?: MemberRecord | null;
}) {
  return {
    query: {
      member: {
        findFirst: vi.fn().mockResolvedValue(options?.member ?? null),
      },
    },
  } as unknown as Database;
}

export function createMockQueue() {
  return {
    add: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}
