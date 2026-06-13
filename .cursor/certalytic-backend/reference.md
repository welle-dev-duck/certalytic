# Certalytic Backend - Reference

## Key files

| Concern | Path |
|---|---|
| App factory | `src/app.ts` |
| Bootstrap | `src/index.ts` |
| Env | `src/config/env.ts` |
| DB | `src/db/index.ts`, `src/db/schema/auth.schema.ts` |
| Shared DTOs | `src/dtos/common.dto.ts` |
| Response / errors / validate | `src/lib/response.ts`, `errors.ts`, `validate.ts` |
| Session | `src/middleware/session.ts` |
| Users module (REST template) | `src/modules/users/*` |
| Auth module | `src/modules/auth/*` |
| Emails jobs | `src/modules/emails/*` |
| Queue infra | `src/queues/*` |
| Unit test helpers | `src/test/setup.ts`, `src/test/helpers/*` |
| E2E factory | `test/e2e/create-test-app.ts` |

---

## Typing examples

### Service

```ts
export class AuthService {
  constructor(private readonly db: Database) {}

  async getDefaultOrganization(userId: string): Promise<string | undefined> {
    const membership = await this.db.query.member.findFirst({ ... });
    return membership?.organizationId;
  }
}
```

### Controller

```ts
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  getSession = async (req: Request, res: Response): Promise<void> => {
    sendJson(res, sessionResponseSchema, { session: req.session });
  };
}
```

### Router

```ts
export class UsersRouter {
  readonly router: IRouter;

  constructor(usersController: UsersController) {
    this.router = Router();
    this.router.get('/session', usersController.getSession);
  }
}
```

### Middleware factory

```ts
export function createSessionMiddleware(auth: Auth): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.session = await auth.instance.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

### Test helper

```ts
export function createMockDb(options?: {
  member?: MemberRecord | null;
}): Database {
  return {
    query: { member: { findFirst: vi.fn().mockResolvedValue(options?.member ?? null) } },
  } as unknown as Database;
}
```

---

## Email DTO layout

```
modules/emails/dtos/
  email-user.dto.ts       # shared user shape
  reset-password.dto.ts   # single job schema + type
  verification.dto.ts
  invitation.dto.ts
  email-job.dto.ts        # discriminated union
```

---

## Queue file layout

```
queues/
  emails.queue-options.ts   # attempts, backoff, removeOn*
  emails.queue.ts           # EMAILS_QUEUE_NAME, createEmailsQueue()
  queues.ts                 # Queues registry class
  dashboard.ts              # Bull Board at /admin/queues
```

---

## Auth plugin wiring

| Plugin | Config note |
|---|---|
| `adminPlugin()` | Role on `user.role` |
| `organization()` | Invites → `emailsProducer.enqueueInvitation` |
| `stripe()` | `authorizeReference` → `billingService.canManageStripeSubscription` |

Standalone `export const auth = betterAuth({...})` at top of `auth.ts` for `pnpm auth:generate` - schema-relevant config only (plugins, DB adapter, generateId).

---

## E2E conventions

- Factory: `test/e2e/create-test-app.ts` - no workers
- DB name must contain `_test` (or set `E2E_ALLOW_SHARED_DB=true`)
- Verify email via token from queued job URL (not DB)
- `supertest` agent for cookie persistence
- `beforeEach`: `truncateAuthTables()` + `drainEmailQueue()`

Scripts: `pnpm test:e2e`, `pnpm test:e2e:docker`

---

## Anti-patterns

| Don't | Do instead |
|---|---|
| `process.env.FOO` in modules | `env.FOO` from `config/env.ts` |
| `res.json({ ... })` in controllers | `sendJson(res, schema, data)` |
| `new Queue()` in modules | Inject `Queue` into producer |
| Start workers in `createApp` | Start in `index.ts` only |
| Monolithic `emails.dto.ts` | `dtos/` folder, one concern per file |
| Omit function return types | Explicit `Promise<T>` / `T` always |
| Boot `index.ts` in tests | `createApp()` / `createTestApp()` |
