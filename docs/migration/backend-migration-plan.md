# Backend migration plan (Laravel → Express)

Migrate domain logic from `php-migration/` into `apps/backend` while preserving product behavior documented in [product-overview.md](../product-overview.md).

**Reference implementation:** `php-migration/app/`, `php-migration/routes/web.php`, `php-migration/database/migrations/`

**Target patterns:** `.cursor/certalytic-backend/SKILL.md` — modules, manual DI, Drizzle, BullMQ, explicit return types.

### Intentional removals (do not port from Laravel)

The Turborepo app **drops the entire Tools / Transcription product surface** from the legacy PHP app. This is not deferred — it is excluded from scope.

| Legacy area | Action |
|---|---|
| Tools page (`/tools`, `/tools/transcription`) | **Not ported** |
| `TranscriptionController`, `ToolsController` | **Not ported** |
| `TranscribeAudioJob`, `transcriptions` queue | **Not ported** |
| `audio_transcriptions` table / model | **Not ported** |
| `transcript_tokens` on team/org | **Not ported** — replaced by `billing` (screening tokens only) |
| `TranscriptTokenCredit`, transcript pack Stripe prices | **Not ported** |
| Mistral Voxtral / audio transcription env vars | **Not ported** |
| `interview_rounds` audio columns (in-flow transcription) | **Not ported** — text transcript paste/upload only |

**Still in scope:** Interview **text** transcripts (paste or file upload merged into screening) — that is core screening input, not the standalone transcription tool.

**Screening quota:** Store in a dedicated `billing` table (one row per organization), not on the organization record and not split across legacy token types.

---

## 1. Current state

### Already in `apps/backend`

| Capability | Module / location |
|---|---|
| HTTP app shell, env, errors | `src/app.ts`, `middleware/` |
| Auth (better-auth + org + stripe plugins) | `modules/auth/` |
| Session on `req.session` | `middleware/session.ts` |
| Users read API | `modules/users/` |
| Billing checkout portal (Stripe) | `modules/billing/` |
| Email jobs (verify, invite) | `modules/emails/`, `queues/emails.queue.ts` |
| Bull Board (admin) | `queues/dashboard.ts` |
| UUIDv7 IDs | `lib/id.ts`, auth schema |
| Unit + e2e tests | `src/**/*.test.ts`, `test/e2e/` |

### Not yet ported

Everything in the screening product domain: candidates, roles, Mistral pipeline, screening-token billing, S3 storage, PDF exports, rate limits, marketing config API, org-scoped authorization beyond org membership. (Org RBAC is largely handled by better-auth: members can run screenings and manage roles; billing and org settings are owner/admin only.)

---

## 2. Architecture mapping

| Laravel | Express target |
|---|---|
| Fortify + session | better-auth (`modules/auth/`) — **done** |
| `Membership` + invitations | Organization plugin +  (invites → emails queue) |
| Cashier on `Team` | `@better-auth/stripe` + extend `BillingService` for screening packs |
| Horizon (`default`, `screenings-priority`) | BullMQ queues in `src/queues/` + workers in `index.ts` |
| `ProcessCandidateScreeningJob` | `modules/screening/screening.worker.ts` |
| `ImportCandidatesJob` | `modules/candidates/import.worker.ts` |
| `ProcessRoleDocumentJob` | `modules/roles/document.worker.ts` |
| `GenerateRoleExportPdfJob` | `modules/roles/export.worker.ts` |
| ~~`TranscribeAudioJob`~~ | **Removed** — transcription tool not ported |
| `teams.transcript_tokens` / screening counters on team | `billing` table — `plan_tokens`, `refill_tokens` per `organization_id` |
| Eloquent models | Drizzle schemas in shared `db/schema/` |
| Form requests / policies | Zod DTOs + service-layer authorization |
| S3 via Flysystem | `@aws-sdk/client-s3` in `src/storage/` |
| DomPDF | `@react-pdf/renderer` or `puppeteer`/`pdf-lib` — **decide in Phase 4** |
| Mistral HTTP | `modules/mistral/` client (port `MistralClient` behavior @mistralai/mistralai pnpm package) |
| Inertia shared props | REST/JSON endpoints consumed by React Query on frontend |
| Laravel `paginate($perPage)` (offset pages) | **Cursor pagination** on UUIDv7 `id` — see §4 |
| `config/certalytic.php` | `src/config/product.ts` + env vars |

