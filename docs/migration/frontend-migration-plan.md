# Frontend migration plan (Inertia React → Next.js)

Port the Laravel Inertia UI from `php-migration/resources/js/` to `apps/web` with **identical visual design** and modern client-side data patterns.

**Non-negotiable:** The new app must look the same as the Laravel app — same colors, typography, spacing, sidebar, and component styling.

**Reference UI:** `php-migration/resources/css/app.css`, `php-migration/resources/js/components/`, `php-migration/resources/js/pages/`

**Target stack:** Next.js App Router, shadcn/ui, **react-hook-form**, **zod**, **TanStack Query (react-query)**, better-auth client.

---

## 1. Current state

### `apps/web` today

- Next.js scaffold with default shadcn neutral theme in `app/globals.css`
- Auth pages started: sign-in, sign-up, verify-email
- `lib/auth-client.ts`, `providers/auth-provider.tsx`
- Full shadcn component library under `components/ui/`

### Gap

- Design tokens **do not match** Laravel (`--primary` teal, `--radius: 0rem`, Hanken Grotesk, dark sidebar)
- No team-scoped routing (`/{team_slug}/...`)
- No product pages (dashboard, candidates, roles, billing, transcription)
- Forms not yet standardized on react-hook-form + zod + mutations

---

## 2. Architecture mapping

| Inertia (Laravel) | Next.js target |
|---|---|
| `usePage().props` shared data | React Query + `AuthProvider` + `TeamProvider` |
| `@inertiajs/react` visits | `useRouter()` + query invalidation |
| Wayfinder form helpers | `react-hook-form` + `zodResolver` + `useMutation` |
| Laravel validation errors | API `422` → map to `setError` / `FieldError` |
| Flash messages | toast (sonner) or URL search params |
| `Link` from Inertia | `next/link` or shadcn `Link` |
| Ziggy routes | Next.js file-based routes + typed route helpers |
| `@/routes/*` Wayfinder | `lib/routes.ts` constants |
| Server props per page | `useQuery` with SSR prefetch where useful (`prefetchQuery` in RSC loaders) |

---

## 3. Design system migration (do this first)

### Step 3.1 — Copy design tokens

Source: `php-migration/resources/css/app.css`

Target: `apps/web/app/globals.css`

**Must port:**

| Token / rule | Laravel value | Notes |
|---|---|---|
| `--primary` | Teal (`oklch` / hex from app.css) | Not shadcn default blue |
| `--radius` | `0rem` | Sharp corners throughout |
| `--sidebar-*` | Dark sidebar palette | App shell depends on this |
| Font: sans | Hanken Grotesk | `@font-face` or `next/font/google` if available |
| Font: serif | Newsreader | Headings / marketing |
| Font: mono | Fira Code | Code blocks |
| Custom utilities | Any `@layer` rules | Copy verbatim |

**Action:** Diff `php-migration/resources/css/app.css` against `apps/web/app/globals.css` and replace token block entirely; keep only Next-specific additions (e.g. `@import "tailwindcss"` v4 syntax).

### Step 3.2 — Font loading

```tsx
// apps/web/app/layout.tsx — mirror Laravel font stack
import { Hanken_Grotesk, Newsreader, Fira_Code } from "next/font/google";
```

Map CSS variables `--font-sans`, `--font-serif`, `--font-mono` to match Laravel `theme()`.

### Step 3.3 — Component parity

Copy/adapt from `php-migration/resources/js/components/` (not `components/ui` duplicates):

| Laravel component | Next location | Priority |
|---|---|---|
| `app-sidebar.tsx` | `components/app-sidebar.tsx` | P0 |
| `app-header.tsx` / nav | `components/app-header.tsx` | P0 |
| `team-switcher.tsx` | `components/team-switcher.tsx` | P0 |
| `page-heading.tsx` | `components/page-heading.tsx` | P1 |
| `integrity-score-badge.tsx` | `features/candidates/integrity-score-badge.tsx` | P1 |
| Report tabs / dossier UI | `features/candidates/report/` | P2 |
| Marketing sections | `features/marketing/` | P3 |

