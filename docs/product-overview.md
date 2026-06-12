# Certalytic - Product & Engineering Overview

**Document type:** Product & engineering specification  
**Stack (target):** Turborepo · Express · Next.js · better-auth · Drizzle · BullMQ · Mistral AI (La Plateforme, EU) · Hetzner EU · Stripe  
**Legacy implementation:** `php-migration/` — Laravel 13 · Inertia.js (React 19) · Fortify · Horizon · Cashier  
**Migration plans:** [docs/migration/](./migration/)  
**Status:** Production MVP — integrity screening, supplementary candidate insights, async role exports, audio transcription tooling, marketing site, and legal/compliance surfaces shipped (legacy app); Turborepo migration in progress

## 1. Product vision

Certalytic is a **decision-support integrity layer** for recruitment. It sits on top of existing ATS workflows — it does not replace them.

After a candidate completes their interview loop, recruiters upload the CV and interview transcripts (single paste or up to three uploaded files merged automatically) plus optional LinkedIn/GitHub signals. Certalytic synthesizes these inputs into a single **Integrity Score** with evidence-based flags and follow-up prompts, plus supplementary **behaviour** and **personality** analyses for hiring-manager context.

**Core question:** How likely is this candidate's interview performance representative of their real-time, independent, unassisted ability?

### Workflow

```
ATS: applications → CV filter → interview loop conducted
                                          ↓
Certalytic: CV + merged interview transcripts (+ optional LinkedIn/GitHub) → Integrity Score + supplementary insights
```

Recruiters wait until the candidate is at the finish line, paste or transcribe relevant interview content, and receive an integrity breakdown with follow-up prompts. **One screening = one candidate screening** (CV + merged transcripts + scoring). One Mistral evaluation call per screening.

A separate **audio transcription tool** converts interview recordings (MP3/M4A/WAV) into speaker-labelled transcripts that recruiters can paste into screenings or review standalone.

### Decision support disclaimer

Every score view and export displays:

> **This score represents a probability heuristic, not an absolute verdict. Use it to guide your human follow-up questions.**

Language avoids "pass/fail" or "cheating detected." Prefer: _integrity indicators_, _signal density_, _follow-up suggested_, _inconsistency flagged_.

## 2. Product scope

### Shipped capabilities

