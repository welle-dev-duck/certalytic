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
- [ ] Country (defaults to Österreich (we only store AT or HU or one of these ISO values))
- [ ] Preferred Language (for evaluation text in details and export (keep prompt in english, calculate score should remain untouched, summaries and insigths should be in the preferred language, defaults to English))

### Screening Process (High)
- Modify the multi step form:
    [ ] - Rename first step to General: Refactor role selection, it should be a searchavble shadcn combobox (we need to load all the roles the org has with no pagination, if screening is done from a Role details page then we pre-select that one from this combobox), Add a mew field Language with a short description to explain the analysis summary and pdf export will be generated in this language, for now only English and German, defaults to the orgs language -> This means we need to also modify the backend so it knows about the field and we need to append the prompt to give the info in the selected languag
- [ ] Ensure when a screening is done completely (succeeded), we delete (or replace with empty string if we cannot use null) from the database and file storage: cv, cvtext, interview transcript files, interview texts, internal notes, linkedin and github profile data if we kept it.
- [ ] A screening can be only re-run if if it failed completely (5 times), if it completely failed, set a failed_at field, and create a cron job or something that runs every day and if there are failed candidates older than 30 days we completely erase every sensitive data about them and they cannot be re-run (if failed_at is bigger than 30 days and they try to re-run it we show an error toast, backend also denies the request)

### Deletion (Medium)
[ ] - When a role is deleted, we completely wipe everything. Role data, candidates, files if left some, everything. Same if the user is deleting 
a failed screening then every data about it everything needs to be wiped.
[ ] - Users should be only deleted if they have an org (owner) they cannot be deleted probably better auth hook
[ ] - If we delete an org, delete every data it had completely wipe (just keep subscription data, i guess database cascades here are the best?)


### Analytics (Low)
[ ] - We need to measure how many screenings is done in total, an avg screening a month for an org with which plan the org is on, avg time a screening takes (probably we need just to push to redis and aggregate like every hour or posthog, you need to plan this)
[ ] - We need to measure churn, and subscription things, we need to measure behaviour on the marketing page (number of visitors, where they came from (referrer), how long are they on the landing page, what buttons they click on it, how many times, etc)

### 404 Page (Low)


### Error Page + Sentry for frontend (Medium)