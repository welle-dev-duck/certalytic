import { describe, expect, it } from 'vitest';

import { paginateByCursor } from './pagination';

describe('paginateByCursor', () => {
  it('returns an empty page', () => {
    expect(paginateByCursor([], 25)).toEqual({
      data: [],
      pagination: {
        limit: 25,
        from: null,
        to: null,
        hasNextPage: false,
        hasPrevPage: false,
        nextCursor: null,
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
        from: 1,
        to: 3,
        hasNextPage: false,
        hasPrevPage: false,
        nextCursor: null,
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
        from: 1,
        to: 2,
        hasNextPage: true,
        hasPrevPage: false,
        nextCursor: '2',
      },
    });
  });
});
