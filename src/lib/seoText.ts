import type { Property } from '@/lib/types';

/**
 * Human- and crawler-friendly phrase describing what a listing is offered as,
 * e.g. "for Sale", "for Rent", "PG / Co-Living". Used in alt text and OG copy.
 */
export function dealPhrase(p: Pick<Property, 'listingType' | 'commercialListingType'>): string {
  switch (p.listingType) {
    case 'buy':
      return 'for Sale';
    case 'rent':
      return 'for Rent';
    case 'pg':
      return 'PG / Co-Living';
    case 'plot':
      return 'for Sale';
    case 'commercial':
      return p.commercialListingType === 'rent' ? 'for Rent' : 'for Sale';
    default:
      return 'for Sale';
  }
}

/**
 * Keyword-rich description of a property, e.g.
 * "3 BHK Apartment for Sale in Koregaon Park, Pune".
 * Falls back gracefully when fields are missing.
 */
export function propertyDescriptor(
  p: Pick<Property, 'listingType' | 'commercialListingType' | 'category' | 'bhk' | 'locality' | 'city'>,
): string {
  const head = [p.bhk ? `${p.bhk} BHK` : null, p.category].filter(Boolean).join(' ');
  const loc = [p.locality, p.city].filter(Boolean).join(', ');
  const base = `${head} ${dealPhrase(p)}`.trim();
  return loc ? `${base} in ${loc}` : base;
}

/**
 * Descriptive alt text for a property image. Pass `photoNum` (1-based) for
 * gallery/thumbnail images so each photo gets a distinct alt attribute.
 */
export function propertyImageAlt(
  p: Pick<Property, 'listingType' | 'commercialListingType' | 'category' | 'bhk' | 'locality' | 'city' | 'title'>,
  photoNum?: number,
): string {
  const descriptor = propertyDescriptor(p);
  const label = descriptor || p.title;
  return photoNum ? `${label} — photo ${photoNum}` : label;
}
