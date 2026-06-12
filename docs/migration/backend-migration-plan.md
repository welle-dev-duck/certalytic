# Backend migration plan (Laravel → Express)

Migrate domain logic from `php-migration/` into `apps/backend` while preserving product behavior documented in [product-overview.md](../product-overview.md).

**Reference implementation:** `php-migration/app/`, `php-migration/routes/web.php`, `php-migration/database/migrations/`

**Target patterns:** `.cursor/certalytic-backend/SKILL.md` — modules, manual DI, Drizzle, BullMQ, explicit return types.

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

Everything in the screening product domain: candidates, roles, Mistral pipeline, tokens, transcription, S3 storage, PDF exports, rate limits, marketing config API, team-scoped authorization beyond org membership.

---

## 2. Architecture mapping

| Laravel | Express target |
|---|---|
| Fortify + session | better-auth (`modules/auth/`) — **done** |
| `Team` + `Membership` + invitations | Organization plugin + `modules/teams/` (invites → emails queue) |
| Cashier on `Team` | `@better-auth/stripe` + extend `BillingService` for screening packs |
| Horizon (`default`, `screenings-priority`, `transcriptions`) | BullMQ queues in `src/queues/` + workers in `index.ts` |
| `ProcessCandidateScreeningJob` | `modules/screening/screening.worker.ts` |
| `ImportCandidatesJob` | `modules/candidates/import.worker.ts` |
| `ProcessRoleDocumentJob` | `modules/roles/document.worker.ts` |
| `GenerateRoleExportPdfJob` | `modules/roles/export.worker.ts` |
| `TranscribeAudioJob` | `modules/transcription/transcription.worker.ts` |
| Eloquent models | Drizzle schemas per module under `modules/*/schema/` or shared `db/schema/` |
| Form requests / policies | Zod DTOs + service-layer authorization |
| S3 via Flysystem | `@aws-sdk/client-s3` in `modules/storage/` |
| DomPDF | `@react-pdf/renderer` or `puppeteer`/`pdf-lib` — **decide in Phase 4** |
| Mistral HTTP | `modules/mistral/` client (port `MistralClient` behavior) |
| Inertia shared props | REST/JSON endpoints consumed by React Query on frontend |
| `config/certalytic.php` | `src/config/product.ts` + env vars |

---

## 3. Database migration strategy

### Approach

1. **Schema parity first** — Drizzle migrations mirroring Laravel tables (names/types aligned where possible).
2. **One-time data migration script** (optional, when cutting over) — ETL from PostgreSQL Laravel DB → new schema; run in maintenance window.
3. **Greenfield dev** — fresh migrations + seed fixtures from `php-migration/tests/fixtures/` scenarios.

### Tables to add (order matters for FKs)

```
teams (extend org or map organization.id → team profile)
team_invitations
roles
role_documents
role_exports
candidates
interview_rounds
audio_transcriptions
token_balances / token_transactions  (or transcript_token_credits)
```

**Auth tables:** Already in `db/schema/auth.schema.ts` (user, session, organization, member, invitation). Map Laravel `teams` fields (`plan`, `transcript_tokens`, Stripe columns) onto organization metadata or a `team_profiles` table keyed by `organizationId`.

### ID strategy

- New records: **UUIDv7** (existing backend convention).
- Migration ETL: preserve old integer IDs in a `legacy_id` column only if needed for audit; otherwise map via email/slug.

---

## 4. Phased implementation

### Phase 0 — Foundation (complete)

- [x] Express app, auth, emails queue, billing skeleton, tests, e2e harness
- [ ] Document env parity — extend `config/env.ts` with Mistral, S3, product limits (mirror `.env.example` in php-migration)

### Phase 1 — Teams & authorization

**Goal:** Team-scoped routes work; invitations; role checks (owner vs member).

| Task | Laravel reference | Target |
|---|---|---|
| Team profile on org | `Team`, `TeamController` | `modules/teams/` — plan, slug, `transcript_tokens`, settings |
| Membership roles | `Membership`, policies | Extend member role enum; `requireTeamMember`, `requireTeamOwner` middleware |
| Invitations | `TeamInvitation`, `InviteTeamMember` | Org invitation + emails queue (exists); accept flow API |
| Team switcher API | `current_team_id` on user | PATCH `/api/me/active-organization` or better-auth active org |
| Slug routing validation | `EnsureTeamAccess` middleware | Middleware: resolve `:teamSlug` → org id, verify membership |

**Endpoints (initial):**

```
GET    /api/teams/:slug
PATCH  /api/teams/:slug
GET    /api/teams/:slug/members
POST   /api/teams/:slug/invitations
DELETE /api/teams/:slug/members/:userId
```

**Tests:** Port scenarios from `TeamManagementTest`, `TeamInvitationTest`.

---

### Phase 2 — Roles & documents

**Goal:** CRUD roles; upload scan documents (Scale+); enqueue OCR job.

| Task | Laravel reference | Target |
|---|---|---|
| Role CRUD | `RoleController`, `Role` | `modules/roles/roles.service.ts` |
| Document upload | `RoleDocumentController`, S3 | `modules/roles/documents.service.ts` + storage |
| OCR job | `ProcessRoleDocumentJob` | `roles` queue worker → Mistral OCR |
| Plan gating | `EnsureSubscribed`, plan features | `lib/plans.ts` — feature flags per plan |

**Queues:** Add `roles` queue (or reuse `default` with job names).

**Storage module (`modules/storage/`):**

- `putObject`, `signedUrl`, `deleteObject`
- Key convention: `{teamId}/roles/{roleId}/...` (match Laravel paths)

---

### Phase 3 — Candidates & screening pipeline

**Goal:** Core product — create candidate, upload CV/transcripts, async Mistral evaluation, integrity score.

