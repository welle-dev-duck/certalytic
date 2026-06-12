# Frontend refactor plan

Multi-phase cleanup from the architecture audit. Each phase is independently mergeable.

**Context:** ~196 TS/TSX source files under `apps/web/`. Vitest + Playwright foundation in place. Backend refactor (Phases 1–6) is complete; this plan aligns the web app with those API/contract changes and reduces duplication.

---

## Already done (pre-plan)

- [x] Unified billing plan data (`features/billing/plans.ts`) across marketing and billing
- [x] Shared plan card components (`features/billing/components/plan-cards.tsx`)
- [x] Growth plan highlighted with primary border on pricing surfaces

---

## Phase 1 — Dead code & backend alignment

- [x] Remove bulk import flow; redirect orphan create/import routes to modal flow
- [x] Remove debug logging and dead route helpers
- [x] Wire `applyApiValidationErrors` via `lib/mutation-errors.ts`

---

## Phase 2 — API & error-handling consistency

- [x] Standardize mutation error helper (`lib/mutation-errors.ts`)
- [x] Use validation errors in screening flow; fix role export swallowing
- [x] Shared `Paginated<T>` and typed realtime payloads
- [x] Wire `handleMutationError` into role form dialog

---

## Phase 3 — Component extraction

- [x] `CandidatesTable`, `ScreeningDialogs`, start-screening step split, candidate-detail split, organization-settings split

---

## Phase 4 — Auth & session hardening

- [x] ~~Next.js middleware auth redirect~~ — **intentionally out of scope** (see `todo.md`)
- [x] Move auth forms/components into `features/auth/`; pages under `app/auth/` are thin shells
- [x] Replace org-create full page reload with query invalidation
- [x] Typed parsers for organization directory responses (members + invitations)

---

## Phase 5 — Design system & marketing parity

- [x] Route score/integrity colors through `lib/integrity.ts` (dashboard, billing, dossier, marketing)
- [x] Unify enterprise contact email (`COMPANY.email`)
- [x] Shared token usage bar
- [x] Marketing mock report typed as `CandidateReport` (`lib/marketing-mock-report.ts`)
- [ ] Remove `PAGE_SIZES` option `1` when prod-ready (dev-only; mirror backend TODO)

---

## Phase 6 — Type safety & shared contracts

- [ ] ~~`packages/api-types`~~ — **deferred** to `todo.md`
- [x] Typed screening evaluation schema + `parseScreeningEvaluation` at candidate detail boundary
- [x] Screening limit constants documented

---

## Phase 7 — Testing foundation

- [x] Vitest + React Testing Library (`test` / `test:watch`)
- [x] Unit tests: integrity, mutation-errors, pagination, screening schema, auth schemas, start-screening utils
- [x] Component tests: plan cards, table pagination
- [x] Playwright smoke: home, sign-in, sign-up, forgot-password, auth redirect (`test:e2e`)
- [x] CI workflow: `.github/workflows/ci.yml` (lint, unit tests, Playwright)

---

## Explicitly out of scope

- **Next.js middleware auth redirect** — keep client-only `AuthProvider` gate
- **`packages/api-types`** — deferred to `todo.md`
- **`PAGE_SIZES` dev option `1`** — remove at prod cutover
- Regenerating shadcn/ui primitives, full rebrand, Better Auth server config, Stripe UX redesign, marketing copy accuracy, re-adding bulk import

---

## Project map (quick reference)

```
apps/web/
├── app/
│   ├── (app)/                       # Authenticated shell
│   └── auth/                        # Thin route pages → features/auth
├── features/
│   ├── auth/                        # Schemas + forms + auth shell
│   ├── billing/
│   ├── candidates/
│   ├── organizations/
│   └── marketing/
├── e2e/                             # Playwright smoke specs
├── lib/                             # api-client, integrity, routes
└── providers/
```
