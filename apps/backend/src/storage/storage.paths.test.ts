import { describe, expect, it } from 'vitest';

import { roleDocumentPath } from './storage.paths';

describe('roleDocumentPath', () => {
  it('builds an organization-scoped storage key', () => {
    const path = roleDocumentPath(
      '01932f5a-7b2a-7000-8000-000000000001',
      '01932f5a-7b2a-7000-8000-000000000002',
      'pdf',
    );

    expect(path).toMatch(
      /^01932f5a-7b2a-7000-8000-000000000001\/roles\/01932f5a-7b2a-7000-8000-000000000002\/.+\.pdf$/,
    );
  });
});
