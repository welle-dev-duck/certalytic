import { describe, expect, it } from 'vitest';
import { validate as validateUuid, version } from 'uuid';

import { generateId } from './id';

describe('generateId', () => {
  it('returns a valid uuid v7', () => {
    const id = generateId();

    expect(validateUuid(id)).toBe(true);
    expect(version(id)).toBe(7);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));

    expect(ids.size).toBe(100);
  });

  it('generates time-sortable ids', () => {
    const first = generateId();
    const second = generateId();

    expect(first.localeCompare(second)).toBeLessThan(0);
  });
});
