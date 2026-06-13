import { describe, expect, it } from 'vitest';

import { slugifyOrganizationName } from './organization-slug';

describe('slugifyOrganizationName', () => {
  it('slugifies organization names', () => {
    expect(slugifyOrganizationName('Acme Hiring')).toBe('acme-hiring');
    expect(slugifyOrganizationName('  Senior Backend  ')).toBe('senior-backend');
  });

  it('returns empty string for blank names', () => {
    expect(slugifyOrganizationName('   ')).toBe('');
  });
});
