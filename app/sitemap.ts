import type { MetadataRoute } from 'next';

const BASE = 'https://unicash.com.au';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Public marketing pages safe to index now.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                     lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/about`,                lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/faq`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/scan-receipts`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/point-boosters`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/rewards/gift-cards`,   lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/winners`,              lastModified: now, changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/contact`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/refund-policy`,  lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];

  // Draws legally cleared (2026-06-14) → index the collection page.
  staticRoutes.push(
    { url: `${BASE}/giveaways`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  );

  // Dynamic per-item routes (gift-card brands, open/published draws, live landing
  // pages) are added in Group 2 once those SSR pages + a server API client land:
  //   const brands = await api.giftCards.listBrands();
  //   const draws  = await api.draws.listPublic();
  // (Add /rewards/gift-cards/[brandId], /giveaways/[id], /win/[slug], /lp/[slug].)

  return [...staticRoutes];
}