---

## 3. Database migration strategy

### Approach

1. **Schema parity first** — Drizzle migrations mirroring Laravel tables (names/types aligned where possible).
2. **One-time data migration script** not needed, fresh db because the project is in development only
3. **Greenfield dev** — fresh migrations + seed fixtures from `php-migration/tests/fixtures/` scenarios.

### Tables to add (order matters for FKs)

```
billing                 # screening quota — see schema below
roles
role_documents
role_exports
candidates
interview_rounds        # text transcripts only — no audio_* columns
```

**`billing` table (screening tokens):**

| Column | Type | Notes |
|---|---|---|
| `id` | UUIDv7 PK | |
| `organization_id` | UUID FK → organization | Unique — one row per org |
| `plan_tokens` | integer | Monthly plan allowance (reset on billing cycle) |
| `refill_tokens` | integer | One-off pack credits (screening packs) |

- Debit order: typically `plan_tokens` first, then `refill_tokens` (confirm in `BillingService` when implementing).
- No `transcription_tokens`, no `transcript_token_credits`, no `audio_transcriptions`.
- Subscription plan metadata stays on Stripe / better-auth; **consumable screening balance** lives only in `billing`.

**Auth tables:** Already in `db/schema/auth.schema.ts`

### ID strategy

- New records: **UUIDv7** (existing backend convention).
- List pagination cursors use **`id`** (UUIDv7 is time-ordered → stable `ORDER BY id DESC` matches Laravel `latest()`).

---

## 4. Cursor pagination

**Scope (migration MVP):** cursor-based list endpoints for **Candidates** and **Roles** only. Other lists (dashboard recent screenings, etc.) can use small fixed limits or gain pagination later.

**Not porting:** Laravel offset pagination (`?page=2&per_page=25`). The client sends cursor params on each REST request; the server never exposes page numbers.

### Request (query params)

Validated with Zod on every list handler (shared helper in `src/lib/pagination.ts`):

| Param | Type | Required | Notes |
|---|---|---|---|
| `limit` | integer | no | Default `25`. Allowed: `10`, `25`, `50`, `100` (match legacy page sizes). Max enforced server-side. |
| `cursor` | string (UUID) | no | Omitted on first page. Value is the **last `id` from the previous response** (`nextCursor`). |

Filters are separate query params and apply **within** the cursor window (same as Laravel filters + paginate):

| Resource | Filter params (in addition to pagination) |
|---|---|
| **Candidates** | `search`, `role_id`, `status` |
| **Roles** | `search` (if ported from legacy) |

All list queries are scoped to the **active organization** from session (not passed by client).

**Examples:**

```
GET /api/candidates?limit=25
GET /api/candidates?limit=25&cursor=01932a8e-....&status=processing&role_id=...
GET /api/roles?limit=50&cursor=01932a8e-....
```

### Response shape

Consistent envelope for both resources (Zod response DTO):

```json
{
  "data": [ /* RoleListItemDto | CandidateListItemDto */ ],
  "pagination": {
    "limit": 25,
    "nextCursor": "01932a8e-7c3b-7b2e-8c0a-9f1e2d3c4b5a",
    "hasNextPage": true
  }
}
```

- `nextCursor`: `id` of the **last row** in `data`, or `null` when `hasNextPage` is false.
- List items use **summary DTOs** (not full dossier/report payloads).

### Query logic (Drizzle)

Default sort: **`id DESC`** (newest first — parity with Laravel `latest()`).

```sql
-- first page
WHERE organization_id = $orgId
  AND (...filters...)
ORDER BY id DESC
LIMIT $limit + 1

-- subsequent pages (cursor = last seen id)
WHERE organization_id = $orgId
  AND (...filters...)
  AND id < $cursor
ORDER BY id DESC
LIMIT $limit + 1
```

Fetch `limit + 1` rows; if more than `limit` exist, `hasNextPage = true` and trim the extra row. Cursor is opaque to the client (the UUID primary key).

### Shared implementation

