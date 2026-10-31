import type { Metadata } from 'next';
import { getIndexableCities, getCityProperties, cityToSlug } from '@/lib/cityLoader';
import { resolvePropertyType, isIndexableLanding } from '@/lib/seoLandings';
import PropertiesListClient from './PropertiesListClient';

// Catalog category value → the clean landing-page type slug that represents it
// (see src/lib/seoLandings.ts). Lets a single-category filter consolidate onto
// its dedicated page instead of competing as a query-param duplicate.
const CATEGORY_TO_TYPE_SLUG: Record<string, string> = {
  Apartment: 'flats',
  Villa: 'villas',
  'Residential Plot': 'plots',
  'PG / Co-Living': 'pg',
  'Commercial Office': 'office-space',
  'Retail Shop': 'shops',
  Warehouse: 'warehouses',
  'Commercial Land': 'plots',
};

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) || '';
const asList = (v: string | string[] | undefined): string[] =>
  first(v)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== 'all');

// SEO consolidation for the faceted /properties catalog. Every filtered view is
// a query-param duplicate of a clean, server-rendered landing page, so we point
// its canonical at the best such page and let Google rank THAT instead:
//   ?city=Lucknow                      → /properties/in/lucknow
//   ?city=Bangalore&category=Villa     → /properties/in/bangalore/villas
//   ?city=Pune&bhk=2                   → /properties/in/pune/2-bhk
//   ?city=Pune&category=Apartment&bhk=3→ /properties/in/pune/3-bhk-flats
// The deep (type/BHK) canonical is only used when that filter is a single clean
// concept, no other hard facet narrows the view, AND the target page actually
// has indexable inventory — otherwise we fall back to the city page (always
// valid) or the generic catalog, so a canonical never points at a thin/404 URL.
export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const sp = await searchParams;
  const raw = first(sp.city);
  let canonical = '/properties';
  if (raw && raw.toLowerCase() !== 'all') {
    const cities = await getIndexableCities();
    const wanted = cityToSlug(raw);
    const match = cities.find((c) => c.slug === wanted || c.name.toLowerCase() === raw.toLowerCase());
    if (match) {
      canonical = `/properties/in/${match.slug}`;

      const categories = asList(sp.category);
      const bhk = asList(sp.bhk)
        .map((s) => parseInt(s, 10))
        .filter((n) => !Number.isNaN(n));

      // Any facet beyond city/category/BHK makes this a bespoke view with no clean
      // equivalent — keep it consolidating to the city page, don't deepen.
      const hasOtherFacet = Boolean(
        first(sp.minPrice) ||
          first(sp.maxPrice) ||
          first(sp.minSize) ||
          first(sp.maxSize) ||
          first(sp.verified) === 'true' ||
          first(sp.isVerified) === 'true' ||
          first(sp.owner) === 'true' ||
          first(sp.isOwner) === 'true' ||
          first(sp.rera) === 'true' ||
          first(sp.reraApproved) === 'true' ||
          (first(sp.furnishing) && first(sp.furnishing).toLowerCase() !== 'all') ||
          (first(sp.construction) && first(sp.construction).toLowerCase() !== 'all') ||
          first(sp.q) ||
          first(sp.locality) ||
          first(sp.search),
      );

      let subSlug: string | null = null;
      if (!hasOtherFacet) {
        if (categories.length === 1 && bhk.length === 1 && CATEGORY_TO_TYPE_SLUG[categories[0]] === 'flats') {
          subSlug = `${bhk[0]}-bhk-flats`;
        } else if (categories.length === 1 && bhk.length === 0) {
          subSlug = CATEGORY_TO_TYPE_SLUG[categories[0]] ?? null;
        } else if (bhk.length === 1 && categories.length === 0) {
          subSlug = `${bhk[0]}-bhk`;
        }
      }

      if (subSlug) {
        const type = resolvePropertyType(subSlug);
        if (type) {
          const props = await getCityProperties(match.name);
          const count = props.filter(type.match).length;
          if (isIndexableLanding(count)) canonical = `/properties/in/${match.slug}/${subSlug}`;
        }
      }
    }
  }
  return {
    title: 'Properties for Sale & Rent',
    description:
      'Browse verified, owner-direct homes, commercial spaces, and land for sale and rent across India on BayBayt. Filter by city, budget, BHK, and more.',
    alternates: { canonical },
  };
}

// generateMetadata reads searchParams (the ?city= canonical), which requires
// per-request rendering.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <PropertiesListClient />;
}
