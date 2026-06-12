import { describe, expect, it } from 'vitest';

import { TranscriptMerger } from './transcript-merger';

describe('TranscriptMerger', () => {
  const merger = new TranscriptMerger();

  it('returns a single segment unchanged', () => {
    expect(merger.merge(['Round one transcript'])).toBe('Round one transcript');
  });

  it('merges multiple segments with headers', () => {
    const merged = merger.merge(['First interview', 'Second interview']);

    expect(merged).toContain('--- Interview transcript 1 ---');
    expect(merged).toContain('--- Interview transcript 2 ---');
    expect(merged).toContain('First interview');
    expect(merged).toContain('Second interview');
  });
});
