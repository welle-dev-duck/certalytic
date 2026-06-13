### I18n support for German and English
- [x] non route bsaed (e.g no /en/dashboard and /de/dashboard)
- [x] lang comes from browser language by default english
- [x] lang switcher accessible on the marketing and auth pages
- [x] lang switcher in settings/languages
- [x] everything is translated only on the frontend, backend still communicates in english messages, country selectors with country names and everything should be translated (probably there is  library for i18n countries for country names and i18n for languages)
- [x] use good structured message files so we only pass in the needed translations via a client side hook. for RSC that has text we need to use of course a server side utility to get the translations
- [x] Every auth page is translated
- [x] Every app page is translated
- [x] Marketing page and legal pages are translated
