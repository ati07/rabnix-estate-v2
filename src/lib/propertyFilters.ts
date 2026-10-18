/**
 * Shared property filtering — the single source of truth for turning URL search
 * params into a filter state, testing a Property against it, and sorting.
 *
 * The /properties catalog page historically filtered inline; the /properties/map
 * discovery view reuses THIS module so the two stay in sync. The predicate mirrors
 * the catalog page's logic field-for-field (city, listing type, commercial deal
 * type, category, size, bhk, price, verified/owner/rera, furnishing, construction,
 * and the multi-word text search).
 */

import type { Property, ListingType, CommercialListingType } from '@/lib/types';

/** Minimum commercial size (sq.ft) the catalog allows — matches the catalog page. */
export const MIN_SIZE_SQFT = 80;

export type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest';

export interface PropertyFilterState {
  city: string; // 'All' when unset
  listingType: ListingType | 'all';
  commercialDealType: CommercialListingType | 'all';
  category: string; // 'All' when unset
  bhk: number[];
  minSize: number;
  maxSize: number; // 0 = no upper cap
  minPrice: number;
  maxPrice: number;
  verifiedOnly: boolean;
  ownerOnly: boolean;
  reraOnly: boolean;
  furnishing: string; // 'All' when unset
  constructionStatus: string; // 'All' when unset
  searchQuery: string;
  sortBy: SortKey;
}

const DEFAULT_MAX_PRICE = 100000000;

/** Minimal read interface satisfied by URLSearchParams and Next's ReadonlyURLSearchParams. */
export interface ParamsLike {
  get(name: string): string | null;
}

export function parseFiltersFromParams(sp: ParamsLike): PropertyFilterState {
  const typeParam = sp.get('listingType') || sp.get('type');
  const listingType: ListingType | 'all' =
    typeParam && ['buy', 'rent', 'pg', 'commercial', 'plot'].includes(typeParam)
      ? (typeParam as ListingType)
      : 'all';

  const commercialParam = sp.get('commercialType');
  const commercialDealType: CommercialListingType | 'all' =
    commercialParam === 'rent' || commercialParam === 'sale' ? commercialParam : 'all';

  const bhkParam = sp.get('bhk');
  const bhk: number[] = [];
  if (bhkParam) {
    const n = parseInt(bhkParam, 10);
    if (!Number.isNaN(n)) bhk.push(n);
  }

  const minSizeN = parseInt(sp.get('minSize') || '', 10);
  const maxSizeN = parseInt(sp.get('maxSize') || '', 10);
  const minPriceN = parseInt(sp.get('minPrice') || '', 10);
  const maxPriceN = parseInt(sp.get('maxPrice') || '', 10);

  const sortParam = sp.get('sort');
  const sortBy: SortKey =
    sortParam && ['recommended', 'price_asc', 'price_desc', 'area_desc', 'newest'].includes(sortParam)
      ? (sortParam as SortKey)
      : 'recommended';

  return {
    city: sp.get('city') || 'All',
    listingType,
    commercialDealType,
    category: sp.get('category') || 'All',
    bhk,
    minSize: !Number.isNaN(minSizeN) && minSizeN >= MIN_SIZE_SQFT ? minSizeN : MIN_SIZE_SQFT,
    maxSize: !Number.isNaN(maxSizeN) && maxSizeN > 0 ? maxSizeN : 0,
    minPrice: !Number.isNaN(minPriceN) && minPriceN > 0 ? minPriceN : 0,
    maxPrice: !Number.isNaN(maxPriceN) && maxPriceN > 0 ? maxPriceN : DEFAULT_MAX_PRICE,
    verifiedOnly: sp.get('verified') === 'true' || sp.get('isVerified') === 'true',
    ownerOnly: sp.get('owner') === 'true' || sp.get('isOwner') === 'true',
    reraOnly: sp.get('rera') === 'true' || sp.get('reraApproved') === 'true',
    furnishing: sp.get('furnishing') || 'All',
    constructionStatus: sp.get('construction') || 'All',
    searchQuery: sp.get('q') || sp.get('locality') || sp.get('search') || '',
    sortBy,
  };
}

/**
 * Inverse of parseFiltersFromParams: serialize a filter state back to URL params
 * (only non-default values, so shared links stay short and `parse` round-trips).
 * Radius/map params (lat/lng/radius) are NOT handled here — the map page owns those.
 */
