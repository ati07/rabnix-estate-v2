import type { Property } from './types';

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  iconName: string;
  heroImage: string;
  badge: string;
  actionText: string;
  overview: string;
  keyHighlights: {
    title: string;
    description: string;
  }[];
  filters: {
    isOwnerOnly?: boolean;
    isVerifiedOnly?: boolean;
    isReraApprovedOnly?: boolean;
    constructionStatus?: 'Ready to Move' | 'Under Construction' | 'New Launch';
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    listingType?: 'buy' | 'rent' | 'commercial' | 'plot' | 'pg';
    bhk?: number[];
  };
  recommendedCities: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

// Does a property satisfy a collection's saved filter? Mirrors the server-side
// whereFromFilters (api/collections/[id]) so client-side counts and price bands
// match exactly what the collection detail page lists.
export function matchesCollectionFilters(p: Property, f: CuratedCollection['filters']): boolean {
  if (p.verificationStatus && p.verificationStatus !== 'approved') return false;
  if (f.isOwnerOnly && p.postedBy?.type !== 'Owner' && !p.isExclusiveOwner) return false;
  if (f.isVerifiedOnly && !p.isVerified) return false;
  if (f.isReraApprovedOnly && !p.reraApproved) return false;
  if (f.constructionStatus && p.constructionStatus !== f.constructionStatus) return false;
  if (f.category && p.category.toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.listingType && p.listingType !== f.listingType) return false;
  if (Array.isArray(f.bhk) && f.bhk.length && (p.bhk == null || !f.bhk.includes(p.bhk))) return false;
  if (f.minPrice != null && p.price < f.minPrice) return false;
  if (f.maxPrice != null && p.price > f.maxPrice) return false;
  return true;
}

// Real price band for a set of matched listings, using each listing's own
// formatted price. Returns null when there are no matches (caller hides it) so
// we never show a fabricated range.
export function collectionPriceRange(matched: Property[]): string | null {
  if (matched.length === 0) return null;
  let lo = matched[0];
  let hi = matched[0];
  for (const p of matched) {
    if (p.price < lo.price) lo = p;
    if (p.price > hi.price) hi = p;
  }
  return lo.priceFormatted === hi.priceFormatted
    ? lo.priceFormatted
    : `${lo.priceFormatted} - ${hi.priceFormatted}`;
}