| Piece | Location |
|---|---|
| Query parsing | `src/lib/pagination.ts` — `parsePaginationQuery(req)` |
| Paginated execute | `src/lib/pagination.ts` — `paginateByCursor({ db, query, limit, cursor })` |
| Zod schemas | `src/dtos/pagination.dto.ts` — request + response wrappers |
| Service usage | `roles.service.list()`, `candidates.service.list()` return paginated envelope |

### Client contract (for frontend)

- First fetch: `limit` only.
- “Load more” / next page: pass `cursor: pagination.nextCursor` from the previous response with the same `limit` and filters.
- React Query: `useInfiniteQuery` with `getNextPageParam: (last) => last.pagination.nextCursor`, or manual cursor state — see [frontend-migration-plan.md](./frontend-migration-plan.md).

### Tests

- Unit: cursor math (empty, single page, multi-page, invalid cursor).
- E2e: create N candidates → page through with `cursor` until `hasNextPage` is false; filters + pagination combined.

---

## 5. Phased implementation

### Phase 0 — Foundation (complete)

- [x] Express app, auth, emails queue, billing skeleton, tests, e2e harness
- [ ] Document env parity — extend `config/env.ts` with Mistral, S3, product limits (mirror `.env.example` in php-migration)

### Phase 1 — Organizations & authorization

**Goal:** Org-scoped routes work; invitations; role checks (owner and admin vs member).

important: we always scope by active organization (stored on the session currently, so by theory it should already be part of the request)

---

### Phase 2 — Roles & documents

**Goal:** CRUD roles; upload scan documents (Scale+); enqueue OCR job.

| Task | Laravel reference | Target |
|---|---|---|
| Role CRUD | `RoleController`, `Role` | `modules/roles/roles.service.ts` |
| Roles list pagination | `RoleController@index` offset pages | `GET /api/roles?limit=&cursor=` — cursor pagination (§4) |
| Document upload | `RoleDocumentController`, S3 | `modules/roles/documents.service.ts` + storage |
| OCR job | `ProcessRoleDocumentJob` | `roles` queue worker → Mistral OCR |
| Plan gating | `EnsureSubscribed`, plan features | `modules/billing/plans.ts` — feature flags per plan |

**Queues:** Add `roles` queue (or reuse `default` with job names).

**Storage module (`src/storage/`):**

- `putObject`, `signedUrl`, `deleteObject`
- Key convention: `{orgId}/roles/{roleId}/...` (match Laravel paths)

**List endpoint:**

```
GET /api/roles?limit=&cursor=&search=
```

---


### Phase 3 — Candidates & screening pipeline

**Goal:** Core product — create candidate, upload CV/transcripts, async Mistral evaluation, integrity score.

| Task | Laravel reference | Target |
|---|---|---|
| Candidate CRUD | `CandidateController` | `modules/candidates/` |
| Candidates list pagination | `CandidateController@index` offset pages | `GET /api/candidates?limit=&cursor=&search=&role_id=&status=` (§4) |
| Interview rounds | `InterviewRound`, merge logic | `candidates/interview-rounds.service.ts` |
| Screening job | `ProcessCandidateScreeningJob`, `CandidateScreeningService` | `modules/screening/` |
| Mistral client | `App\Services\Mistral\MistralClient` | `modules/mistral/mistral.client.ts` |
| Score formula | `IntegrityScoreCalculator` | `screening/integrity-score.ts` — **must match weights in product-overview** |
| Priority queue | `screenings-priority` | Separate BullMQ queue; priority flag on job |
| Rate limits | middleware in Laravel | `middleware/rate-limit.ts` per team/plan |
| Bulk import | `ImportCandidatesJob` | CSV parse + batch enqueue |

**Screening job steps (port in order):**

1. Validate candidate state → `processing`
2. OCR CV if PDF/image
3. Parse/merge transcripts (round 1 merge + virtual segments)
4. Mistral chat calls (CV authenticity, interview signal, cross-source, identity)
5. Supplementary analyses (behaviour, personality) — excluded from score
6. Persist `score_breakdown` JSON; status → `completed` / `failed`
7. Debit one screening token from `billing` (`plan_tokens` then `refill_tokens`)

**Endpoints:**

