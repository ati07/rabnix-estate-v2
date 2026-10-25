import type { Property } from '@/lib/types';
import { dealPhrase } from '@/lib/seoText';
import { cityToSlug } from '@/lib/cityLoader';

/**
 * Programmatic SEO landing pages — locality and property-type pages that live
 * below the city page at /properties/in/[city]/[...filters]. This module owns
 * the controlled property-type vocabulary and the segment resolvers. It filters
 * an already-loaded listing set in memory (the city page's getCityProperties
 * output), so there is no new DB query logic and no anti-scraping surface.
 *
 * Slugs are reused for URLs; cityToSlug() gives us the same slugify rules used
 * for city slugs, applied here to locality names too.
 */

/** A property-type token: a canonical URL slug + a human label + a predicate
 * over the real listing set. One slug per concept (no synonyms) to keep each
 * landing page a unique, non-duplicate target. */
export type PropertyTypeDef = {
  slug: string;
  /** Used in <h1> and <title>, e.g. "2 BHK Flats". */
  label: string;
  /** True when a listing belongs on this type page. */
  match: (p: Property) => boolean;
};

const CATEGORY_TYPES: Array<{ slug: string; label: string; category: Property['category'] }> = [
  { slug: 'flats', label: 'Flats & Apartments', category: 'Apartment' },
  { slug: 'villas', label: 'Villas', category: 'Villa' },
  { slug: 'builder-floors', label: 'Builder Floors', category: 'Builder Floor' },
  { slug: 'studio-apartments', label: 'Studio Apartments', category: 'Studio' },
  { slug: 'penthouses', label: 'Penthouses', category: 'Penthouse' },
  { slug: 'office-space', label: 'Office Spaces', category: 'Commercial Office' },
  { slug: 'shops', label: 'Shops & Retail', category: 'Retail Shop' },
  { slug: 'warehouses', label: 'Warehouses', category: 'Warehouse' },
];

/** Build the full controlled vocabulary once. */
function buildTypes(): PropertyTypeDef[] {
  const types: PropertyTypeDef[] = [
    { slug: 'for-sale', label: 'Property for Sale', match: (p) => dealPhrase(p) === 'for Sale' },
    { slug: 'for-rent', label: 'Property for Rent', match: (p) => dealPhrase(p) === 'for Rent' },
    { slug: 'pg', label: 'PG & Co-Living', match: (p) => p.listingType === 'pg' },
    {
      slug: 'plots',
      label: 'Plots & Land',
      match: (p) =>
        p.listingType === 'plot' ||
        p.category === 'Residential Plot' ||
        p.category === 'Commercial Land',
    },
    { slug: 'commercial', label: 'Commercial Property', match: (p) => p.listingType === 'commercial' },
  ];

  for (const c of CATEGORY_TYPES) {
    types.push({ slug: c.slug, label: c.label, match: (p) => p.category === c.category });
  }

  // BHK pages (1–5): bare "{n}-bhk" plus the common "{n}-bhk-flats" combo.
  for (let n = 1; n <= 5; n++) {
    types.push({ slug: `${n}-bhk`, label: `${n} BHK Homes`, match: (p) => p.bhk === n });
    types.push({
      slug: `${n}-bhk-flats`,
      label: `${n} BHK Flats`,
      match: (p) => p.bhk === n && p.category === 'Apartment',
    });
  }

  return types;
}

const PROPERTY_TYPES: PropertyTypeDef[] = buildTypes();
const TYPE_BY_SLUG = new Map(PROPERTY_TYPES.map((t) => [t.slug, t]));

/** Resolve a URL token to a property-type def, or null if it is not a type. */
export function resolvePropertyType(slug: string): PropertyTypeDef | null {
  return TYPE_BY_SLUG.get(slug) ?? null;
}

/** The property-type tokens that actually have ≥1 matching listing in this set,
 * busiest first — for cross-links and static generation (no thin pages). */
export function availableTypes(properties: Property[]): Array<{ def: PropertyTypeDef; count: number }> {
  return PROPERTY_TYPES
    .map((def) => ({ def, count: properties.filter(def.match).length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
}

export type LocalityInfo = { name: string; slug: string; count: number };

/** Distinct localities present in this listing set, with counts, busiest first. */
export function availableLocalities(properties: Property[]): LocalityInfo[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const p of properties) {
    const name = (p.locality || '').trim();
    if (!name) continue;
    const slug = cityToSlug(name);
    if (!slug) continue;
    const prev = counts.get(slug);
    if (prev) prev.count++;
    else counts.set(slug, { name, count: 1 });
  }
  return [...counts.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

/** Resolve a locality slug back to its canonical name within this city's set. */
export function resolveLocalitySlug(properties: Property[], slug: string): LocalityInfo | null {
  return availableLocalities(properties).find((l) => l.slug === slug) ?? null;
}

export type Resolved =
  | { kind: 'type'; type: PropertyTypeDef; locality: null; properties: Property[] }
  | { kind: 'locality'; type: null; locality: LocalityInfo; properties: Property[] }
  | { kind: 'locality-type'; type: PropertyTypeDef; locality: LocalityInfo; properties: Property[] };

/**
 * Resolve the catch-all `filters` segments against a city's listing set.
 * Returns null when the URL is malformed or yields zero listings (→ caller 404s).
 *
 * - 1 segment: a property-type token, else a locality slug.
 * - 2 segments: [locality, type].
 */
export function resolveLanding(properties: Property[], filters: string[]): Resolved | null {
  if (filters.length === 1) {
    const [seg] = filters;
    const type = resolvePropertyType(seg);
    if (type) {
      const matched = properties.filter(type.match);
      return matched.length ? { kind: 'type', type, locality: null, properties: matched } : null;
    }
    const locality = resolveLocalitySlug(properties, seg);
    if (locality) {
      const matched = properties.filter((p) => cityToSlug((p.locality || '').trim()) === locality.slug);
      return matched.length ? { kind: 'locality', type: null, locality, properties: matched } : null;
    }
    return null;
  }

  if (filters.length === 2) {
    const [locSeg, typeSeg] = filters;
    const locality = resolveLocalitySlug(properties, locSeg);
    const type = resolvePropertyType(typeSeg);
    if (!locality || !type) return null;
    const matched = properties.filter(
      (p) => cityToSlug((p.locality || '').trim()) === locality.slug && type.match(p),
    );
    return matched.length
      ? { kind: 'locality-type', type, locality, properties: matched }
      : null;
  }

  return null;
}

/**
 * Single-segment landing paths (localities + type tokens) that have inventory,
 * for generateStaticParams and the sitemap. Two-segment combos are left to
 * on-demand ISR + internal links to keep the build bounded.
 */
export function singleSegmentPaths(properties: Property[]): string[] {
  const paths: string[] = [];
  for (const l of availableLocalities(properties)) paths.push(l.slug);
  for (const t of availableTypes(properties)) paths.push(t.def.slug);
  return paths;
}
