import { describe, expect, it } from 'vitest';

import { slugifyFilename } from './pdf-slug';

describe('slugifyFilename', () => {
  it('slugifies candidate names for download filenames', () => {
    expect(slugifyFilename('Jane Candidate')).toBe('jane-candidate');
    expect(slugifyFilename('  ')).toBe('export');
  });
});