export function filtersToParams(f: PropertyFilterState): URLSearchParams {
  const q = new URLSearchParams();
  const isCommercial = f.listingType === 'commercial';
  if (f.city && f.city !== 'All') q.set('city', f.city);
  if (f.listingType !== 'all') q.set('listingType', f.listingType);
  if (isCommercial && f.commercialDealType !== 'all') q.set('commercialType', f.commercialDealType);
  if (f.category && f.category !== 'All') q.set('category', f.category);
  if (!isCommercial && f.bhk.length > 0) q.set('bhk', String(f.bhk[0]));
  if (isCommercial && f.minSize > MIN_SIZE_SQFT) q.set('minSize', String(f.minSize));
  if (isCommercial && f.maxSize > 0) q.set('maxSize', String(f.maxSize));
  if (f.minPrice > 0) q.set('minPrice', String(f.minPrice));
  if (f.maxPrice > 0 && f.maxPrice < DEFAULT_MAX_PRICE) q.set('maxPrice', String(f.maxPrice));
  if (f.verifiedOnly) q.set('verified', 'true');
  if (f.ownerOnly) q.set('owner', 'true');
  if (f.reraOnly) q.set('rera', 'true');
  if (f.furnishing && f.furnishing !== 'All') q.set('furnishing', f.furnishing);
  if (f.constructionStatus && f.constructionStatus !== 'All') q.set('construction', f.constructionStatus);
  if (f.searchQuery.trim()) q.set('q', f.searchQuery.trim());
  if (f.sortBy !== 'recommended') q.set('sort', f.sortBy);
  return q;
}

/** Does a property satisfy every active filter? */
export function matchesFilters(p: Property, f: PropertyFilterState): boolean {
  const isCommercial = f.listingType === 'commercial';

  if (f.city !== 'All' && p.city.toLowerCase() !== f.city.toLowerCase()) return false;
  if (f.listingType !== 'all' && p.listingType !== f.listingType) return false;
  if (isCommercial && f.commercialDealType !== 'all' && p.commercialListingType !== f.commercialDealType) return false;
  if (f.category !== 'All' && p.category.toLowerCase() !== f.category.toLowerCase()) return false;

  if (isCommercial) {
    const size = p.carpetAreaSqFt || 0;
    if (size < f.minSize) return false;
    if (f.maxSize > 0 && size > f.maxSize) return false;
  }

  if (!isCommercial && f.bhk.length > 0 && p.bhk && !f.bhk.includes(p.bhk)) return false;

  if (p.price < f.minPrice || p.price > f.maxPrice) return false;

  if (f.verifiedOnly && !p.isVerified) return false;
  if (f.ownerOnly && !(p.postedBy.type === 'Owner' || p.isExclusiveOwner)) return false;
  if (f.reraOnly && !p.reraApproved) return false;
  if (f.furnishing !== 'All' && p.furnishing !== f.furnishing) return false;
  if (f.constructionStatus !== 'All' && p.constructionStatus !== f.constructionStatus) return false;

  if (f.searchQuery && f.searchQuery.trim()) {
    const q = f.searchQuery.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    const fullText = [
      p.title,
      p.locality,
      p.subLocality,
      p.city,
      p.category,
      p.tagline,
      p.description,
      p.postedBy.companyName,
      p.postedBy.name,
    ]
      .map((s) => (s || '').toLowerCase())
      .join(' ');
    if (!fullText.includes(q) && !words.every((w) => fullText.includes(w))) return false;
  }

  return true;
}

export function sortProperties(list: Property[], sortBy: SortKey): Property[] {
  return [...list].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'area_desc') return (b.carpetAreaSqFt || 0) - (a.carpetAreaSqFt || 0);
    if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return 0;
  });
}

/** Count of non-default active filters (for a badge). */
export function countActiveFilters(f: PropertyFilterState): number {
  const isCommercial = f.listingType === 'commercial';
  let c = 0;
  if (f.city !== 'All') c++;
  if (f.category !== 'All') c++;
  if (f.listingType !== 'all') c++;
  if (isCommercial && f.commercialDealType !== 'all') c++;
  if (isCommercial && (f.minSize > MIN_SIZE_SQFT || f.maxSize > 0)) c++;
  if (!isCommercial) c += f.bhk.length;
  if (f.verifiedOnly) c++;
  if (f.ownerOnly) c++;
  if (f.reraOnly) c++;
  if (f.furnishing !== 'All') c++;
  if (f.constructionStatus !== 'All') c++;
  if (f.minPrice > 0 || f.maxPrice < DEFAULT_MAX_PRICE) c++;
  if (f.searchQuery.trim()) c++;
  return c;
}
