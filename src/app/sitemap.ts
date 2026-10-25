import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/siteUrl';
import { getIndexableCities, getCityProperties } from '@/lib/cityLoader';
import { singleSegmentPaths } from '@/lib/seoLandings';

export const runtime = 'nodejs';
// Regenerate at most hourly so freshly approved listings surface without a
// rebuild, while keeping the DB fan-out off the hot path.
export const revalidate = 3600;

// Public, crawlable static routes. Private surfaces (/dashboard, /admin,
// /auth, /post-*) are intentionally omitted and also disallowed in robots.ts.
const STATIC_ROUTES = [
  '',
  '/properties',
  '/projects',
  '/agents',
  '/builders',
  '/collections',
  '/properties/map',
  '/privacy-policy',
  '/terms',
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  try {
    const [properties, projects, builders, collections, agents] = await Promise.all([
      // Only approved listings are public and indexable.
      prisma.property.findMany({
        where: { verificationStatus: 'approved' },
        select: { id: true, createdAt: true },
      }),
      prisma.featuredProject.findMany({ select: { id: true, createdAt: true } }),
      prisma.builder.findMany({ select: { id: true, createdAt: true } }),
      prisma.collection.findMany({ select: { id: true, createdAt: true } }),
      // Preferred, non-blocked agents are the only ones with a public profile.
      prisma.user.findMany({
        where: { role: 'agent', isPreferredAgent: true, isBlocked: false },
        select: { id: true, createdAt: true },
      }),
    ]);

    for (const p of properties)
      entries.push({ url: `${base}/properties/${p.id}`, lastModified: p.createdAt, changeFrequency: 'weekly', priority: 0.9 });
    for (const p of projects)
      entries.push({ url: `${base}/projects/${p.id}`, lastModified: p.createdAt, changeFrequency: 'weekly', priority: 0.8 });
    for (const b of builders)
      entries.push({ url: `${base}/builders/${b.id}`, lastModified: b.createdAt, changeFrequency: 'monthly', priority: 0.6 });
    for (const c of collections)
      entries.push({ url: `${base}/collections/${c.id}`, lastModified: c.createdAt, changeFrequency: 'monthly', priority: 0.6 });
    for (const a of agents)
      entries.push({ url: `${base}/agents/${a.id}`, lastModified: a.createdAt, changeFrequency: 'monthly', priority: 0.6 });

    // City landing pages — one per city with approved inventory.
    const cities = await getIndexableCities();
    for (const c of cities)
      entries.push({ url: `${base}/properties/in/${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });

    // Locality & property-type landing pages below each city (single-segment,
    // inventory-backed only). Two-segment combos are reached via internal links.
    for (const c of cities) {
      try {
        const cityProps = await getCityProperties(c.name);
        for (const seg of singleSegmentPaths(cityProps))
          entries.push({ url: `${base}/properties/in/${c.slug}/${seg}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });
      } catch (e) {
        console.error('sitemap landing paths error for', c.name, e);
      }
    }
  } catch (err) {
    // A DB hiccup must not 500 the sitemap; serve the static routes at least.
    console.error('sitemap generation error', err);
  }

  return entries;
}
