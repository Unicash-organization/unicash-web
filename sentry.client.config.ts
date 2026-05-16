/**
 * Phase OBS1 — Sentry browser config (member site)
 *
 * Loaded automatically by @sentry/nextjs on every page. Captures
 * client-side errors, navigation breadcrumbs, and (optionally)
 * session replays for visual debugging of crashes.
 *
 * Disabled when NEXT_PUBLIC_SENTRY_DSN is unset so local dev runs
 * silently without a DSN.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE) || 0.1,
    // Replay is heavy — only enable in prod, opt-in 1% sampling.
    replaysSessionSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAY === 'true' ? 0.01 : 0,
    replaysOnErrorSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAY === 'true' ? 0.5 : 0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      // Browser extension noise
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network blips users hit when they kill the tab mid-fetch
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
      // Recharts SVG quirks
      "Cannot read properties of null (reading 'getAttribute')",
    ],
    beforeSend(event) {
      // Strip query strings that may carry tokens
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          ['token', 'access_token', 'reset', 'idempotencyKey'].forEach((k) =>
            u.searchParams.has(k) ? u.searchParams.set(k, '[Filtered]') : null,
          );
          event.request.url = u.toString();
        } catch {
          /* noop */
        }
      }
      return event;
    },
  });
}