**Rule:** Prefer porting Laravel JSX structure and classNames over rewriting layouts. shadcn primitives stay; compose them like the Laravel app does.

### Step 3.4 — Visual regression checklist

Before marking any page done:

- [ ] Side-by-side screenshot vs Laravel (same viewport 1440×900 and 390×844)
- [ ] Primary buttons teal, radius 0
- [ ] Sidebar dark theme matches
- [ ] Table density and borders match
- [ ] Form field spacing matches (`Field`, `Label` from shadcn — align with Laravel `Input` wrappers)
- [ ] PDF preview pages if any

Store reference screenshots in `docs/migration/screenshots/` (optional).

---

## 4. Routing structure

Mirror Laravel URLs from `php-migration/routes/web.php` and `settings.php`.

### Public

```
/                           → welcome (marketing)
/legal/privacy|terms|dpa|cookies|imprint
/auth/sign-in               → login (exists)
/auth/sign-up               → register (exists)
/auth/verify-email          → exists
/auth/forgot-password
/auth/reset-password
/auth/two-factor-challenge
/auth/confirm-password
/invitations/[token]/accept
```

### Team-scoped (`/{teamSlug}/…`)

Laravel uses `{current_team}` (team slug) as the first path segment:

```
/[teamSlug]/dashboard
/[teamSlug]/candidates
/[teamSlug]/candidates/create
/[teamSlug]/candidates/import
/[teamSlug]/candidates/[id]
/[teamSlug]/roles
/[teamSlug]/roles/[id]
/[teamSlug]/tools/transcription
/[teamSlug]/transcriptions
/[teamSlug]/transcriptions/[id]
/[teamSlug]/billing
```

Legacy redirects: `/screenings/*` → `/candidates/*` (keep redirects in Next middleware for bookmark compatibility).

### Settings (global — not under team slug)

```
/settings/profile
/settings/security
/settings/appearance
/settings/organization
/settings/teams
/settings/teams/[teamId]
```

**Layout:**

```
app/
  (marketing)/              → public + legal
  auth/                       → exists
  settings/                   → global settings shell
  (app)/
    [teamSlug]/
      layout.tsx              → sidebar + header + TeamProvider
      dashboard/page.tsx
      candidates/...
      roles/...
      tools/transcription/...
      transcriptions/...
      billing/...
```

**Middleware (`middleware.ts`):**

- Require session for `(app)` routes
- Resolve `teamSlug` → verify membership via API or session org list
- Redirect to onboarding if no team

---

## 5. Data layer (react-query)

### Providers

```tsx
// providers/query-provider.tsx
// providers/team-provider.tsx — active team, slug, plan features
```

### Conventions

| Pattern | Implementation |
|---|---|
| List data | `useQuery({ queryKey: ['teams', slug, 'candidates'], queryFn })` |
| Detail | `useQuery({ queryKey: ['teams', slug, 'candidates', id] })` |
| Create/update | `useMutation` + `invalidateQueries` |
| Optimistic UI | Only where Laravel had instant feedback |
| Polling | Candidate `processing` status — `refetchInterval: 3000` until terminal state |
| Errors | Map API `{ errors: { field: string[] } }` to form |

### API client

```ts
// lib/api-client.ts
// fetch wrapper: credentials: 'include', baseUrl from env, typed JSON
```

No Inertia — every page explicitly fetches what it needs.

### Shared data (replacing Inertia shared props)

| Prop (Laravel) | Replacement |
|---|---|
| `auth.user` | `useSession()` from auth provider |
| `auth.team` / current team | `useTeam()` |
| `ziggy` | static routes |
| `company`, `socialLinks` | `useQuery(['public', 'company'])` |
| `marketing` stats | `useQuery(['public', 'marketing'])` |
| `flash` | toast on mutation success / `?message=` |

---

## 6. Forms (react-hook-form + zod)

### Standard form stack

Every data entry page uses:

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: ...,
});

