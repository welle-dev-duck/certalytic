import { and, eq, ne } from 'drizzle-orm';

import type { Database } from '../db/index';
import { organization } from '../db/schema/auth.schema';

export function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function resolveOrganizationSlug(
  db: Database,
  name: string,
  excludeOrganizationId?: string,
): Promise<string> {
  const base = slugifyOrganizationName(name) || `org-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (await isOrganizationSlugTaken(db, candidate, excludeOrganizationId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function isOrganizationSlugTaken(
  db: Database,
  slug: string,
  excludeOrganizationId?: string,
): Promise<boolean> {
  const existing = await db.query.organization.findFirst({
    where:
      excludeOrganizationId != null
        ? and(
            eq(organization.slug, slug),
            ne(organization.id, excludeOrganizationId),
          )
        : eq(organization.slug, slug),
    columns: { id: true },
  });

  return existing != null;
}
