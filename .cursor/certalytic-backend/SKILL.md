---
description: >-
  Certalytic Express backend conventions: manual DI, module layout, queues,
  Zod DTOs, explicit TypeScript return types, better-auth, BullMQ, Vitest.
  Use when adding or changing code in apps/backend.
globs: apps/backend/**/*.ts
alwaysApply: false
---
# Certalytic Backend

Standards for `apps/backend`. Match existing code before introducing new patterns.

## Non-negotiables

1. **Explicit return types** on every function, method, and arrow handler - including `async`, middleware, factories, and test helpers.
2. **Manual constructor DI** - no DI container, no service locators.
3. **Zod at boundaries** - env, request validation, JSON responses, queue job payloads.
4. **Modules own domain logic** - `src/queues/` owns BullMQ infrastructure only.
5. **Never read `process.env` outside `src/config/env.ts`** (except test setup files).
6. **Never boot `src/index.ts` in tests** - use `createApp()` or `createTestApp()`.

---

## Folder layout

```
apps/backend/src/
  app.ts              # createApp(deps) - HTTP wiring, no listen()
  index.ts            # Bootstrap: Redis, queues, workers, listen()
  config/env.ts       # Zod-validated env
  db/                 # Drizzle client + schema/
  dtos/               # Cross-cutting API schemas (health, errors)
  lib/                # Stateless shared utilities
  middleware/         # Express middleware + terminal handlers
  modules/{feature}/  # Domain modules
  queues/             # BullMQ queue definitions, registry, dashboard
  types/              # Global TS augmentations (express.d.ts)
  test/               # Unit-test helpers/fixtures ONLY (no *.test.ts here)

apps/backend/test/e2e/   # E2E tests (*.e2e.test.ts)
```

| Put it here | Not here |
|---|---|
| Queue creation, retry options, Bull Board | Business enqueue/process logic |
| `{feature}.producer.ts`, `{feature}.worker.ts` | `src/queues/` |
| Unit tests co-located as `*.test.ts` | `src/test/*.test.ts` |
| E2E tests | `src/` |

---

## Dependency injection

**Split bootstrap from HTTP wiring.**

```ts
// index.ts - infrastructure + lifecycle
const queues = new Queues(redisConnection);
const emailsProducer = new EmailsProducer(queues.emails);
const emailsWorkers = new EmailsWorkers(redisConnection, emailsService);
const app = createApp({ emailsProducer, queues });
```

```ts
// app.ts - HTTP only; workers NEVER start here
export type CreateAppDependencies = {
  emailsProducer: EmailsProducer;
  queues: Queues;
};

export function createApp(deps: CreateAppDependencies): Express {
  const authService = new AuthService(db);
  const billingService = new BillingService(db);
  const auth = new Auth(db, authService, billingService, deps.emailsProducer);
  // service → controller → router → app.use(...)
}
```

### DI rules

| Layer | Receives via constructor |
|---|---|
| Service | `Database` (+ other services if needed) |
| Controller | Its service |
| Router | Its controller |
| Auth | `Database`, `AuthService`, `BillingService`, `EmailsProducer` |
| Producer | BullMQ `Queue` |
| Worker | Redis connection + domain service |

- Export **`CreateAppDependencies`** for test factories.
- Pass **only swappable infra** into `createApp` (queues, producers). Use singleton `db` from `src/db/index.ts`.
- Cross-module imports: **`import type`** for types.

---

## Module patterns

### REST module (template: `users`)

```
modules/users/
  users.service.ts
  users.controller.ts
  users.router.ts
  users.dto.ts
  users.*.test.ts
```

| File | Responsibility |
|---|---|
| `*.service.ts` | DB + business logic; no `req`/`res` |
| `*.controller.ts` | Handlers; reads `req`; calls `sendJson` |
| `*.router.ts` | `Router`; binds controller methods; export `readonly router` |
| `*.dto.ts` | Zod schemas + inferred types |

Wire in `app.ts`: `Service → Controller → Router → app.use('/api/users', ...)`.

### Auth module (better-auth - no controller)

```
modules/auth/
  auth.ts           # Auth class + export const auth (CLI schema gen)
  auth.service.ts   # DB helpers for hooks
  auth.router.ts    # readonly handler via toNodeHandler()
  auth.types.ts     # AuthSession, AuthInstance
```

Mount **before body parsers**: `app.all('/api/auth/*splat', authRouter.handler)`.

Email callbacks **enqueue only** - never send inline:

```ts
sendVerificationEmail: async ({ user, url }): Promise<void> => {
  await this.emailsProducer.enqueueVerification({ user, url });
},
```

### Service-only module (template: `billing`)

Use when logic is consumed by other modules but has no HTTP routes yet.

### Job module (template: `emails`)

```
modules/emails/
  emails.service.ts    # process(job)
  emails.producer.ts   # typed enqueue methods
  emails.worker.ts     # BullMQ workers
  dtos/                # one file per job type + union
```

Queue infra lives in `src/queues/` - modules never define `new Queue()` directly except via injected `Queue`.

---

## Naming

### Files - kebab-case + dot role

`users.service.ts`, `emails.producer.ts`, `error-handler.ts`, `require-admin.ts`

### Classes - PascalCase

`UsersService`, `EmailsWorkers`, `AuthRouter`

### Exports

