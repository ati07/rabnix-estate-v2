import { Type } from '@google/genai';
import { prisma } from '@/lib/prisma';

/**
 * Tier-1 "site-aware" Genie: let the AI advisor search BayBayt's OWN live
 * inventory instead of inventing listings. This module exposes a Gemini
 * function declaration + the server-side executor that backs it.
 *
 * Safety rules enforced here (not left to the model):
 *   - Only APPROVED listings are ever returned (public scope).
 *   - Owner/agent phone numbers are NEVER included — contact stays behind the
 *     gated OTP reveal (POST /api/properties/[id]/contact).
 */

export interface GeniePropertyCard {
  id: string;
  title: string;
  priceFormatted: string;
  pricePerSqFt?: number;
  listingType: string;
  category: string;
  bhk?: number;
  carpetAreaSqFt?: number;
  furnishing: string;
  constructionStatus: string;
  city: string;
  locality: string;
  subLocality?: string;
  isExclusiveOwner: boolean;
  image?: string;
}

/** The tool Gemini can call to query real inventory. */
export const searchPropertiesDeclaration = {
  name: 'search_properties',
  description:
    "Search BayBayt's live, verified property listings. Call this whenever the " +
    'user wants to find, show, browse, compare, or count actual properties/flats/' +
    'homes/plots/offices on BayBayt (e.g. "show me 2BHKs under 80 lakh in ' +
    'Whitefield", "any owner-direct villas in Pune?"). Do NOT invent listings — ' +
    'always use this tool for inventory questions. Returns matching listings (may ' +
    'be empty).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description: 'City name, e.g. "Bangalore", "Mumbai", "Pune".',
      },
      locality: {
        type: Type.STRING,
        description: 'Locality / sub-locality / area, e.g. "Whitefield", "Gachibowli".',
      },
      listingType: {
        type: Type.STRING,
        enum: ['buy', 'rent', 'pg', 'plot', 'commercial'],
        description: 'buy = for sale residential; rent; pg = PG/co-living; plot = land; commercial.',
      },
      category: {
        type: Type.STRING,
        enum: [
          'Apartment',
          'Villa',
          'Builder Floor',
          'Penthouse',
          'Studio',
          'Commercial Office',
          'Retail Shop',
          'Warehouse',
          'Commercial Land',
          'Residential Plot',
          'PG / Co-Living',
        ],
        description: 'Property category.',
      },
      bhkMin: { type: Type.NUMBER, description: 'Minimum bedrooms (BHK).' },
      bhkMax: { type: Type.NUMBER, description: 'Maximum bedrooms (BHK).' },
      priceMin: { type: Type.NUMBER, description: 'Minimum price in absolute INR (e.g. 8000000 for 80 lakh).' },
      priceMax: { type: Type.NUMBER, description: 'Maximum price in absolute INR (e.g. 15000000 for 1.5 crore).' },
      furnishing: {
        type: Type.STRING,
        enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'],
        description: 'Furnishing status.',
      },
      constructionStatus: {
        type: Type.STRING,
        enum: ['Ready to Move', 'Under Construction', 'New Launch'],
        description: 'Construction status.',
      },
      ownerDirect: {
        type: Type.BOOLEAN,
        description: 'If true, only owner-direct (no-broker) listings.',
      },
      limit: {
        type: Type.NUMBER,
        description: 'Max listings to return (default 6, hard cap 10).',
      },
    },
  },
} as const;

export interface PropertySearchArgs {
  city?: string;
  locality?: string;
  listingType?: string;
  category?: string;
  bhkMin?: number;
  bhkMax?: number;
  priceMin?: number;
  priceMax?: number;
  furnishing?: string;
  constructionStatus?: string;
  ownerDirect?: boolean;
  limit?: number;
}

/**
 * Execute a property search against the DB. Returns compact cards plus a total
 * match count (so the model can say "showing 6 of 23"). Approved-only; no phones.
 */
export async function runPropertySearch(
  args: PropertySearchArgs,
): Promise<{ count: number; results: GeniePropertyCard[] }> {
  const take = Math.min(Math.max(Math.round(args.limit ?? 6), 1), 10);

  const where: any = { verificationStatus: 'approved' };

  if (args.city) where.city = { equals: args.city, mode: 'insensitive' };
  if (args.locality) {
    where.OR = [
      { locality: { contains: args.locality, mode: 'insensitive' } },
      { subLocality: { contains: args.locality, mode: 'insensitive' } },
    ];
  }
  if (args.listingType) where.listingType = args.listingType;
  if (args.category) where.category = args.category;
  if (args.furnishing) where.furnishing = args.furnishing;
  if (args.constructionStatus) where.constructionStatus = args.constructionStatus;
  if (args.ownerDirect) where.isExclusiveOwner = true;

  if (args.bhkMin != null || args.bhkMax != null) {
    where.bhk = {};
    if (args.bhkMin != null) where.bhk.gte = args.bhkMin;
    if (args.bhkMax != null) where.bhk.lte = args.bhkMax;
  }
  if (args.priceMin != null || args.priceMax != null) {
    where.price = {};
    if (args.priceMin != null) where.price.gte = args.priceMin;
    if (args.priceMax != null) where.price.lte = args.priceMax;
  }

  const [count, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({ where, orderBy: { createdAt: 'desc' }, take }),
  ]);

  const results: GeniePropertyCard[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    priceFormatted: p.priceFormatted,
    pricePerSqFt: p.pricePerSqFt ?? undefined,
    listingType: p.listingType,
    category: p.category,
    bhk: p.bhk ?? undefined,
    carpetAreaSqFt: p.carpetAreaSqFt ?? undefined,
    furnishing: p.furnishing,
    constructionStatus: p.constructionStatus,
    city: p.city,
    locality: p.locality,
    subLocality: p.subLocality ?? undefined,
    isExclusiveOwner: p.isExclusiveOwner,
    image: p.images?.[0],
  }));

  return { count, results };
}
