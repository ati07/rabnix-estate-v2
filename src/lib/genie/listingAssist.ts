import type { GenieListingDraft } from './listingDraft';

/**
 * Client-side helpers for the in-form Genie assists on the post-property /
 * dashboard-upload flows. They call the shared /api/gemini/advisor endpoint and
 * return typed results; they never write to the DB (the user still reviews,
 * adds photos and submits through the normal, gated flow).
 */

const ENDPOINT = '/api/gemini/advisor';

async function postAdvisor(action: string, payload: unknown): Promise<any> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || 'Genie could not help right now. Please try again.');
  }
  return data;
}

/** Option 1: free-text description → partial listing draft to prefill the form. */
export async function extractListingFromText(text: string): Promise<Partial<GenieListingDraft>> {
  const data = await postAdvisor('extract_listing', { text });
  return (data.draft || {}) as Partial<GenieListingDraft>;
}

export interface ListingCopySpecs {
  listingType?: string;
  commercialListingType?: string;
  category?: string;
  city?: string;
  locality?: string;
  subLocality?: string;
  bhk?: number;
  bathrooms?: number;
  carpetAreaSqFt?: number;
  furnishing?: string;
  constructionStatus?: string;
  amenities?: string[];
  price?: number;
}

/** Option 3: generate a title + description from the specs already entered. */
export async function generateListingCopy(specs: ListingCopySpecs): Promise<{ title: string; description: string }> {
  const data = await postAdvisor('listing_copy', { specs });
  return { title: (data.title || '').toString(), description: (data.description || '').toString() };
}

export interface PriceEstimate {
  /** Suggested value to drop into the price field (INR; monthly for rent/pg). */
  suggestedPrice: number;
  min: number;
  max: number;
  isMonthly: boolean;
  summary: string;
}

/**
 * Option 3: estimate a fair price by reusing the existing valuation action.
 * For sale listings we suggest the fair-value midpoint; for rent/pg the monthly
 * rental midpoint. Callers should present this as an editable estimate, not a
 * fixed figure.
 */
export async function estimateListingPrice(input: {
  city: string;
  locality: string;
  category: string;
  areaSqFt: number;
  bhk: number;
  furnishing: string;
  isMonthly: boolean;
}): Promise<PriceEstimate> {
  const data = await postAdvisor('valuation', {
    city: input.city,
    locality: input.locality,
    category: input.category,
    areaSqFt: input.areaSqFt,
    bhk: input.bhk,
    furnishing: input.furnishing,
  });
  const d = data.data || {};
  const round = (n: unknown) => (typeof n === 'number' && isFinite(n) ? Math.round(n) : 0);

  if (input.isMonthly) {
    const min = round(d.estimatedRentalMin);
    const max = round(d.estimatedRentalMax);
    const mid = Math.round(((min || 0) + (max || 0)) / 2) || min || max || 0;
    return { suggestedPrice: mid, min: min || mid, max: max || mid, isMonthly: true, summary: (d.summary || '').toString() };
  }

  const min = round(d.estimatedPriceMin);
  const max = round(d.estimatedPriceMax);
  const mid = round(d.fairValueEstimate) || Math.round(((min || 0) + (max || 0)) / 2) || min || max || 0;
  return { suggestedPrice: mid, min: min || mid, max: max || mid, isMonthly: false, summary: (d.summary || '').toString() };
}

/** Format an INR amount the same way the post-property form does, for notes. */
export function formatInr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lakh`;
  return `₹${amount.toLocaleString('en-IN')}`;
}
