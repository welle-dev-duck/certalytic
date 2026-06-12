import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

if (existsSync(path.join(backendRoot, '.env.test'))) {
  dotenv.config({ path: path.join(backendRoot, '.env.test'), override: true });
} else {
  dotenv.config({ path: path.join(backendRoot, '.env') });
}

process.env.NODE_ENV = 'test';
process.env.PORT ??= '3000';
process.env.BASE_URL ??= 'http://localhost:3000';
process.env.WEB_APP_URL ??= 'http://localhost:3001';
process.env.DATABASE_URL ??=
  'postgres://postgres:postgres@localhost:5432/postgres_test';
process.env.REDIS_URL ??= 'redis://localhost:6379/1';
process.env.STRIPE_SECRET_KEY ??= 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET ??= 'whsec_mock';

const databaseUrl = process.env.DATABASE_URL ?? '';
const allowsSharedDb = process.env.E2E_ALLOW_SHARED_DB === 'true';
const usesDedicatedTestDb =
  databaseUrl.includes('_test') || databaseUrl.includes('test_');

if (!usesDedicatedTestDb && !allowsSharedDb) {
  throw new Error(
    'E2E tests require a dedicated test database (name containing "_test") or E2E_ALLOW_SHARED_DB=true',
  );
}
