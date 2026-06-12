import { and, eq } from 'drizzle-orm';

import type { Database } from '../../db/index';
import { member } from '../../db/schema/auth.schema';
import type { OrganizationContext, OrgRole } from '../../types/organization';
import { ORG_ROLES } from '../../types/organization';

function parseOrgRole(role: string): OrgRole | undefined {
  return ORG_ROLES.find((value) => value === role);
}

export class OrganizationsService {
  constructor(private readonly db: Database) {}

  async resolveActiveContext(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationContext | undefined> {
    const membership = await this.db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId),
      ),
      columns: { role: true },
      with: {
        organization: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!membership) {
      return undefined;
    }

    const role = parseOrgRole(membership.role);

    if (!role) {
      return undefined;
    }

    return {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role,
    };
  }

  async getMembership(
    userId: string,
    organizationId: string,
  ): Promise<{ role: OrgRole } | undefined> {
    const membership = await this.db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId),
      ),
      columns: { role: true },
    });

    if (!membership) {
      return undefined;
    }

    const role = parseOrgRole(membership.role);

    if (!role) {
      return undefined;
    }

    return { role };
  }

  async countUserOrganizations(userId: string): Promise<number> {
    const memberships = await this.db.query.member.findMany({
      where: eq(member.userId, userId),
      columns: { id: true },
    });

    return memberships.length;
  }
}
