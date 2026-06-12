import { describe, expect, it } from 'vitest';

import { paginateByCursor } from './pagination';

describe('paginateByCursor', () => {
  it('returns an empty page', () => {
    expect(paginateByCursor([], 25)).toEqual({
      data: [],
      pagination: {
        limit: 25,
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('returns a single page when rows fit within the limit', () => {
    const rows = [
      { id: '3' },
      { id: '2' },
      { id: '1' },
    ];

    expect(paginateByCursor(rows, 25)).toEqual({
      data: rows,
      pagination: {
        limit: 25,
        nextCursor: null,
        hasNextPage: false,
      },
    });
  });

  it('trims the extra row and exposes the cursor', () => {
    const rows = [
      { id: '3' },
      { id: '2' },
      { id: '1' },
    ];

    expect(paginateByCursor(rows, 2)).toEqual({
      data: [{ id: '3' }, { id: '2' }],
      pagination: {
        limit: 2,
        nextCursor: '2',
        hasNextPage: true,
      },
    });
  });
});