```
GET    /api/candidates?limit=&cursor=&search=&role_id=&status=  → paginated list (§4)
POST   /api/candidates -> org is decided by the users active org
GET    /api/candidates/:id -> org is decided by the users active org
PATCH  /api/candidates/:id -> org is decided by the users active org
POST   /api/candidates/:id/retry -> org is decided by the users active org
POST   /api/candidates/import -> org is decided by the users active org
GET    /api/candidates/:id/report -> org is decided by the users active org
```

**Tests:** Port `CandidateScreeningTest`, fixture-driven cases from `tests/fixtures/scenarios/`.

---

### Phase 4 — Exports & PDF

**Goal:** Per-candidate and batch role PDF exports; watermarks.

| Task | Laravel reference | Target |
|---|---|---|
| Single export | `CandidateExportController` | Sync or short queue job |
| Batch export | `GenerateRoleExportPdfJob` | `roles` queue |
| PDF layout | Blade/DomPDF templates | React-PDF components or HTML→PDF — **replicate layout from Laravel views** |
| Watermark | plan-based | `modules/billing/plans.ts` |

---

### Phase 5 — Billing & screening tokens

**Goal:** Subscriptions, screening packs, `billing` table CRUD, webhooks, enforce quota before enqueue.

| Task | Laravel reference | Target |
|---|---|---|
| `billing` schema | `teams` screening counters, `TranscriptTokenCredit` (screening only) | `db/schema/billing.schema.ts` — `plan_tokens`, `refill_tokens` |
| Subscription plans | Cashier | better-auth stripe (partial) |
| Plan token reset | monthly allowance on team | Cron/webhook: reset `plan_tokens` from plan tier on cycle |
| Screening pack checkout | custom checkout | Extend `BillingService` → credit `refill_tokens` |
| Debit on screening | `TokenService` (screening path only) | `BillingService.debitScreening(organizationId)` |
| Webhooks | Cashier webhooks | Stripe webhook route (verify + idempotency) |
| Plan limits | config | Enforce in services before enqueue; return 402/403 when exhausted |

**Do not port:** `STRIPE_PRICE_TRANSCRIPT_FIVE_PACK`, transcript token checkout, `TranscribeAudioJob`, or any transcription billing.

**Env:** `STRIPE_PRICE_STARTER`, `GROWTH`, `SCALE`, `PACK_QUICK`, `PACK_SURGE`, `PACK_BOOST` — no transcript pack price.

---

### Phase 6 — Dashboard, settings, admin

| Task | Laravel reference | Target |
|---|---|---|
| Dashboard aggregates | `DashboardController` | `modules/dashboard/` — usage stats, recent screenings |
| User settings | `ProfileController`, 2FA | better-auth APIs + frontend |
| Admin impersonation | if any | Defer or port last |

---

### Phase 7 — Public & config

| Task | Target |
|---|---|
| Marketing stats | `GET /api/public/marketing` from env |
| Company/legal config | `GET /api/public/company` |
| Health | Already have patterns in e2e |

Landing page content stays frontend; backend only serves config JSON.

---

## 6. Queue topology (target)

```
src/queues/
  emails.queue.ts      # existing — verify, invite
  screening.queue.ts   # default + priority (priority option on job)
  roles.queue.ts       # document OCR + PDF export
  queues.ts            # registry
  dashboard.ts         # Bull Board — all queues
```

No `transcriptions` queue. Workers start only in `index.ts` (not in tests). Concurrency: tune screening separately from emails.

**Retry policy:** Reuse `queues/options.ts` (5 attempts, exponential backoff).

---

## 7. Mistral integration

Port from `php-migration/app/Services/Mistral/`:

| Concern | Notes |
|---|---|
| Chat completions | Screening prompts — **copy prompt text verbatim** initially |
| OCR | CV + role documents |
| ~~Transcription~~ | **Not used** — no Voxtral, no `MISTRAL_TRANSCRIPTION_MODEL` |
| Timeouts / retries | Laravel HTTP client settings → fetch/axios with retry |
| No fallback | Product requires real Mistral — fail job if API down |

Store prompts in `modules/screening/prompts/` as typed constants (easier to diff against PHP).

---

## 8. Async job status → UI (WebSockets)

See [async-job-ui-updates.md](./async-job-ui-updates.md) for full detail.

