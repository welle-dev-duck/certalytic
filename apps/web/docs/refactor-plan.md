# Frontend refactor plan

Multi-phase cleanup from the architecture audit. Each phase is independently mergeable.

**Context:** ~196 TS/TSX source files under `apps/web/`. No automated tests today. Backend refactor (Phases 1–6) is complete; this plan aligns the web app with those API/contract changes and reduces duplication.

---

## Already done (pre-plan)

- [x] Unified billing plan data (`features/billing/plans.ts`) across marketing and billing
- [x] Shared plan card components (`features/billing/components/plan-cards.tsx`)
- [x] Growth plan highlighted with primary border on pricing surfaces

---

## Phase 1 — Dead code & backend alignment

Backend removed bulk import and cursor-only pagination; frontend still has drift.

- [ ] Remove bulk import flow: `useImportCandidates`, `parse-import-csv.ts`, `/candidates/import` page, `routes.candidateImport`
- [ ] Consolidate candidate creation to **one path** — keep `StartScreeningModal`; remove or redirect `/candidates/create` and dead `routes.candidateCreate`
- [ ] Remove debug `console.log` from `sign-up-form.tsx` and `sign-out.tsx`
- [ ] Remove dead route helpers `twoFactor`, `confirmPassword` in `lib/routes.ts` (no pages exist)
- [ ] Drop stale `page: 1` passed to `useRoles()` (`start-screening-modal.tsx`, `create-candidate-form.tsx`)
- [ ] Remove unused `applyApiValidationErrors` **or** wire it into REST forms that can receive 422 field errors

**Key files:** `features/candidates/hooks/use-candidates.ts`, `app/(app)/candidates/import/`, `app/(app)/candidates/create/`, `lib/routes.ts`, `lib/form-errors.ts`

---

## Phase 2 — API & error-handling consistency

- [ ] Standardize mutation error helper: `ApiError` → toast + optional form field mapping
- [ ] Use `ApiError.validationErrors` in screening/create/update flows
- [ ] Fix silent error swallowing in `role-export-action.tsx`
- [ ] Type `BillingUsage.plan` as `"free" | "starter" | "growth" | "scale"` (match backend `PLAN_IDS`)
- [ ] Introduce shared `Paginated<T>` in `lib/`; dedupe `PaginatedResponse` / `PaginatedRoles` in feature types
- [ ] Type realtime message payloads against domain status enums (`realtime-provider.tsx`)

**Key files:** `lib/api-client.ts`, `lib/form-errors.ts`, `features/billing/types.ts`, `features/candidates/types.ts`, `features/roles/types.ts`, `providers/realtime-provider.tsx`

---

## Phase 3 — Component extraction (fat pages)

Three views duplicate candidate table + screening dialog wiring; several files exceed 250 lines.

- [ ] Extract shared `CandidatesTable` (search, debounce, row actions, pagination) from dashboard, candidates list, role detail
- [ ] Extract shared `ScreeningDialogs` bundle (start / delete / rerun modals)
- [ ] Split `start-screening-modal.tsx` (~700 lines) into step components + shared submit logic
- [ ] Split `candidate-detail.tsx` into header, processing state, dossier sections
- [ ] Split `role-detail.tsx` and `organization-settings.tsx` where table/form logic can be reused
- [ ] Consolidate duplicate `LoadingSwap` (`components/loading-swap.tsx` vs `components/ui/loading-swap.tsx`)

**Key files:** `app/(app)/dashboard/_components/dashboard-view.tsx`, `app/(app)/candidates/_components/candidates-list.tsx`, `app/(app)/roles/[id]/_components/role-detail.tsx`, `features/candidates/components/start-screening-modal.tsx`

---

## Phase 4 — Auth & session hardening

- [ ] Evaluate Next.js middleware for auth redirect (reduce client-only gate flash in `AuthProvider`)
- [ ] Move auth forms/schemas into `features/auth/` consistently (today forms live under `app/auth/`)
- [ ] Replace `window.location.reload()` on org create with query invalidation + auth refetch (`create-team-modal.tsx`)
- [ ] Reduce defensive casts in `use-organization-directory.ts` once Better Auth response shapes are stable

**Key files:** `providers/auth-provider.tsx`, `features/auth/`, `app/auth/`, `components/layout/create-team-modal.tsx`, `features/organizations/hooks/use-organization-directory.ts`

---

## Phase 5 — Design system & marketing parity

- [ ] Route score/integrity colors through `lib/integrity.ts` (remove inline hex in dashboard, billing, dossier, marketing)
- [ ] Unify enterprise contact email (`COMPANY.email` vs `CONTACT_EMAIL` in `plans.ts`)
- [ ] Extract shared token usage bar (sidebar + billing view)
- [ ] Align marketing mock report types with `CandidateReport` where feasible (`lib/marketing-mock-report.ts`)
- [ ] Remove `PAGE_SIZES` option `1` when prod-ready (mirror backend pagination TODO)

