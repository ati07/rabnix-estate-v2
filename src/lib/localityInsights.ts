// Real locality-level market intelligence computed from our own inventory —
// no fabricated numbers. Every figure here is an aggregate of actual approved
// listings, so a locality only appears once we have enough real data to be
// honest about it.

export interface LocalityInsight {
  locality: string;
  totalListings: number;
  forSale: number;
  forRent: number;
  /** Median asking price per sq.ft. for sale listings (₹), when derivable. */
  salePricePerSqFt: number | null;
  /** Median monthly rent across rent listings (₹), when available. */
  medianRent: number | null;
  /**
   * Estimated gross rental yield (% per year), only when we have both a median
   * rent-per-sqft and a median sale-price-per-sqft in the same locality:
   *   (median rent/sqft × 12) ÷ (median sale price/sqft) × 100
   */
  rentalYieldPct: number | null;
  /** BHK configurations actually listed here, ascending. */
  bhkMix: number[];
}

// A locality needs at least this many approved listings before we surface it —
// below this the medians are noise and we'd be pretending to have intelligence.
export const MIN_LISTINGS_FOR_INSIGHT = 3;

// A single sample is not a median. Each metric needs its own minimum number of
// comparable listings before we report it — otherwise one mislabeled or outlier
// listing (e.g. a sale price typed into a "rent" listing) would headline a
// nonsense figure.
export const MIN_SAMPLES_PER_METRIC = 2;

// Plausibility bounds for gross rental yield (% / yr). Real Indian residential
// and commercial gross yields sit well inside this band; anything outside is a
// data-entry error (a sale price on a rent listing, or vice-versa), so we
// withhold rather than publish an obviously-wrong number.
const MIN_PLAUSIBLE_YIELD = 1;
const MAX_PLAUSIBLE_YIELD = 12;

export interface InsightInput {
  locality: string;
  listingType: string; // buy | rent | pg | plot | commercial
  commercialListingType: string | null;
  price: number;
  pricePerSqFt: number | null;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt: number | null;
  bhk: number | null;
}

function median(values: number[]): number | null {
  const nums = values.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? Math.round((nums[mid - 1] + nums[mid]) / 2) : nums[mid];
}

function effectiveArea(row: InsightInput): number {
  return row.superBuiltUpAreaSqFt && row.superBuiltUpAreaSqFt > 0
    ? row.superBuiltUpAreaSqFt
    : row.carpetAreaSqFt;
}

/** True for listings that represent a purchase (vs. a rental). */
function isSale(row: InsightInput): boolean {
  if (row.listingType === 'rent' || row.listingType === 'pg') return false;
  if (row.listingType === 'commercial') return row.commercialListingType !== 'rent';
  return true; // buy | plot | commercial-sale
}

/**
 * Collapse a flat list of listings into per-locality insight cards, keeping only
 * localities with enough real listings and sorting by inventory depth.
 */
export function computeLocalityInsights(rows: InsightInput[], limit = 8): LocalityInsight[] {
  const byLocality = new Map<string, InsightInput[]>();
  for (const row of rows) {
    const key = row.locality?.trim();
    if (!key) continue;
    (byLocality.get(key) ?? byLocality.set(key, []).get(key)!).push(row);
  }

  const insights: LocalityInsight[] = [];
  for (const [locality, listings] of byLocality) {
    if (listings.length < MIN_LISTINGS_FOR_INSIGHT) continue;

    const saleRows = listings.filter(isSale);
    const rentRows = listings.filter((r) => r.listingType === 'rent' || r.listingType === 'pg');

    const salePerSqFt = saleRows
      .map((r) => {
        if (r.pricePerSqFt && r.pricePerSqFt > 0) return r.pricePerSqFt;
        const area = effectiveArea(r);
        return area > 0 ? r.price / area : NaN;
      })
      .filter((n) => Number.isFinite(n)) as number[];

    const rents = rentRows.map((r) => r.price);
    const rentPerSqFt = rentRows
      .map((r) => {
        const area = effectiveArea(r);
        return area > 0 ? r.price / area : NaN;
      })
      .filter((n) => Number.isFinite(n)) as number[];

    // Only trust a median once it rests on enough comparable listings.
    const medianSalePerSqFt = salePerSqFt.length >= MIN_SAMPLES_PER_METRIC ? median(salePerSqFt) : null;
    const medianRent = rents.length >= MIN_SAMPLES_PER_METRIC ? median(rents) : null;
    const medianRentPerSqFt = rentPerSqFt.length >= MIN_SAMPLES_PER_METRIC ? median(rentPerSqFt) : null;

    let rentalYieldPct: number | null = null;
    if (medianSalePerSqFt && medianRentPerSqFt) {
      const yieldPct = Math.round(((medianRentPerSqFt * 12) / medianSalePerSqFt) * 1000) / 10;
      if (yieldPct >= MIN_PLAUSIBLE_YIELD && yieldPct <= MAX_PLAUSIBLE_YIELD) rentalYieldPct = yieldPct;
    }

    const bhkMix = [...new Set(listings.map((r) => r.bhk).filter((b): b is number => !!b && b > 0))].sort(
      (a, b) => a - b,
    );

    insights.push({
      locality,
      totalListings: listings.length,
      forSale: saleRows.length,
      forRent: rentRows.length,
      salePricePerSqFt: medianSalePerSqFt,
      medianRent,
      rentalYieldPct,
      bhkMix,
    });
  }

  return insights.sort((a, b) => b.totalListings - a.totalListings).slice(0, limit);
}
