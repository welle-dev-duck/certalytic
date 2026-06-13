### I18n support for German and English
- [x] non route bsaed (e.g no /en/dashboard and /de/dashboard)
- [x] lang comes from browser language by default english
- [x] lang switcher accessible on the marketing and auth pages (store on cookies)
- [x] lang switcher in settings/languages
- [x] everything is translated only on the frontend, backend still communicates in english messages, country selectors with country names and everything should be translated (probably there is  library for i18n countries for country names and i18n for languages)
- [x] use good structured message files so we only pass in the needed translations via a client side hook. for RSC that has text we need to use of course a server side utility to get the translations
- [x] Every auth page is translated
- [x] Every app page is translated
- [x] Marketing page and legal pages are translated

### Add org fields (better auth config organization plugin schema, additionalFields) (High)
- [x] Add fields to better auth config in backend
- [x] Add proper zod validation for these fields
- [x] Country (defaults to Österreich (we only store iso values like at))
- [x] Language (for evaluation text in details and export (keep prompt in english, calculate score should remain untouched, summaries and insigths should be in the preferred language, defaults to English, only the field is important here, dont change evaluation))
- [x] These are be added to the create org dialog and the org settings page

### Screening Process (High)
- Modify the multi step form:
    [x] - Rename first step to General: Refactor role selection, it should be a searchavble shadcn combobox (we need to load all the roles the org has with no pagination, if screening is done from a Role details page then we pre-select that one from this combobox), Add a mew field Language with a short description to explain the analysis summary and pdf export will be generated in this language, for now only English and German, defaults to the orgs language -> This means we need to also modify the backend so it knows about the field and we need to append the prompt to give the info in the selected languag
- [x] Ensure when a screening is done completely (succeeded), we delete (or replace with empty string if we cannot use null) from the database and file storage: cv, cvtext, interview transcript files, interview texts, internal notes, linkedin and github profile data if we kept it.
- [x] A screening can be only re-run if if it failed completely (5 times), if it completely failed, set a failed_at field, and create a cron job or something that runs every day and if there are failed candidates older than 30 days we completely erase every sensitive data about them and they cannot be re-run (if failed_at is bigger than 30 days and they try to re-run it we show an error toast, backend also denies the request)

### Deletion (Medium)
[x] - When a role is deleted, we completely wipe everything. Role data, candidates, files if left some, everything. Same if the user is deleting 
a failed screening then every data about it everything needs to be wiped.
[x] - Users should be only deleted if they have an org (owner) they cannot be deleted probably better auth hook
[x] - If we delete an org, delete every data it had completely wipe (just keep subscription data, i guess database cascades here are the best?)


### Email delivery (required before production)

`EmailsService` sends via Resend when configured. Auth enqueues jobs for:

- Password reset (`sendResetPassword`)
- Email verification (`sendVerificationEmail`)
- Organization invitations (`sendInvitationEmail`)

**Work required:**

1. [x] Choose provider (Resend)
2. [x] Implement `EmailsService.process()` with HTML/text templates (emails in english only for now)
3. [x] Add env vars for API keys and from-address (`RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `RESEND_FROM_NAME`)
4. [x] Replace `console.error` in `EmailsWorkers` failed handler with structured logger (Phase 5)
5. [x] Add unit tests for templates, mailer stub, and service dispatch

### 404 Page (Low)
- [x] Global 404 page

### Propert Metadata & SEO (Medium)
- [x] Marketing page has proper SEO set up, only 1 h1 tag, clear hierarchy, canonical links, etc
- [x] App pages have at least title and description set up
- [x] Favicon
- [x] Twitter cards
- [x] OG Data
- [x] Auth pages have at least title and description set up


### Error Page + Sentry for frontend (High)
- [x] Branded `error.tsx` and `global-error.tsx` with Sentry reporting
- [x] `@sentry/nextjs` wired via instrumentation and Next config
- [x] Env vars documented in `apps/web/.env.example`


### Analytics (Low)
[ ] - We need to measure how many screenings is done in total, an avg screening a month for an org with which plan the org is on, avg time a screening takes (probably we need just to push to redis and aggregate like every hour or posthog, you need to plan this)
[ ] - We need to measure churn, and subscription things, we need to measure behaviour on the marketing page (number of visitors, where they came from (referrer), how long are they on the landing page, what buttons they click on it, how many times, etc)