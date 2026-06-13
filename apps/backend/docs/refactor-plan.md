# Backend refactor plan

Multi-phase cleanup from the architecture audit. Each phase is independently mergeable.

## Phase 1 - Composition root & lifecycle (this PR)

- [x] Single `createContainer()` composition root; no duplicate service graphs in `index.ts` / `app.ts`
- [x] Shared Redis clients with graceful shutdown (pool, rate-limit Redis, pub/sub)
- [x] `RealtimeSubscriber` accepts injected Redis
- [x] Format `app.ts` (remove spurious blank lines)
- [x] Remove `import 'dotenv/config'` from `auth.ts` (entrypoint only)
- [x] `BillingService` requires `PlanFeaturesService`
- [x] Remove unused `CERTALYTIC_PRIORITY_QUEUE` env var
- [x] Add `todo.md` for email delivery (item 10 - deferred)

## Phase 2 - Data integrity

- [x] Atomic token debit (`SELECT … FOR UPDATE` inside transaction)
- [x] Transactional candidate create (DB steps in one transaction; compensating cleanup for storage/queue)
- [x] Remove bulk import endpoint (`POST /candidates/import`) - not product-supported

## Phase 3 - Queue boundaries

- [x] Dedicated `role-exports` BullMQ queue + producer + worker
- [x] Remove `generate-export` jobs from screening queue / worker
- [x] Update e2e queue tests and dashboard

## Phase 4 - Typed screening evaluation

- [x] Zod schema for Mistral evaluation JSON (`ScreeningEvaluation`)
- [x] Parse at `CandidateEvaluator` boundary; remove `Record<string, unknown>` downstream
- [x] Fix `cvFormat as never` with proper enum/type from schema

## Phase 5 - Observability & API contracts

- [x] Replace all `console.*` with structured `logger` (emails worker, roles worker, public-profile-fetcher)
- [x] Cursor-only pagination: drop unused `page` from query schemas and `paginateByPage`
- [x] Keep `limit: 1` in allowed page sizes until prod hardening
- [x] Extend `express.d.ts` for validated query types; remove controller `as unknown as` casts

## Phase 6 - Structure & workers

- [x] Inject `CandidateReportService` via container
- [x] BullMQ: one `Worker` per queue with `concurrency: N` (not N workers × concurrency 1)
- [x] Split `pdf-document-builder.ts` into layout primitives + section renderers
- [x] Extract round-sync from `ScreeningService` into dedicated module
- [x] Slim `CandidateReportService` using typed evaluation schema from Phase 4

## Explicitly out of scope

- **Dual Better Auth config** (`auth.ts` module export + `Auth` class) - required for CLI schema generation
- **Email delivery implementation** - tracked in `todo.md`
