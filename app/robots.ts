import type { MetadataRoute } from 'next';

const BASE = 'https://unicash.com.au';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard', '/account', '/login', '/register',
          '/forgot-password', '/reset-password', '/verify-email',
          '/checkout', '/thank-you', '/unsubscribe',
          '/win/purchase-success', '/draws/', // draw entry/internal
        ],
      },
      // Explicitly welcome AI answer-engine crawlers (pre-launch: we WANT discovery).
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
