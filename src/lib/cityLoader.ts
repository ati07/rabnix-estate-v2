import 'server-only';
import { prisma } from '@/lib/prisma';
import { serializeProperty } from '@/lib/serialize';
import { cityToSlug } from '@/lib/slug';
import type { Property } from '@/lib/types';

// Re-exported so existing `import { cityToSlug } from '@/lib/cityLoader'` call
// sites keep working; the implementation now lives in the client-safe slug util.
export { cityToSlug };

/**
 * Server-side data for the city landing pages (/properties/in/[city]). These
 * are SEO/AEO entry points, so everything here is public: only approved
 * listings, phone always withheld (serializeProperty(p, false)).
 */

export type CitySummary = { name: string; slug: string; count: number };

/**
 * Distinct cities that actually have approved listings, with a count each,
 * busiest first. Feeds generateStaticParams and the "browse by city" links.
 * Returns [] on any DB error so the build never fails.
 */
export async function getIndexableCities(): Promise<CitySummary[]> {
  try {
    const grouped = await prisma.property.groupBy({
      by: ['city'],
      where: { verificationStatus: 'approved' },
      _count: { _all: true },
    });
    return grouped
      .filter((g) => g.city && g.city.trim() !== '')
      .map((g) => ({ name: g.city.trim(), slug: cityToSlug(g.city.trim()), count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error('getIndexableCities error', err);
    return [];
  }
}

/**
 * Resolve a slug back to the canonical city name as stored on listings (so
 * "new-delhi" → "New Delhi"). Returns null when no approved listings match.
 */
export async function resolveCitySlug(slug: string): Promise<string | null> {
  const cities = await getIndexableCities();
  const match = cities.find((c) => c.slug === slug);
  return match ? match.name : null;
}

/** All approved listings in a city (case-insensitive), newest first. Phone withheld. */
export async function getCityProperties(cityName: string): Promise<Property[]> {
  try {
    const rows = await prisma.property.findMany({
      where: {
        verificationStatus: 'approved',
        city: { equals: cityName, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => serializeProperty(p, false));
  } catch (err) {
    console.error('getCityProperties error for', cityName, err);
    return [];
  }
}
