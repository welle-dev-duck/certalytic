import * as Sentry from '@sentry/node';

import { env } from '../config/env';

export function isSentryEnabled(): boolean {
  return Boolean(env.SENTRY_DSN);
}

export function initSentry(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.postgresIntegration(),
      Sentry.redisIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
    ],
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('details', context);
    }

    Sentry.captureException(error);
  });
}

export async function flushSentry(timeoutMs = 2_000): Promise<void> {
  if (!isSentryEnabled()) {
    return;
  }

  await Sentry.flush(timeoutMs);
}
