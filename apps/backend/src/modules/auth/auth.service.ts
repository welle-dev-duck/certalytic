import { desc, eq } from 'drizzle-orm';

import type { Database } from '../../db/index';
import { member } from '../../db/schema/auth.schema';

export class AuthService {
  constructor(private readonly db: Database) {}

  async getDefaultOrganization(userId: string): Promise<string | undefined> {
    const membership = await this.db.query.member.findFirst({
      where: eq(member.userId, userId),
      orderBy: desc(member.createdAt),
      columns: { organizationId: true },
    });

    return membership?.organizationId;
  }
}
