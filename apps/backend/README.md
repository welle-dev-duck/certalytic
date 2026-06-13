# Backend (Express)

TypeScript Express API for Certalytic. Postgres is only accessed here. The Next.js app talks to this server for auth (`/api/auth/*`) and API routes.

## Structure

```
src/
  config/          # env validation (zod)
  db/              # drizzle client + schema
  dto/             # shared API schemas (health, errors)
  lib/             # validate middleware, sendJson, errors
  middleware/      # express middleware
  modules/
    auth/          # better-auth config, instance, router
    billing/       # stripe client, billing.dto.ts, service
    users/         # controller / service / router / users.dto.ts
  app.ts           # express app factory
  index.ts         # entry point
```

## DTOs (Zod)

- Each module defines schemas in `*.dto.ts`; types come from `z.infer<typeof schema>`.
- Use `validate({ body, query, params })` from `lib/validate.ts` on routes for input.
- Use `sendJson(res, schema, data)` from `lib/response.ts` for output.
- Env vars are validated in `config/env.ts` at startup.

## Setup

From the repo root:

```bash
cd apps/backend
cp .env.example .env
```

Install dependencies:

```bash
pnpm add express cors dotenv better-auth @better-auth/stripe drizzle-orm pg stripe
pnpm add -D typescript tsx @types/express @types/cors @types/node @types/pg drizzle-kit eslint typescript-eslint
```

Start local Postgres (optional):

```bash
docker compose up -d postgres
```

Run migrations (copy `drizzle/` from `backend-old` or generate fresh):

```bash
pnpm db:migrate
```

Dev server:

```bash
pnpm dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3000`) |
| `BASE_URL` | Public API URL - better-auth `baseURL` |
| `WEB_APP_URL` | Next.js origin for CORS / trusted origins |
| `DATABASE_URL` | Postgres connection string |
| `STRIPE_SECRET_KEY` | Optional - enables Stripe plugin |
| `STRIPE_WEBHOOK_SECRET` | Required when Stripe plugin is enabled |

## Web app

Point the frontend auth client at this server:

```
NEXT_PUBLIC_AUTH_URL=http://localhost:3000/api/auth
```
