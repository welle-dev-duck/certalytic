# Backend TODO

## Email delivery (required before production)

`EmailsService` currently logs to stdout instead of sending mail. Auth already enqueues jobs for:

- Password reset (`sendResetPassword`)
- Email verification (`sendVerificationEmail`)
- Organization invitations (`sendInvitationEmail`)

**Work required:**

1. Choose provider (e.g. Resend, Postmark, AWS SES EU region)
2. Implement `EmailsService.process()` with HTML/text templates
3. Add env vars for API keys and from-address
4. Replace `console.error` in `EmailsWorkers` failed handler with structured logger (Phase 5)
5. Add integration test or e2e smoke test with provider sandbox
