'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Phase OBS1 — App Router global error boundary for Sentry.
 *
 * Catches React render errors that bubble past route-level error.tsx
 * (or when there isn't one). Without this file, Sentry's Next.js
 * integration warns at boot and React tree crashes are silently
 * eaten by Next's default fallback.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We've logged the issue and will investigate. Please try again.
          </p>
          {error?.digest && (
            <p className="mt-4 text-xs text-slate-400">
              Error ID: <code>{error.digest}</code>
            </p>
          )}
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