| Task | Laravel reference | Target |
|---|---|---|
| Candidate CRUD | `CandidateController` | `modules/candidates/` |
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
7. Token debit (if applicable)

**Endpoints:**

```
GET    /api/teams/:slug/candidates
POST   /api/teams/:slug/candidates
GET    /api/teams/:slug/candidates/:id
PATCH  /api/teams/:slug/candidates/:id
POST   /api/teams/:slug/candidates/:id/retry
POST   /api/teams/:slug/candidates/import
GET    /api/teams/:slug/candidates/:id/report
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
| Watermark | plan-based | `lib/plans.ts` |

---

### Phase 5 — Transcription tool

**Goal:** Standalone audio upload → diarized transcript; token billing.

| Task | Laravel reference | Target |
|---|---|---|
| Upload audio | `TranscriptionController` | `modules/transcription/` |
| Job | `TranscribeAudioJob` | `transcriptions` queue |
| Mistral Voxtral | config | Same client module |
| Token debit | `TokenService` | `modules/tokens/` |

---

### Phase 6 — Billing & tokens (full parity)

**Goal:** Screening packs, transcript packs, webhooks, idempotent credits.

| Task | Laravel reference | Target |
|---|---|---|
| Subscription plans | Cashier | better-auth stripe (partial) |
| Screening pack checkout | custom checkout | Extend `BillingService` |
| Transcript token packs | `TranscriptTokenCredit` | `modules/tokens/` + Stripe price IDs |
| Webhooks | Cashier webhooks | Stripe webhook route (verify + idempotency) |
| Plan limits | config | Enforce in services before enqueue |

**Env:** All `STRIPE_PRICE_*` from Laravel `.env.example`.

---

### Phase 7 — Dashboard, settings, admin

| Task | Laravel reference | Target |
|---|---|---|
| Dashboard aggregates | `DashboardController` | `modules/dashboard/` — usage stats, recent screenings |
| User settings | `ProfileController`, 2FA | better-auth APIs + frontend |
| Admin impersonation | if any | Defer or port last |

---

### Phase 8 — Public & config

| Task | Target |
|---|---|
| Marketing stats | `GET /api/public/marketing` from env |
| Company/legal config | `GET /api/public/company` |
| Health | Already have patterns in e2e |

Landing page content stays frontend; backend only serves config JSON.

---

## 5. Queue topology (target)

```
src/queues/
  emails.queue.ts      # existing — verify, invite
  screening.queue.ts   # default + priority (priority option on job)
  transcriptions.queue.ts
  roles.queue.ts       # document OCR + PDF export
  queues.ts            # registry
  dashboard.ts         # Bull Board — all queues
```

Workers start only in `index.ts` (not in tests). Concurrency: match Laravel (5 workers emails — done; tune screening/transcription separately).

**Retry policy:** Reuse `queues/options.ts` (5 attempts, exponential backoff).

---

## 6. Mistral integration

Port from `php-migration/app/Services/Mistral/`:

| Concern | Notes |
|---|---|
| Chat completions | Screening prompts — **copy prompt text verbatim** initially |
| OCR | CV + role documents |
| Transcription | Voxtral model env |
| Timeouts / retries | Laravel HTTP client settings → fetch/axios with retry |
| No fallback | Product requires real Mistral — fail job if API down |

Store prompts in `modules/screening/prompts/` as typed constants (easier to diff against PHP).

---

## 7. Authorization model

```
Request → session middleware → requireAuth
       → resolveTeam(slug) → requireTeamMember
       → optional requireTeamOwner | requirePlanFeature('role_documents')
       → controller → service
```

Never trust `teamSlug` from body; always from URL + membership check.

---

## 8. Testing strategy

| Layer | Approach |
|---|---|
| Unit | Services, score calculator, token math, plan gating — Vitest |
| Integration | Mistral client mocked; DB via test container or sqlite/pg test db |
| E2e | Extend `test/e2e/` — auth → create team → create role → screen candidate (mock Mistral) |
| Golden scenarios | Port PHP fixture JSON from `php-migration/tests/fixtures/scenarios/` |

Add `test/fixtures/scenarios/` mirroring Laravel structure.

---

## 9. Cutover checklist

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

## 10. Suggested module tree (final)

```
src/modules/
  auth/           # exists
  billing/        # exists — extend
  emails/         # exists
  users/          # exists
  teams/
  roles/
  candidates/
  screening/
  mistral/
  transcription/
  tokens/
  storage/
  dashboard/
```

Each module: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `dtos/`, optional `*.worker.ts`, `*.test.ts`.

---

## 11. Risks & decisions

| Risk | Mitigation |
|---|---|
| PDF visual parity | Choose HTML→PDF if DomPDF layout hard to replicate; compare side-by-side with Laravel exports |
| Score drift | Unit tests with fixed Mistral mocks + same fixture inputs as PHP tests |
| Team vs Organization model | Single source of truth: better-auth org; attach product fields via `team_profiles` table |
| Session → API | Frontend uses cookies + React Query; no Inertia shared props — explicit endpoints for `auth`, `team`, `flash` |
| Long-running screenings | Job timeout > max Mistral latency; progress field on candidate for UI polling |

---

## 12. Estimated order of work

1. Phase 0 env + team authorization (1–2 weeks)
2. Roles + storage + OCR job (1 week)
3. Candidates + screening pipeline (2–3 weeks) — **critical path**
4. PDF exports (1 week)
5. Transcription + tokens (1 week)
6. Billing parity + webhooks (1 week)
7. Dashboard API + polish (1 week)

Parallelize frontend migration per [frontend-migration-plan.md](./frontend-migration-plan.md) once Phase 1 team APIs exist.
