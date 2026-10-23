import { Type } from '@google/genai';
import { prisma } from '@/lib/prisma';

/**
 * Tier-3 Genie tool: DB-grounded market insights. Aggregates BayBayt's OWN
 * approved inventory for a city/locality so the advisor can answer price,
 * rental-yield, buy-vs-rent and area-comparison questions with REAL numbers
 * instead of hallucinated ones. Returns nulls where there isn't enough data —
 * the model is told never to fabricate around that.
 */

export const marketInsightsDeclaration = {
  name: 'market_insights',
  description:
    "Get real market statistics computed from BayBayt's live listings for a city " +
    '(optionally a locality/category): sample size, average price per sq.ft, price ' +
    'range, BHK mix, average monthly rent, and estimated gross rental yield when both ' +
    'sale and rent listings exist. Call this for pricing, rental-yield, buy-vs-rent, or ' +
    'area-comparison questions (call once per area to compare). Never invent these ' +
    'numbers yourself — if a field is null, there is not enough inventory to say.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: { type: Type.STRING, description: 'City to analyse (required).' },
      locality: { type: Type.STRING, description: 'Optional locality / area to narrow the stats.' },
      category: {
        type: Type.STRING,
        enum: [
          'Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Studio',
          'Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land', 'Residential Plot',
        ],
        description: 'Optional property category to narrow the stats.',
      },
    },
    required: ['city'],
  },
} as const;

export interface MarketInsightsArgs {
  city: string;
  locality?: string;
  category?: string;
}

function avg(nums: number[]): number | null {
  const valid = nums.filter((n) => typeof n === 'number' && isFinite(n) && n > 0);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

export async function runMarketInsights(args: MarketInsightsArgs) {
  const where: any = { verificationStatus: 'approved' };
  if (args.city) where.city = { equals: args.city, mode: 'insensitive' };
  if (args.category) where.category = args.category;
  if (args.locality) {
    where.OR = [
      { locality: { contains: args.locality, mode: 'insensitive' } },
      { subLocality: { contains: args.locality, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.property.findMany({
    where,
    select: {
      listingType: true,
      price: true,
      pricePerSqFt: true,
      carpetAreaSqFt: true,
      bhk: true,
    },
  });

  const area = [args.locality, args.city].filter(Boolean).join(', ');

  if (rows.length === 0) {
    return {
      area,
      category: args.category ?? null,
      totalListings: 0,
      sale: null,
      rent: null,
      estimatedGrossRentalYieldPercent: null,
      note: `No approved listings found for ${area}${args.category ? ` (${args.category})` : ''}. Not enough data to give market stats.`,
    };
  }

  const saleRows = rows.filter((r) => r.listingType === 'buy' || r.listingType === 'plot' || r.listingType === 'commercial');
  const rentRows = rows.filter((r) => r.listingType === 'rent' || r.listingType === 'pg');

  // Sale side
  const salePrices = saleRows.map((r) => r.price).filter((p) => p > 0);
  const avgSalePricePerSqFt = avg(
    saleRows.map((r) => r.pricePerSqFt ?? (r.carpetAreaSqFt ? r.price / r.carpetAreaSqFt : 0)),
  );
  const bhkMix: Record<string, number> = {};
  for (const r of saleRows) {
    if (r.bhk) {
      const key = `${r.bhk}BHK`;
      bhkMix[key] = (bhkMix[key] || 0) + 1;
    }
  }

  const sale = saleRows.length
    ? {
        count: saleRows.length,
        avgPricePerSqFt: avgSalePricePerSqFt,
        minPrice: salePrices.length ? Math.min(...salePrices) : null,
        maxPrice: salePrices.length ? Math.max(...salePrices) : null,
        avgCarpetAreaSqFt: avg(saleRows.map((r) => r.carpetAreaSqFt)),
        bhkMix,
      }
    : null;

  // Rent side (monthly)
  const avgMonthlyRent = avg(rentRows.map((r) => r.price));
  const avgRentPerSqFt = avg(
    rentRows.map((r) => (r.carpetAreaSqFt ? r.price / r.carpetAreaSqFt : 0)),
  );
  const rent = rentRows.length
    ? { count: rentRows.length, avgMonthlyRent, avgRentPerSqFt }
    : null;

  // Gross rental yield only when both sides have a per-sqft figure.
  let estimatedGrossRentalYieldPercent: number | null = null;
  if (avgSalePricePerSqFt && avgRentPerSqFt) {
    estimatedGrossRentalYieldPercent =
      Math.round(((avgRentPerSqFt * 12) / avgSalePricePerSqFt) * 1000) / 10;
  }

  return {
    area,
    category: args.category ?? null,
    totalListings: rows.length,
    sale,
    rent,
    estimatedGrossRentalYieldPercent,
    note:
      'Stats are computed from BayBayt listings only and are indicative — a small sample ' +
      'can skew averages. Rental yield is gross (before costs/taxes).',
  };
}
