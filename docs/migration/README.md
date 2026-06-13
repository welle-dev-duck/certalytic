# Certalytic migration (Laravel → Turborepo)

This folder tracks the migration from the legacy Laravel + Inertia app in [`php-migration/`](../../php-migration/) to the Turborepo monorepo (`apps/backend`, `apps/web`).

## Documents

| Document | Purpose |
|---|---|
| [Backend migration plan](./backend-migration-plan.md) | Phased Express + Drizzle + BullMQ port of domain logic, queues, billing, and integrations |
| [Frontend migration plan](./frontend-migration-plan.md) | Next.js page parity, react-hook-form + zod + react-query, **pixel-faithful UI** from the Laravel app |
| [Async job → UI updates](./async-job-ui-updates.md) | Screening/export progress via **WebSockets** (Redis pub/sub + WS server) - **implemented** |

**List APIs:** cursor pagination (`limit` + `cursor`) on `GET /api/candidates` and `GET /api/roles` - see backend plan §4.

## Product & marketing (moved from `php-migration/`)

| Document | Purpose |
|---|---|
| [Product overview](../product-overview.md) | Canonical product/engineering spec (updated for Turborepo stack) |
| [Product pitch](../product-pitch.md) | Sales narrative |
| [LinkedIn outreach](../linkedin-outreach.md) | Outreach template |

## Legacy reference

- **Source app:** `php-migration/` - Laravel 13, Fortify, Inertia React, Horizon, Cashier
- **Target backend:** `apps/backend` - Express, better-auth, Drizzle, BullMQ (see `.cursor/certalytic-backend/SKILL.md`)
- **Target frontend:** `apps/web` - Next.js App Router, shadcn, react-hook-form, zod, TanStack Query

## Migration status (high level)

| Area | Legacy | Target | Status |
|---|---|---|---|
| Auth (email/password, 2FA, verify) | Fortify | better-auth | **Done** |
| Organizations / teams / invites | Jetstream-style teams | better-auth organization plugin | **Done** |
| Stripe subscriptions + screening packs | Cashier on `Team` | `@better-auth/stripe` + `BillingService` | **Done** |
| Screening token billing | Team counters + packs | `billing` table (`plan_tokens`, `refill_tokens`) | **Done** |
| Email (verify, invite, reset) | Laravel Mail | BullMQ `emails` queue | **Done** |
| Candidates / screening pipeline | Full pipeline | `modules/candidates/`, `modules/screening/` | **Done** |
| Roles / scan assets / exports | Full | `modules/roles/` + `PdfDocumentBuilder` | **Done** |
| PDF exports | DomPDF | `pdf-lib` (`PdfDocumentBuilder`) | **Done** |
| Cursor list pagination | Offset pages | UUIDv7 cursor on candidates + roles | **Done** |
| Realtime job status | Inertia polling | WebSockets + Redis pub/sub | **Done** |
| Rate limits | Laravel throttle | Redis sliding window middleware | **Done** |
| Transcription tool | Full (legacy) | - | **Removed** - not ported |
| Product UI pages | ~30 Inertia pages | Next.js `(app)/` routes | **Mostly done** - visual parity sign-off pending |
| Marketing stats/roadmap API | Env-driven config | Static `apps/web/lib/marketing-data.ts` | **Partial** |

*Last updated: June 2026.*
