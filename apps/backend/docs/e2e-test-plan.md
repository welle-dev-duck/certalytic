# API E2E Test Plan

This document outlines how to add end-to-end tests for `apps/backend` once unit coverage is in place.

## Goals

- Verify real HTTP behavior across auth, users, billing hooks, and queue producers
- Catch integration issues between Express, better-auth, Drizzle, Redis/BullMQ, and middleware
- Keep tests deterministic by mocking external systems (email delivery, Stripe network calls)

## Recommended stack

| Layer | Tool | Why |
|---|---|---|
| Runner | Vitest (`test/e2e/**/*.e2e.test.ts`) | Same toolchain as unit tests |
| HTTP client | `supertest` | Express-native request helpers |
| Database | Docker Postgres + Drizzle migrations | Real SQL, real constraints |
| Redis | Docker Redis or `ioredis-mock` | Queue assertions without workers sending mail |
| Auth | better-auth test helpers / cookie jar via supertest | Session cookies on API origin |

Suggested scripts:

```json
{
  "test:e2e": "vitest run --config vitest.e2e.config.ts",
  "test:e2e:docker": "docker compose up -d postgres redis && pnpm db:migrate && pnpm test:e2e"
}
```

Use a separate `vitest.e2e.config.ts` with longer timeouts, serial execution, and `.env.test`.

## Test app factory

Do **not** boot `src/index.ts` directly. Build a dedicated factory:

```ts
// test/e2e/create-test-app.ts
export async function createTestApp(options?: {
  startWorkers?: boolean;
  emailsQueue?: MockQueue;
}) {
  const db = createTestDb(); // DATABASE_URL from .env.test
  const queues = options?.emailsQueue ?? new Queues(redisConnection);
  const emailsProducer = new EmailsProducer(queues.emails);
  const app = createApp({ emailsProducer, queues });
  return { app, db, queues, emailsProducer };
}
```

Rules:

- Default `startWorkers: false` so jobs stay in Redis for assertions
- Never send real email or hit Stripe in e2e
- Run migrations before the suite; truncate tables between tests

## What to mock vs. keep real

| Dependency | E2E approach |
|---|---|
| Postgres | Real (Docker) |
| Redis / BullMQ | Real Redis, no workers by default |
| better-auth | Real plugin stack against test DB |
| Email delivery | Mock at producer/worker boundary; assert queue job payload |
| Stripe API | Mock `BillingService.getStripeClient()` or use Stripe test fixtures + webhook signature helper |
| Session middleware | Real cookies from better-auth sign-in flow |

## Suggested suites

### 1. Health & plumbing

- `GET /api/health` → `{ status: "ok" }`
- Unknown route → structured 404
- Validation middleware → 400 with issues

### 2. Auth flows (better-auth)

Use supertest agent to preserve cookies:

1. Sign up user
2. Verify email (stub verification token from DB or test-only endpoint)
3. Sign in
4. `GET /api/users/session` returns session + user
5. Sign out → session null

Future:

- Password reset enqueues `reset-password` job
- Organization invite enqueues `invitation` job

### 3. Authorization

- Non-admin → `403` on `/admin/queues`
- Admin user (`role = 'admin'`) → dashboard HTML loads
- Unauthenticated → `401`

### 4. Queue integration

1. Trigger auth callback that sends email
2. Assert Redis queue contains exactly one job with expected `type` and payload
3. Optionally run a single worker pass in-process and assert side effect (log sink / mock mailer)

### 5. Billing (when routes exist)

- Owner can manage subscription reference
- Member gets forbidden from Stripe authorize hook
- Stripe webhook route validates signature (mock payload + signed header)

## Test data strategy

- Use UUIDv7 fixtures (same generators as production)
- Factory helpers: `createUser()`, `createOrganization()`, `createAdminSession()`
- Truncate auth tables in `beforeEach` or wrap each test in a transaction rolled back after

## Directory layout

```text
apps/backend/
  test/
    e2e/
      create-test-app.ts
      helpers/
        auth-agent.ts
        db.ts
        queue.ts
      health.e2e.test.ts
      auth.e2e.test.ts
      queues.e2e.test.ts
      admin-dashboard.e2e.test.ts
    setup.ts                 # unit test env
  vitest.config.ts           # unit tests
  vitest.e2e.config.ts       # e2e tests
  .env.test.example
```

## CI pipeline

1. Start `postgres` + `redis` services
2. `pnpm db:migrate` against test database
3. `pnpm test` (unit, parallel)
4. `pnpm test:e2e` (serial, ~30–120s timeout)
5. Upload coverage from unit tests; e2e focuses on behavior not line coverage

## Phase rollout

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Test app factory, health, 404, session route | Done |
| **Phase 2** | Auth sign-up/sign-in/session e2e with real DB | Done |
| **Phase 3** | Queue assertions for email producers | Done |
| **Phase 4** | Admin dashboard auth + billing/webhook tests | Partial (dashboard auth done; billing pending routes) |

## Running e2e locally

```bash
cp .env.test.example .env.test
docker exec postgres psql -U postgres -c "CREATE DATABASE postgres_test"
pnpm test:e2e
```

Or with compose + migrate:

```bash
pnpm test:e2e:docker
```

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Flaky auth cookies | Always use supertest `.agent()`; set `BASE_URL` to test server |
| Stripe/better-auth version drift | Pin webhook fixtures; smoke test CLI schema in CI |
| Slow suite | Keep workers off by default; share one migrated DB per file |
| Email sent accidentally | Worker disabled in e2e app factory; assert queue only |

## Immediate next steps

1. Add `supertest` + `@types/supertest` dev dependencies
2. Create `.env.test.example` with isolated DB/Redis URLs
3. Implement `test/e2e/create-test-app.ts`
4. Land Phase 1 tests (`health`, `not-found`, `users/session` unauthenticated)
