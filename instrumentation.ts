/**
 * Phase OBS1 — Next.js 14 instrumentation hook for Sentry.
 *
 * Without this file, the `sentry.server.config.ts` / `sentry.edge.config.ts`
 * never executes and server-side errors are silently dropped. The companion
 * `experimental.instrumentationHook` flag in next.config.js wires Next.js
 * to call `register()` on app boot (each runtime once).
 *
 * Client-side init is still handled by `sentry.client.config.ts` via
 * `withSentryConfig`'s automatic injection.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
