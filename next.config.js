/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Phase OBS1 — required for Sentry server-side init via instrumentation.ts
    // on Next.js 14. Default in Next 15+. Without this, server errors never
    // reach Sentry because sentry.server.config.ts isn't loaded.
    instrumentationHook: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
};

// Phase OBS1 — wrap with Sentry only if @sentry/nextjs is installed AND
// SENTRY_DSN is configured. The dynamic require lets local dev run before
// `npm install` brings in @sentry/nextjs (otherwise next.config.js would
// throw at boot).
function withSentryIfAvailable(config) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return config;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withSentryConfig } = require('@sentry/nextjs');
    return withSentryConfig(
      config,
      {
        silent: true,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
      {
        widenClientFileUpload: true,
        hideSourceMaps: true,
        disableLogger: true,
      },
    );
  } catch {
    return config;
  }
}

module.exports = withSentryIfAvailable(nextConfig);
