import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated, transactional, and API surfaces — nothing to index.
      disallow: ['/dashboard', '/admin', '/api/', '/auth', '/post-property', '/post-project'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