**Decision:** Push job status to the browser via **WebSockets** (improvement over Laravel’s 3–4s HTTP polling). Workers still persist state in PostgreSQL; after each status write they **publish** to Redis pub/sub; the Express WS server forwards events to subscribed clients.

| Concern | Backend responsibility |
|---|---|
| Screening progress | Worker sets `pending` → `processing` → `complete` \| `failed` + `error_message` |
| Push to UI | `realtime/publisher.ts` → Redis → `realtime/ws.server.ts` → `candidate.updated` event |
| Report data | `GET /api/candidates/:id` on terminal state (client invalidates React Query cache) |
| Role export progress | Same pattern → `role_export.updated` + `download_url` when `complete` |
| Auth | WS handshake validates better-auth session; rooms scoped by `organizationId` |
| Stripe webhooks | **Separate** — subscription/pack events update `billing`, not screening UI |

Add `src/realtime/` (publisher, WS server, channel constants). Hook screening and role-export workers after DB commit. Cosmetic progress stages in the UI remain client-side unless `currentStep` is added later.

---

## 9. Authorization model

```
Request → session middleware → requireAuth
       → resolveTeam(slug) → requireTeamMember
       → optional requireTeamOwner | requirePlanFeature('role_documents')
       → controller → service
```

Never trust `teamSlug` from body; always from URL + membership check.

---

## 10. Testing strategy

| Layer | Approach |
|---|---|
| Unit | Services, score calculator, `billing` debit/reset math, plan gating, cursor pagination — Vitest |
| Integration | Mistral client mocked; DB via test container or sqlite/pg test db |
| E2e | Extend `test/e2e/` — auth → create team → create role → screen candidate (mock Mistral) |
| Golden scenarios | Port PHP fixture JSON from `php-migration/tests/fixtures/scenarios/` |

Add `test/fixtures/scenarios/` mirroring Laravel structure.

---

## 11. Cutover checklist

- [ ] Drizzle migrations applied on production PG
- [ ] Redis + workers running (all queues)
- [ ] Stripe webhooks pointed to new backend URL
- [ ] S3 bucket/CORS unchanged or updated
- [ ] Mistral keys and model names verified
- [ ] Data ETL script tested on staging snapshot
- [ ] Rate limits and plan enforcement verified
- [ ] Bull Board admin access restricted (`requireAdmin`)
- [ ] Rollback: keep Laravel read-only until validation window closes

---

## 12. Suggested module tree (final)

```
src/lib/pagination.ts       # cursor parse + paginateByCursor helper
src/dtos/pagination.dto.ts  # shared list request/response Zod schemas
src/modules/
  auth/           # exists
  billing/        # exists — extend: billing table, screening debit, packs, webhooks
  emails/         # exists
  users/          # exists
  roles/
  candidates/
  screening/
  mistral/        # chat + OCR only — no transcription client
  storage/
  dashboard/
src/realtime/     # WS server, Redis pub/sub publisher, channel names
```

No `transcription/` or `tokens/` modules — screening balance is owned by `billing/`.

Each module: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `dtos/`, optional `*.worker.ts`, `*.test.ts`.

---

## 13. Risks & decisions

| Risk | Mitigation |
|---|---|
| PDF visual parity | Choose HTML→PDF if DomPDF layout hard to replicate; compare side-by-side with Laravel exports |
| Score drift | Unit tests with fixed Mistral mocks + same fixture inputs as PHP tests |
| Team vs Organization model | Single source of truth: better-auth org; attach product fields via `team_profiles` table |
| Session → API | Frontend uses cookies + React Query; no Inertia shared props — explicit endpoints for `auth`, `team`, `flash` |
| Long-running screenings | Job timeout > max Mistral latency; WS disconnect fallback (slow poll or refetch on reconnect) |
| WS auth / room leaks | Verify org membership before join; never subscribe by id alone without org check |

---

## 14. Estimated order of work

1. Phase 0 env + org authorization (1–2 weeks)
2. Roles + storage + OCR job (1 week)
3. Candidates + screening pipeline (2–3 weeks) — **critical path**
4. PDF exports (1 week)
5. Billing table + screening packs + webhooks (1 week)
6. Dashboard API + polish (1 week)

Parallelize frontend migration per [frontend-migration-plan.md](./frontend-migration-plan.md) once Phase 1 team APIs exist.