**Key files:** `lib/integrity.ts`, `components/layout/app-sidebar.tsx`, `app/(app)/billing/_components/billing-view.tsx`, `components/certalytic/table-pagination.tsx`, `lib/marketing-mock-report.ts`

---

## Phase 6 — Type safety & shared contracts

Mirror backend Phase 4 typed screening evaluation on the client.

- [ ] Add shared types package or codegen (`packages/api-types`) for REST DTOs used by both apps
- [ ] Replace `Record<string, unknown>` on `scoreBreakdown` / `roundScores` with typed screening evaluation schema
- [ ] Share screening limit constants with backend env limits (`screening-limits.ts` vs backend `config/env`)
- [ ] Runtime-parse critical API responses at boundaries (optional Zod `.safeParse` in hooks)

**Key files:** `features/candidates/types.ts`, `features/candidates/lib/screening-limits.ts`, `app/(app)/candidates/[id]/_components/candidate-detail.tsx`

---

## Phase 7 — Testing foundation

No `test` script or test files exist today.

- [ ] Add Vitest + React Testing Library; `test` script in `package.json`
- [ ] Unit tests: `api-client`, `use-cursor-pagination`, `integrity` helpers, screening Zod schemas
- [ ] Component tests: plan cards, table pagination, key form validation
- [ ] Playwright smoke: sign-in, start screening (modal), candidate detail, billing page
- [ ] Wire CI for `pnpm test` in web app

---

## Audit summary (findings by severity)

### Critical

| Finding | Location |
|---------|----------|
| Bulk import UI calls removed backend endpoint | `use-candidates.ts`, `/candidates/import/` |
| Orphan create/import pages vs modal-first flow | `/candidates/create/`, `lib/routes.ts` |
| Zero automated tests | entire `apps/web/` |
| `applyApiValidationErrors` unused | `lib/form-errors.ts` |
| Debug `console.log` in auth | `sign-up-form.tsx`, `sign-out.tsx` |
| Stale `page: 1` on cursor-paginated roles API | `start-screening-modal.tsx`, `create-candidate-form.tsx` |

### Medium

| Finding | Location |
|---------|----------|
| Duplicate `LoadingSwap` | `components/loading-swap.tsx`, `components/ui/loading-swap.tsx` |
| Duplicate pagination DTO shapes | `features/candidates/types.ts`, `features/roles/types.ts` |
| Triplicated candidate table + dialog wiring | dashboard, candidates list, role detail |
| Integrity colors bypass `lib/integrity.ts` | dashboard, billing, dossier, marketing |
| Inconsistent mutation error handling | forms, `role-export-action.tsx` |
| `BillingUsage.plan` typed as `string` | `features/billing/types.ts` |
| Auth split across `app/auth/` and `features/auth/` | auth module layout |
| Dead route helpers | `lib/routes.ts` |
| Org create uses full page reload | `create-team-modal.tsx` |
| Dev-only pagination size `1` | `table-pagination.tsx` |

### Low

| Finding | Location |
|---------|----------|
| Realtime hook only used for connection badge | `candidate-detail.tsx` |
| Hardcoded marketing stats/roadmap | `lib/marketing-data.ts` |
| Unused `SignOut` debug component | `app/_components/sign-out.tsx` |
| Mixed native `<select>` vs shadcn `Select` | create vs import forms |
| Token bar color logic duplicated | sidebar, billing |

---

## Explicitly out of scope

- **Regenerating shadcn/ui primitives** — large `components/ui/` tree; touch only when needed
- **Full design rebrand** — fonts, CSS tokens in `globals.css` are intentional
- **Better Auth server config** — lives in backend; frontend consumes `authClient` only
- **Stripe checkout UX redesign** — redirect flow is acceptable
- **Marketing copy accuracy** (stats, roadmap dates) — product decision
- **Re-adding bulk import on backend** — product removed it; frontend should follow
- **Choosing modal vs page-only screening UX** — Phase 1 recommends consolidation; product picks the survivor

---

## Project map (quick reference)

```
apps/web/
├── app/
│   ├── layout.tsx                 # Provider composition root
│   ├── (app)/                       # Authenticated shell
│   ├── auth/                        # Sign-in/up forms (inline)
│   ├── settings/                    # Profile, org, teams, security
│   └── _components/welcome-page.tsx
├── features/
│   ├── billing/                     # plans.ts, hooks, plan-cards
│   ├── candidates/                  # Largest feature (hooks, dossier, modal)
│   ├── roles/
│   ├── organizations/
│   ├── marketing/
│   └── auth/                        # Schemas + session types only
├── components/ui/                   # shadcn
├── lib/                             # api-client, auth-client, routes, integrity
└── providers/                       # Auth, Query, Realtime, Theme
```