| Kind | Pattern | Example |
|---|---|---|
| Zod schema | `{name}Schema` | `sessionResponseSchema` |
| Inferred type | `{Name}Dto` / domain type | `SessionResponseDto`, `EmailJob` |
| Constant | `SCREAMING_SNAKE` | `EMAILS_QUEUE_NAME`, `ADMIN_ROLE` |
| Factory | `create{Name}` | `createApp`, `createEmailsQueue` |
| Queue options | `{name}QueueDefaultJobOptions` | `emailsQueueDefaultJobOptions` |

### Routes

- REST: `/api/{feature}/...`
- Auth: `/api/auth/*`
- Admin dashboard: `/admin/queues`

---

## Typing (strict)

### Explicit return types - always

```ts
// ✅
async getDefaultOrganization(userId: string): Promise<string | undefined> { ... }
export function createApp(deps: CreateAppDependencies): Express { ... }
export function validate(schemas: RequestSchemas): RequestHandler { ... }
getSession = async (req: Request, res: Response): Promise<void> => { ... };

// ❌ missing return type
async getDefaultOrganization(userId: string) { ... }
export function createApp(deps: CreateAppDependencies) { ... }
```

Also type: test helpers, mock factories, `beforeAll`/`afterAll` callbacks when non-trivial.

### Database

```ts
export type Database = typeof db; // src/db/index.ts
constructor(private readonly db: Database) {}
```

### Auth session - derive, don't hand-write

```ts
export type AuthInstance = Auth['instance'];
export type AuthSession = Awaited<
  ReturnType<AuthInstance['api']['getSession']>
>;
```

Augment `Express.Request` in `src/types/express.d.ts`: `session: AuthSession | null`.

### DTOs

```ts
export const sessionResponseSchema = z.object({ session: z.unknown().nullable() });
export type SessionResponseDto = z.infer<typeof sessionResponseSchema>;
```

- Job payloads: **`z.discriminatedUnion('type', [...])`** in `{module}/dtos/`.
- One DTO file per job/concern in `dtos/` subfolder when a module has multiple schemas.

### Imports

`verbatimModuleSyntax: true` - use `import type` for type-only imports.

### IDs

UUIDv7 via `generateId()` from `src/lib/id.ts` - used in better-auth config and tests.

---

## Express

### Middleware order (`createApp`)

1. `trust proxy` → CORS → `/api/health`
2. Auth handler (**before** body parsers)
3. `express.json` / `urlencoded`
4. `createSessionMiddleware(auth)`
5. Feature routers
6. Queue dashboard (`requireAdmin`)
7. `notFound` → `errorHandler`

### Responses

Always use `sendJson(res, schema, data, statusCode?)` - never raw `res.json()` for API routes.

### Errors

| Class | When |
|---|---|
| `AppError(message, statusCode, code?)` | Operational errors → `next(err)` |
| `ValidationError` | Zod failures from `validate()` |
| `NotFoundError` | 404 |

Shape: `{ error: { message, code?, issues? } }` via `apiErrorSchema`.

### Validation

```ts
router.post('/x', validate({ body: createSchema }), controller.create);
```

### Auth guards

`requireAdmin` - checks `req.session?.user` and `role === 'admin'`.

---

## Queues

| Layer | Location |
|---|---|
| Queue + options + registry + dashboard | `src/queues/` |
| Producer / worker / service / dtos | `src/modules/{feature}/` |

```ts
// Producer - adds discriminant `type`
async enqueueVerification(data: Omit<VerificationEmailJob, 'type'>): Promise<void> {
  await this.queue.add('verification', { type: 'verification', ...data });
}

// Worker - parse with Zod, delegate to service
const payload = emailJobSchema.parse(job.data);
await this.emailsService.process(payload);
```

- Register new queues in `Queues` class (`all()`, `close()`).
- Start workers in `index.ts` only - not in tests/e2e by default.

---

## Config & env

```ts
// src/config/env.ts - sole process.env access in app code
export const env = envSchema.parse(process.env);
```

- `.env.example` / `.env.test.example` committed; `.env` gitignored.
- Unit tests: `src/test/setup.ts`. E2E: `test/e2e/setup.ts` loads `.env.test`.

---

## Testing

| | Unit | E2E |
|---|---|---|
| Config | `vitest.config.ts` | `vitest.e2e.config.ts` |
| Location | `src/**/*.test.ts` | `test/e2e/**/*.e2e.test.ts` |
| App entry | Mock deps / direct fn calls | `createTestApp()` → `createApp()` |
| DB/Redis | Mocked | Real (dedicated `*_test` DB) |

Helpers: `src/test/helpers/` (unit), `test/e2e/helpers/` (e2e).

---

## Adding a feature (checklist)

**REST endpoint**
1. `modules/{name}/{name}.{service,controller,router,dto}.ts`
2. Wire in `app.ts`
3. `sendJson` + Zod schema for every response
4. `validate({ body })` on mutating routes
5. Co-locate `{name}.*.test.ts`

**Background job**
1. Queue in `src/queues/` + register in `Queues`
2. `{name}.producer.ts`, `{name}.worker.ts`, `{name}.service.ts`, `dtos/`
3. Producer into `CreateAppDependencies` if other modules enqueue
4. Worker in `index.ts`

**E2E**
1. `test/e2e/{name}.e2e.test.ts`
2. `beforeEach`: truncate auth tables + drain queues

---

## Additional reference

- Full file index and e2e plan: [reference.md](reference.md)
- E2E rollout: `apps/backend/docs/e2e-test-plan.md`
