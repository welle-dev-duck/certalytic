import {
  and,
  avg,
  count,
  eq,
  gte,
  isNotNull,
  lt,
} from 'drizzle-orm';

import type { Database } from '../../db/index';
import { candidates } from '../../db/schema/candidates.schema';
import { roles } from '../../db/schema/roles.schema';
import type { DashboardStatsResponseDto } from './dashboard.dto';

export class DashboardService {
  constructor(private readonly db: Database) {}

  async getStats(organizationId: string): Promise<DashboardStatsResponseDto> {
    const orgFilter = eq(candidates.organizationId, organizationId);

    const [rolesRow] = await this.db
      .select({ value: count() })
      .from(roles)
      .where(eq(roles.organizationId, organizationId));

    const [candidatesRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(orgFilter);

    const scoredWhere = and(
      orgFilter,
      eq(candidates.status, 'complete'),
      isNotNull(candidates.integrityScore),
    );

    const [highRiskRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(and(scoredWhere, lt(candidates.integrityScore, '50')));

    const [mediumRiskRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(
        and(
          scoredWhere,
          gte(candidates.integrityScore, '50'),
          lt(candidates.integrityScore, '75'),
        ),
      );

    const [avgRow] = await this.db
      .select({ avgIntegrity: avg(candidates.integrityScore) })
      .from(candidates)
      .where(scoredWhere);

    const avgRaw = avgRow?.avgIntegrity;
    const avgIntegrityScore =
      avgRaw !== null && avgRaw !== undefined
        ? Math.round(Number(avgRaw))
        : null;

    return {
      totalRoles: Number(rolesRow?.value ?? 0),
      totalCandidates: Number(candidatesRow?.value ?? 0),
      highRiskFlagged: Number(highRiskRow?.value ?? 0),
      mediumRiskFlagged: Number(mediumRiskRow?.value ?? 0),
      avgIntegrityScore,
    };
  }
}