| Pillar | Description |
|---|---|
| **CV intelligence** | Mistral OCR (`mistral-ocr-latest`) extracts PDF/DOCX CVs; `mistral-small-latest` evaluates timeline consistency, AI-text patterns, and role fit |
| **Merged interview intelligence** | Single manual transcript paste or up to three uploaded files merged server-side — Mistral infers virtual interview segments, scores each sequentially, and detects stylistic shifts between technical and behavioural sections |
| **Supplementary candidate insights** | **Behaviour analysis** (communication style, collaboration indicators, watchpoints) and **personality analysis** (work style, motivation signals, culture-fit indicators) — included in UI and PDF exports, **excluded from the Integrity Score** |
| **Cross-source validation** | Starter+: manual LinkedIn paste/URL and GitHub URL; GitHub public API enrichment when username resolved; Growth+ tier flag for full cross-source scoring path |
| **Role context** | Saved Role Profiles (all tiers); targeted scan assets on Scale+ (up to 3 OCR'd documents per role) |
| **PDF exports** | Per-candidate integrity dossier (sync download); per-role batch dossier (async queue job, watermarked, auto-download when ready) |
| **Bulk upload** | CSV and multi-file import for interview-stage candidates (all tiers) |
| **Audio transcription** | Standalone tool: Mistral Voxtral (`voxtral-mini-latest`) diarized transcription, speaker rename, paginated library, audio deleted after processing |
| **Team workspaces** | Multi-team model, invitations, seat-based plans, Stripe billing |
| **Marketing site** | Public landing page (`/`) with hero, EU privacy, stats, **How it works** (3-step process with screenshot placeholders), product bento, demo preview, pricing (EUR), reviews, roadmap |
| **Legal & compliance** | Privacy Policy, Terms, DPA, Cookie Policy, Imprint (`/legal/*`); registration requires Terms + Privacy + DPA consent |

### Out of scope (current release)

- Real-time audio/video proctoring during live interviews
- Direct ATS integrations, public API, webhooks, SSO (roadmap — see §12)
- Automatic LinkedIn profile fetch (URL/text passed to model; fetch stub logs and defers to manual paste)
- Native Zoom / Teams / Meet import connectors (audio file upload supported today)
- Fake or mock evaluation paths — all screenings use live Mistral inference

## 3. Architecture

### Target stack (Turborepo)

| Component | Technology |
|---|---|
| Backend API | Express (`apps/backend`) |
| Frontend | Next.js App Router (`apps/web`) — React 19, react-hook-form, zod, TanStack Query |
| Auth | better-auth (session cookies, org plugin, Stripe plugin) |
| ORM | Drizzle + PostgreSQL |
| Document OCR | `mistral-ocr-latest` |
| Scoring & analysis | `mistral-small-latest` |
| Audio transcription | `voxtral-mini-latest` (Mistral La Plateforme) |
| PDF generation | TBD (DomPDF in legacy; port layout to React-PDF or HTML→PDF) |
| Object storage | Hetzner Object Storage (EU, S3-compatible) |
| Queue | BullMQ (Redis) — emails, screenings, priority screenings, transcriptions, role PDF exports |
| Database | PostgreSQL |
| Compute | Hetzner Cloud + Coolify (EU) |
| Billing | Stripe via `@better-auth/stripe` + checkout for packs |

### Legacy stack (reference: `php-migration/`)

| Component | Technology |
|---|---|
| Application | Laravel 13 + Inertia.js (React 19) |
| Auth | Laravel Fortify |
| Queue | Laravel Horizon (Redis) |
| Billing | Laravel Cashier + Stripe |

All document and audio intelligence routes to **Mistral La Plateforme (Paris, France)**. No US AI providers in the candidate data path.

### Screening processing pipeline

1. Recruiter submits candidate: CV (upload or paste) + interview transcript (single paste or up to 3 files merged) + optional profile URLs; audio can be transcribed separately via Tools → Transcription
2. Record created; screening job dispatched to Redis queue (priority queue on Scale+)
3. CV resolved (stored text, local DOCX/MD reader, or Mistral OCR for PDF)
4. GitHub profile fetched via public API when URL/username provided and text not already pasted
5. Mistral Small evaluates CV + merged transcript + profiles with role context (title, JD, scan assets); returns integrity components, virtual `round_analyses`, and supplementary `behaviour_analysis` + `personality_analysis`
6. Integrity Score composed locally from the four weighted components only; virtual segment scores persisted; UI updates when job completes

### Role export pipeline

1. Recruiter requests export from role detail page or roles index dropdown
2. `role_exports` record created; PDF export job queued
3. Worker loads role + all completed candidates, renders combined watermarked PDF (role overview + per-candidate dossiers including supplementary insights)
4. File stored in object storage; frontend polls and auto-downloads when complete

### Transcription processing pipeline

1. Recruiter uploads audio (MP3/M4A/WAV) on **Tools → Transcription**; one **transcription token** consumed per job
2. Transcription job dispatched to `transcriptions` queue
3. Mistral Voxtral returns diarized segments; formatted as `Speaker: line` transcript with `segments` + `speaker_labels` persisted
4. Source audio file deleted from storage after successful processing (`audio_path` nulled)
5. Recruiter can rename speakers, search transcripts, copy text into a screening, or delete records

### Transcript controls (screening input)

| Mode | Control | Value |
|---|---|---|
| **Manual paste** | Fields | 1 (single textarea) |
| **File upload** | Max files | 3 (merged server-side with segment separators) |
| **Validation** (upload/paste) | Max words (combined) | 20,000 |
| **Validation** | Max characters (combined) | 150,000 |
| **Processing** (`TranscriptProcessor`) | Soft warning | ~24,000 words |
| **Processing** | Hard cap | 120,000 characters per merged transcript |
| **Processing** | Truncation | Preserves questions, answers, intro/outro; flags `was_truncated` on report |

### Audio upload limits (transcription tool)

| Control | Default |
|---|---|
| Max file size | 100 MB (`CERTALYTIC_AUDIO_MAX_KB`) |
| Max duration | 60 minutes |
| Formats | MP3, M4A, WAV |

## 4. Scoring engine

$$\text{Integrity Score} = (S_{cv} \times 0.25) + (S_{int} \times 0.50) + (S_{cross} \times 0.15) + (S_{id} \times 0.10)$$

| Component | Weight | Source |
|---|---|---|
| $S_{cv}$ | 25% | CV authenticity & role fit |
| $S_{int}$ | 50% | Interview signal density (weighted across virtual segments when multiple are inferred) |
| $S_{cross}$ | 15% | CV vs LinkedIn/GitHub consistency |
| $S_{id}$ | 10% | Identity & communication coherence |

**Not included in the Integrity Score:** behaviour analysis and personality analysis. These supplementary sections are generated in the same Mistral call but stored separately in `score_breakdown` and surfaced only in dedicated UI tabs and PDF export sections.

Mistral returns schema-validated JSON including `round_analyses` for inferred interview segments, plus `behaviour_analysis` and `personality_analysis`. The backend applies weights deterministically to evaluated integrity components only. When no LinkedIn or GitHub profiles are submitted, `s_cross` is stored as `not-evaluated` and excluded from the integrity score; the remaining component weights are renormalized to 100%. The full merged transcript is stored in one `interview_rounds` row (`round_number = 1`); additional virtual segments are tracked in `round_analyses` and synced to supplementary `interview_rounds` rows for reporting.

### Virtual segment weighting

When Mistral identifies multiple segments, $S_{int}$ uses weighted rolling scores:

| Segment | Weight |
|---|---|
| 1 | 25% |
| 2 | 35% |
| 3 | 40% |

Variance between consecutive segment scores flags high inconsistency (threshold: 20 points).

### Supplementary analyses (outside integrity score)

| Analysis | Contents |
|---|---|
| **Behaviour** | Summary, observed traits, communication style, collaboration indicators, watchpoints |
| **Personality** | Summary, observed traits, work style, motivation signals, culture-fit indicators |

Displayed on candidate detail tabs and included in single-candidate and role-batch PDF exports with an explicit disclaimer that they do not affect the Integrity Score.

## 5. Role profiles

Roles are **title + job description only** — no per-role interview round configuration.

| Tier | Roles |
|---|---|
| **All tiers** | Saved Role Profiles (shared org library, Roles tab, dashboard filtering) |
| **Scale+** | Up to 3 targeted scan assets per role (take-home instructions, rubrics) — OCR'd once, cached, cross-referenced in merged transcript analysis |

## 6. Plans & pricing (EUR)

All public and in-app pricing is displayed in **euros (€)**.

### Monthly plans

**One screening = one candidate screening** (CV + merged transcripts + integrity scoring + supplementary behaviour/personality insights).

| Plan | Price/mo | Seats | Screenings/mo | Key gates |
|---|---|---|---|---|
| Free | €0 | 1 | 3 | Summary score only, watermarked exports |
| Starter | €159 | 1 | 20 | Full breakdown, manual LinkedIn/GitHub URLs, behaviour & personality insights |
| Growth | €349 | 3 | 50 | Cross-source tier flag, 3 seats |
| Scale | €799 | 5 | 125 | Priority queue, role scan assets |
| Enterprise | Custom | 6+ | Custom | Sales-led; ATS / API / SSO on roadmap |

### Screening packs (paid plans)

One-off screening credits. Packs expire at billing cycle end.

| Pack | Price | Screenings | Per screening |
|---|---|---|---|
| Quick Refill | €99 | 10 | €9.90 |
| Pipeline Surge | €299 | 35 | €8.50 |
| High-Volume Boost | €750 | 100 | €7.50 |

### Transcription tokens

Separate from screening quota. Consumed by the standalone audio transcription tool (1 token = 1 audio job).

| Pack | Price | Tokens |
|---|---|---|
| Transcription Token Pack | €15 | 5 |

Purchasable from Tools → Transcription via Stripe Checkout. Credited to team `transcript_tokens`.

### Feature matrix (selected)

| Capability | Free | Starter | Growth | Scale |
|---|---|---|---|---|
| CV + merged interview scoring | ✓ | ✓ | ✓ | ✓ |
| Full integrity score breakdown | — | ✓ | ✓ | ✓ |
| Behaviour & personality analysis | ✓ | ✓ | ✓ | ✓ |
| Saved Role Profiles | ✓ | ✓ | ✓ | ✓ |
| Cross-source (LinkedIn/GitHub) | — | Manual URLs / paste | ✓ | ✓ |
| Targeted scan assets | — | — | — | ✓ (max 3) |
| Priority screening queue | — | — | — | ✓ |
| Per-candidate PDF export | ✓* | ✓ | ✓ | ✓ |
| Async role batch PDF export | ✓* | ✓ | ✓ | ✓ |
| Screening packs | — | ✓ | ✓ | ✓ |
| Speaker-labelled audio transcription | ✓** | ✓** | ✓** | ✓** |
| EU sovereign processing | ✓ | ✓ | ✓ | ✓ |

\*Free tier exports are watermarked.  
\*\*Requires transcription tokens (pack purchase); not included in monthly screening quota.

## 7. Marketing site & public surfaces

Public route: `/` (marketing landing page).

| Section | Purpose |
|---|---|
| Hero | Value prop (€100k mistake framing), CTA (register / dashboard), Contact mailto |
| EU privacy | GDPR-first infrastructure, DATA & PRIVACY panel, Hetzner/Mistral/Stripe chips |
| Stats | Configurable marketing metrics (candidates screened, customers, countries, audio hours, cost avoided) |
| How it works | 3-step process: create role → screen candidates (multi-step form screenshots) → export report |
| Product bento | Four integrity signals + platform features including behaviour/personality analysis |
| Demo | Full mocked screening result preview with supplementary insights |
| Pricing | Starter, Growth (highlighted), Scale, Enterprise — EUR pricing; Free tier mentioned in copy |
| Reviews | Testimonials with star ratings and avatar initials |
| Roadmap | Quarterly planned features (synced with §12) |
| CTA | Three free screenings |

Marketing stats are configurable via `CERTALYTIC_MARKETING_*` env vars (see §10).

## 8. Data & compliance

- **EU-only path:** Hetzner datacenters (DE/FI) + Mistral La Plateforme (Paris, FR). No US cloud compute or CDN in the candidate data path.
- **Ephemeral processing:** CV bytes sent to Mistral OCR per request; not retained on Mistral infrastructure.
- **Audio retention:** Interview audio deleted from object storage after transcription completes.
- **No training:** Candidate data is never used to train, fine-tune, or improve Mistral foundation models (contractual API tier + surfaced in UI DATA & PRIVACY panel).
- **Sub-processors:** Hetzner Online GmbH (EU), Mistral AI (EU), Stripe (billing metadata only).
- **Legal documents:** Privacy Policy, Terms of Service, Data Processing Agreement, Cookie Policy, Imprint — linked from footer and registration flow.
- **Registration consent:** Users must accept Terms, Privacy Policy, and DPA at signup (`accept_terms`, `accept_privacy`, `accept_dpa`).

Company and social links are configured via `CERTALYTIC_COMPANY_*` and `CERTALYTIC_SOCIAL_*` env vars, exposed via public config API (legacy: Inertia shared props).

## 9. Key database entities

- `users` — authentication, active organization/team selection
- `teams` / `organizations` — org workspace, plan, Stripe billing, `transcript_tokens` balance
- `team_user` / `members` — membership, role (owner/member)
- `team_invitations` — email invitations with accept flow
- `roles` — title, description (all tiers with saved roles)
- `role_documents` — scan assets (Scale+)
- `role_exports` — async role PDF export jobs (status, path, error)
- `candidates` — screening record, integrity score, score breakdown (integrity components + supplementary analyses + virtual `round_analyses`)
- `interview_rounds` — merged transcript in round 1; supplementary rows for virtual segments 2+; optional audio fields for in-flow transcription
- `audio_transcriptions` — standalone transcription jobs: status, diarized `segments`, `speaker_labels`, formatted `transcript_text`
- `transcript_token_credits` — idempotent Stripe checkout credit ledger

## 10. Environment

### Backend (`apps/backend`)

```env
# Mistral (required — no fake evaluator fallback)
MISTRAL_API_KEY=
MISTRAL_CHAT_MODEL=mistral-small-latest
MISTRAL_OCR_MODEL=mistral-ocr-latest
MISTRAL_TRANSCRIPTION_MODEL=voxtral-mini-latest

# Redis / queues
REDIS_URL=

# Stripe (auth plugin + packs)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_SCALE=
STRIPE_PRICE_PACK_QUICK=
STRIPE_PRICE_PACK_SURGE=
STRIPE_PRICE_PACK_BOOST=
STRIPE_PRICE_TRANSCRIPT_FIVE_PACK=

# Company / legal (public config API)
CERTALYTIC_COMPANY_EMAIL=hello@certalytic.com
CERTALYTIC_COMPANY_LEGAL_NAME="Certalytic GmbH"
# ... see apps/backend .env.example when added

# Marketing stats (landing page)
CERTALYTIC_MARKETING_CANDIDATES_SCREENED="12,400+"
CERTALYTIC_MARKETING_CUSTOMERS="180+"
CERTALYTIC_MARKETING_COUNTRIES="14"
CERTALYTIC_MARKETING_AUDIO_HOURS="2,800+"
CERTALYTIC_MARKETING_SAVED_MILLIONS="€4.2M"
```

Run BullMQ workers via `apps/backend` process (see `src/index.ts`). Queue names: `emails`, `screening`, `screenings-priority`, `transcriptions`, `roles`.

Legacy Laravel env reference: `php-migration/.env.example`.

## 11. Roadmap

Approximate delivery quarters (also rendered on the public landing page). Items not yet built.

| Quarter | Feature | Description |
|---|---|---|
| **Q3 2026** | ATS integrations | Push integrity reports into Greenhouse, Lever, and Workday without manual copy-paste |
| **Q4 2026** | Enterprise SSO | SAML and OIDC single sign-on with seat provisioning for agency and in-house TA teams |
| **Q1 2027** | Batch screening | Upload a cohort of candidates against one role profile and compare integrity signals side by side |
| **Q2 2027** | Public API & webhooks | Programmatic screening triggers and signed webhook delivery for custom hiring stacks |

### Additional backlog (unscheduled)

- Automatic LinkedIn profile fetch API (today: manual paste or URL-only passthrough)
- Native Zoom / Teams / Google Meet recording import
- Re-screening with component-level cache reuse
- Annual billing option
- Enterprise: dedicated success manager, custom onboarding (sales-led today)

### Platform migration (in progress)

- Laravel → Turborepo — see [migration plans](./migration/)

---

*Last aligned with codebase: June 2026.*
