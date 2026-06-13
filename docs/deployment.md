# Certalytic deployment guide (Coolify + Hetzner)

This guide deploys Certalytic as **two Coolify applications** from the same monorepo:

| Domain | App | Package |
|---|---|---|
| `https://welle-digital.at` | Next.js frontend | `apps/web` |
| `https://api.welle-digital.at` | Express API + workers + WebSocket | `apps/backend` |

Shared infrastructure: **PostgreSQL**, **Redis**, **Hetzner Object Storage** (S3-compatible).

---

## 1. Prerequisites

Before deploying:

- [ ] Hetzner Cloud server with [Coolify](https://coolify.io/) installed
- [ ] Domain `welle-digital.at` with DNS access
- [ ] Git repository connected to Coolify
- [ ] PostgreSQL database (Coolify service or Hetzner Managed)
- [ ] Redis instance (Coolify service or self-hosted)
- [ ] Hetzner Object Storage bucket + access keys
- [ ] Stripe account (live mode keys + webhook)
- [ ] Resend account with verified sending domain
- [ ] Mistral API key
- [ ] Sentry projects (optional, recommended: one for web, one for API)

---

## 2. DNS

Point both hostnames at your **Coolify server public IP**:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `YOUR_SERVER_IP` |
| A | `api` | `YOUR_SERVER_IP` |

Optional: add `www` and redirect it to the apex in Coolify if you want a single canonical URL.

**Pick one canonical frontend URL** and use it everywhere as `WEB_APP_URL` / `NEXT_PUBLIC_WEB_APP_URL`:

- Recommended: `https://welle-digital.at` (no `www`)

Coolify will issue Let's Encrypt certificates once DNS propagates and domains are attached to each app.

---

## 3. Infrastructure services

Create these before the application resources.

### PostgreSQL

Create a database (e.g. `certalytic`) and note the connection string:

```
postgres://USER:PASSWORD@HOST:5432/certalytic
```

### Redis

Note the connection URL:

```
redis://:PASSWORD@HOST:6379
```

Used by BullMQ (screening, emails, exports) and realtime pub/sub.

### Hetzner Object Storage

Create a bucket (e.g. `certalytic-prod`) and access keys. Use the S3 endpoint Hetzner provides, for example:

```
AWS_ENDPOINT=https://YOUR_LOCATION.your-objectstorage.com
AWS_USE_PATH_STYLE_ENDPOINT=false
AWS_DEFAULT_REGION=eu-central-1
```

Local development uses MinIO from `apps/backend/docker-compose.yml`; production uses Hetzner Object Storage.

---

## 4. Coolify resource: API (`api.welle-digital.at`)

### 4.1 Create the resource

1. In Coolify: **New Resource → Application**
2. Connect your Git repository (monorepo root — do not set base directory to `apps/backend` alone)
3. Name: `certalytic-api`
4. Domain: `api.welle-digital.at`
5. Enable **HTTPS** (Let's Encrypt)
6. Enable **WebSocket** support (required for `/api/realtime`)

### 4.2 Build & start commands

**Install / build command:**

```bash
pnpm install --frozen-lockfile && pnpm --filter backend build && pnpm --filter backend db:migrate
```

**Start command:**

```bash
pnpm --filter backend start
```

**Port:** `3000` (Coolify sets `PORT`; the backend reads it from env)

### 4.3 Environment variables (API)

```bash
# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# URLs — must match the web app (see section 6)
BASE_URL=https://api.welle-digital.at
WEB_APP_URL=https://welle-digital.at

# Shared auth cookie domain (optional — defaults to WEB_APP_URL hostname)
AUTH_COOKIE_DOMAIN=welle-digital.at

# Database & queue
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/certalytic
REDIS_URL=redis://:PASSWORD@HOST:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
STRIPE_PRICE_PACK_QUICK=price_...
STRIPE_PRICE_PACK_SURGE=price_...
STRIPE_PRICE_PACK_BOOST=price_...

# Mistral
MISTRAL_API_KEY=...
MISTRAL_BASE_URL=https://api.mistral.ai
MISTRAL_OCR_MODEL=mistral-ocr-latest
MISTRAL_CHAT_MODEL=mistral-small-latest

# Object storage (Hetzner)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-central-1
AWS_BUCKET=certalytic-prod
AWS_ENDPOINT=https://YOUR_LOCATION.your-objectstorage.com
AWS_USE_PATH_STYLE_ENDPOINT=false

# Email (required in production)
RESEND_API_KEY=re_...
RESEND_FROM_ADDRESS=info@welle-digital.at
RESEND_FROM_NAME=Certalytic

# Sentry (optional)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 4.4 Deploy the API first

Deploy and verify:

```bash
curl https://api.welle-digital.at/api/health
```

Expect `200` with `"status": "ok"` when Postgres and Redis are reachable.

---

## 5. Coolify resource: Web (`welle-digital.at`)

### 5.1 Create the resource

1. **New Resource → Application** (same Git repo, monorepo root)
2. Name: `certalytic-web`
3. Domain: `welle-digital.at`
4. Enable **HTTPS**

### 5.2 Build & start commands

**Install / build command:**

```bash
pnpm install --frozen-lockfile && pnpm --filter web build
```

**Start command:**

```bash
pnpm --filter web start
```

**Port:** `3000`

> **Important:** `NEXT_PUBLIC_*` variables are embedded at **build time**. Set them in Coolify **before** the first build, and trigger a **rebuild** whenever you change them.

### 5.3 Environment variables (Web)

```bash
NODE_ENV=production
PORT=3000

# Public URLs (baked into the client bundle at build time)
NEXT_PUBLIC_SITE_URL=https://welle-digital.at
NEXT_PUBLIC_API_URL=https://api.welle-digital.at
NEXT_PUBLIC_AUTH_URL=https://api.welle-digital.at
NEXT_PUBLIC_WEB_APP_URL=https://welle-digital.at
NEXT_PUBLIC_WEB_APP_DASHBOARD_URL=https://welle-digital.at/dashboard

# Sentry — frontend project (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Sentry source map upload during build (optional)
SENTRY_ORG=your-org
SENTRY_PROJECT=certalytic-web
SENTRY_AUTH_TOKEN=sntrys_...

# Optional maintenance banner (server-rendered)
SYSTEM_MESSAGE_BANNER_TEXT=
```

Deploy the web app after the API is healthy.

---

## 6. URL wiring checklist

These values must agree across both apps:

| Variable | Value |
|----------|-------|
| `BASE_URL` (API) | `https://api.welle-digital.at` |
| `WEB_APP_URL` (API) | `https://welle-digital.at` |
| `NEXT_PUBLIC_API_URL` (web) | `https://api.welle-digital.at` |
| `NEXT_PUBLIC_AUTH_URL` (web) | `https://api.welle-digital.at` |
| `NEXT_PUBLIC_WEB_APP_URL` (web) | `https://welle-digital.at` |

Use `https://` everywhere. No trailing slashes on base URLs.

---

## 7. Cross-subdomain auth cookies

The frontend (`welle-digital.at`) and API (`api.welle-digital.at`) are different origins. Auth is handled by **better-auth on the API**, with session cookies shared via a parent domain.

This is configured in `apps/backend/src/modules/auth/auth.ts` for production:

- `crossSubDomainCookies.enabled: true`
- `crossSubDomainCookies.domain` → `welle-digital.at` (from `AUTH_COOKIE_DOMAIN` or derived from `WEB_APP_URL`)
- `defaultCookieAttributes.sameSite: 'none'`
- `defaultCookieAttributes.secure: true`

The web auth client (`apps/web/lib/auth-client.ts`) sends cookies with `credentials: 'include'`. REST calls in `apps/web/lib/api-client.ts` do the same.

CORS on the API allows `WEB_APP_URL` with `credentials: true`.

### Verify cookies after sign-in

1. Open `https://welle-digital.at` and sign in
2. DevTools → **Application → Cookies**
3. Look for `certalytic.*` cookies on `.welle-digital.at`
4. Flags should include **Secure**, **SameSite=None**, **Domain=welle-digital.at**
5. Network tab: requests to `api.welle-digital.at` should include the session cookie

If auth fails after deploy, this URL/cookie table is the first place to check.

---

## 8. External service configuration

### Stripe webhook

In the Stripe Dashboard → **Developers → Webhooks**, add:

```
https://api.welle-digital.at/api/auth/stripe/webhook
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET` on the API app.

### Resend

Verify the sending domain (`welle-digital.at`) in Resend so `RESEND_FROM_ADDRESS` (e.g. `info@welle-digital.at`) can send verification and invitation emails.

### Sentry

Create two projects:

- `certalytic-web` — DSN in `NEXT_PUBLIC_SENTRY_DSN`
- `certalytic-api` — DSN in `SENTRY_DSN`

---

## 9. Post-deploy smoke test

Run through this checklist:

- [ ] `GET https://api.welle-digital.at/api/health` returns 200
- [ ] `https://welle-digital.at` loads the marketing page
- [ ] Sign up → receive verification email → verify → land on dashboard
- [ ] Create organization → first org becomes active automatically
- [ ] Start a screening → progress updates without manual refresh (WebSocket)
- [ ] Screening completes → report visible on candidate detail
- [ ] Stripe checkout / billing page works (test mode first if preferred)
- [ ] Role PDF export completes and downloads

---

## 10. Local development vs production

| Concern | Local | Production |
|---------|-------|------------|
| Web URL | `http://localhost:3001` | `https://welle-digital.at` |
| API URL | `http://localhost:3000` | `https://api.welle-digital.at` |
| Cross-subdomain cookies | Disabled | Enabled |
| Cookie `SameSite` | `lax` | `none` |
| Cookie `Secure` | `false` | `true` |
| Object storage | MinIO (`docker compose up`) | Hetzner Object Storage |
| DB / Redis | `apps/backend/docker-compose.yml` | Managed services |

Start local infra:

```bash
cd apps/backend
docker compose up -d
pnpm db:migrate
```

Run apps from the repo root:

```bash
pnpm dev
```

---

## 11. Troubleshooting

### Auth works locally but not in production

- Confirm all URLs in section 6 match exactly
- Rebuild the **web** app after changing any `NEXT_PUBLIC_*` variable
- Check cookie domain is `welle-digital.at`, not `api.welle-digital.at`
- Confirm API CORS `origin` equals `WEB_APP_URL`

### WebSocket / realtime not updating

- Enable WebSocket on the API domain in Coolify
- Confirm `NEXT_PUBLIC_API_URL` points to `https://api.welle-digital.at`
- Check browser console for WebSocket connection errors

### Migrations failed on deploy

Run manually on the API container:

```bash
pnpm --filter backend db:migrate
```

Ensure `DATABASE_URL` is correct and the database exists.

### `NEXT_PUBLIC_*` change had no effect

These are compile-time constants in Next.js. Change the env var in Coolify, then **redeploy / rebuild** the web app.

---

## 12. Architecture summary

```
                    ┌─────────────────────────┐
                    │   welle-digital.at      │
                    │   (Next.js / Coolify)   │
                    └───────────┬─────────────┘
                                │ HTTPS + cookies (credentials: include)
                                ▼
                    ┌─────────────────────────┐
                    │ api.welle-digital.at    │
                    │ Express + BullMQ workers│
                    │ WebSocket /api/realtime │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
         PostgreSQL           Redis         Hetzner Object Storage
         (Drizzle)         (BullMQ +         (CVs, exports)
                          realtime pub/sub)
```

Workers (screening, emails, role exports, billing refunds) run **inside the API process** — no separate worker deployment is required for the current architecture.