const mutation = useMutation({
  mutationFn: (data) => api.post(...),
  onSuccess: () => {
    queryClient.invalidateQueries(...);
    router.push(...);
    toast.success(...);
  },
  onError: (err) => {
    if (err.status === 422) setFormErrors(form, err.body.errors);
  },
});
```

### Schemas

Port Laravel Form Request rules to Zod in `features/*/schemas/`:

| Laravel | Zod schema file |
|---|---|
| StoreCandidateRequest | `features/candidates/schemas/candidate-schema.ts` |
| StoreRoleRequest | `features/roles/schemas/role-schema.ts` |
| Sign-in / sign-up | Already started in `features/auth/schemas/` |
| Team invite | `features/teams/schemas/invite-schema.ts` |

**Match validation messages** to Laravel for UX continuity.

### File uploads

- CV, audio, role documents: `<input type="file">` + `FormData` mutation
- Progress: optional `onUploadProgress` if using XHR; else loading state on submit

### Multi-step flows

Candidate create (CV + transcripts + URLs): port wizard steps from Laravel page component structure.

---

## 7. Page migration inventory

All 30 Inertia pages in `php-migration/resources/js/pages/`. Track status as pages land.

| Laravel page | Next route | Backend phase | Priority |
|---|---|---|---|
| `welcome.tsx` | `(marketing)/page.tsx` | Phase 8 | P2 |
| `legal/privacy.tsx` | `legal/privacy` | Static | P3 |
| `legal/terms.tsx` | `legal/terms` | Static | P3 |
| `legal/dpa.tsx` | `legal/dpa` | Static | P3 |
| `legal/cookies.tsx` | `legal/cookies` | Static | P3 |
| `legal/imprint.tsx` | `legal/imprint` | Static | P3 |
| `auth/login.tsx` | `auth/sign-in` | Done | ✅ |
| `auth/register.tsx` | `auth/sign-up` | Done | ✅ |
| `auth/verify-email.tsx` | `auth/verify-email` | Done | ✅ |
| `auth/forgot-password.tsx` | `auth/forgot-password` | Auth | P1 |
| `auth/reset-password.tsx` | `auth/reset-password` | Auth | P1 |
| `auth/confirm-password.tsx` | `auth/confirm-password` | Auth | P2 |
| `auth/two-factor-challenge.tsx` | `auth/two-factor` | Auth | P1 |
| `dashboard.tsx` | `[teamSlug]/dashboard` | Phase 7 | P1 |
| `candidates/create.tsx` | `[teamSlug]/candidates/create` | Phase 3 | P0 |
| `screenings/index.tsx` | `[teamSlug]/candidates` | Phase 3 | P0 |
| `screenings/show.tsx` | `[teamSlug]/candidates/[id]` | Phase 3 | P0 |
| `screenings/import.tsx` | `[teamSlug]/candidates/import` | Phase 3 | P1 |
| `roles/index.tsx` | `[teamSlug]/roles` | Phase 2 | P1 |
| `roles/show.tsx` | `[teamSlug]/roles/[id]` | Phase 2 | P1 |
| `tools/transcription.tsx` | `[teamSlug]/tools/transcription` | Phase 5 | P2 |
| `transcriptions/index.tsx` | `[teamSlug]/transcriptions` | Phase 5 | P2 |
| `transcriptions/show.tsx` | `[teamSlug]/transcriptions/[id]` | Phase 5 | P2 |
| `billing/index.tsx` | `[teamSlug]/billing` | Phase 6 | P1 |
| `settings/profile.tsx` | `settings/profile` | Phase 7 | P1 |
| `settings/security.tsx` | `settings/security` | Auth | P1 |
| `settings/appearance.tsx` | `settings/appearance` | — | P3 |
| `settings/organization.tsx` | `settings/organization` | Phase 1 | P1 |
| `teams/index.tsx` | `settings/teams` | Phase 1 | P1 |
| `teams/edit.tsx` | `settings/teams/[teamId]` | Phase 1 | P1 |

---

## 8. App shell

Port `php-migration/resources/js/layouts/app-layout.tsx` (or equivalent):

1. **Sidebar** — team switcher, nav items with active state, plan badge
2. **Header** — breadcrumbs, user menu, sign out
3. **Content area** — max-width and padding from Laravel

Nav items (typical):

- Dashboard
- Candidates
- Roles
- Transcription (if plan allows)
- Billing
- Settings

Use `usePathname()` for active link styling — match Laravel `NavMain` classes exactly.

---

## 9. Feature-specific UI notes

### Candidates list

- Status badges: `pending`, `processing`, `completed`, `failed` — same colors as Laravel
- Integrity score column — `IntegrityScoreBadge` component
- Empty state — copy Laravel `Empty` component text/illustration

### Candidate report / dossier

- Tabs: Overview, Integrity breakdown, Behaviour, Personality, Transcripts
- Recharts graphs — port chart config from Laravel (colors from CSS variables)
- Export PDF button → triggers API → poll or download link

### Roles

- Document upload zone (Scale+ gated) — show upgrade CTA matching Laravel
- Export batch button with job polling

### Billing

- Plan cards — same copy/pricing from `product-overview.md`
- Stripe checkout redirect — `billingService.createCheckout` pattern from backend
- Token balance display for transcription

### Transcription

- Audio upload + job status polling
- Diarized transcript viewer — port segment UI

---

## 10. Auth UX parity

| Feature | Implementation |
|---|---|
| Email verification gate | Redirect middleware if `!user.emailVerified` |
| 2FA setup / challenge | better-auth client APIs + dedicated pages |
| Sign out | Existing `sign-out.tsx` pattern |
| Invite accept | `/invitations/[token]` → accept → redirect to team dashboard |

---

## 11. Dependencies to add

```json
{
  "@tanstack/react-query": "^5",
  "react-hook-form": "^7",
  "@hookform/resolvers": "^3",
  "recharts": "^2",
  "sonner": "^2"
}
```

Ensure versions align with monorepo `pnpm` workspace.

---

## 12. Phased frontend work

### Phase F0 — Design foundation (week 1)

- [ ] Port `app.css` tokens + fonts to `globals.css` / `layout.tsx`
- [ ] Port app shell (sidebar, header, team switcher)
- [ ] Query provider + API client
- [ ] Middleware: auth + team slug

### Phase F1 — Settings & team (depends backend Phase 1)

- [ ] Team settings, members, invitations
- [ ] Forms: invite member, update team name

### Phase F2 — Roles (depends backend Phase 2)

- [ ] Roles list/create/show
- [ ] Document upload form

### Phase F3 — Candidates (depends backend Phase 3) — **critical path**

- [ ] List, create wizard, show/report, edit
- [ ] Processing polling UI
- [ ] Integrity dossier tabs

### Phase F4 — Billing & dashboard (depends backend Phase 6–7)

- [ ] Billing page, plan cards
- [ ] Dashboard stats cards

### Phase F5 — Transcription + marketing

- [ ] Transcription tool page
- [ ] Public landing + legal

---

## 13. Testing

| Type | Tool |
|---|---|
| Component | Vitest + Testing Library (forms, badges) |
| E2e | Playwright — sign in → create candidate flow |
| Visual | Optional Chromatic or manual screenshot checklist |

---

## 14. Anti-patterns to avoid

- **Do not** keep default shadcn blue theme on product pages
- **Do not** use Server Actions for domain mutations unless team standardizes on them — use React Query mutations against Express API for parity with backend skill
- **Do not** redesign layouts "while migrating" — port first, improve later
- **Do not** embed business validation only in Zod — backend remains source of truth; Zod mirrors for UX

---

## 15. Definition of done (frontend)

- [ ] All team-scoped pages reachable with same URL shape as Laravel
- [ ] Visual parity sign-off on dashboard, candidates list, candidate report, billing
- [ ] All forms use react-hook-form + zod + react-query
- [ ] No Inertia or Wayfinder dependencies
- [ ] Lighthouse/a11y not worse than Laravel baseline

Coordinate backend API availability per [backend-migration-plan.md](./backend-migration-plan.md); frontend phases F1–F5 map directly to backend Phases 1–7.
