import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { Pool } from 'pg';

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

if (existsSync(path.join(backendRoot, '.env.test'))) {
  dotenv.config({ path: path.join(backendRoot, '.env.test'), override: true });
} else {
  dotenv.config({ path: path.join(backendRoot, '.env') });
}

process.env.NODE_ENV ??= 'test';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_mock';

async function assertDatabaseReachable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('select 1');
  } finally {
    await pool.end();
  }
}

export async function setup() {
  await assertDatabaseReachable();

  execSync('pnpm exec drizzle-kit migrate', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit',
  });
}

export async function teardown() {}
