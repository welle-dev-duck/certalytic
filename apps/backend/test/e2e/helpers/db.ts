import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

import { db } from '../../../src/db/index';
import { user } from '../../../src/db/schema/auth.schema';

export async function truncateAuthTables() {
  await db.execute(sql`
    TRUNCATE TABLE
      interview_rounds,
      candidates,
      role_exports,
      role_documents,
      roles,
      billing_pack_purchases,
      billing,
      subscription,
      invitation,
      member,
      session,
      account,
      verification,
      organization,
      "user"
    RESTART IDENTITY CASCADE
  `);
}

export async function setUserRole(email: string, role: string) {
  await db.update(user).set({ role }).where(eq(user.email, email));
}

export async function getLatestVerificationToken(): Promise<string | undefined> {
  const result = await db.execute<{ value: string }>(
    sql`SELECT value FROM verification ORDER BY created_at DESC LIMIT 1`,
  );

  return result.rows[0]?.value;
}
