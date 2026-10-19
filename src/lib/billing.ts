import 'server-only';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { CITIES_DATA } from '@/lib/realEstateData';

// ---------------------------------------------------------------------------
// Listing packs & city-based pricing
// ---------------------------------------------------------------------------
//
// Pricing comes from the "Price Listing" sheet: a listing is sold in PACKS
// (a fixed quantity + validity), and the price of a pack depends on the CITY
// it is bought for. Quota is city-scoped — a pack bought for Mumbai only lets
// the seller post Mumbai listings (the one free listing is global).

// Free listings every new account gets before a paid pack is required.
export const FREE_LISTINGS = 1;

export type PackId =
  | 'silver_100'
  | 'silver_200'
  | 'silver_250'
  | 'silver_350'
  | 'silver_400'
  | 'silver_600'
  | 'silver_800'
  | 'silver_1000';

// Price columns from the sheet. NCR sub-cities (Noida, Gurgaon, Ghaziabad, …)
// all share one price, so they collapse into `delhiNcr`. `other` is the single
// catch-all tier for any city NOT named individually in the sheet (it carries
// the sheet's "Cat 2" prices — "Cat 3" is no longer used). Pune is not in the
// sheet, so it has no dedicated column and bills at `other`.
export type PriceColumn =
  | 'mumbai'
  | 'bangalore'
  | 'delhiNcr'
  | 'hyderabad'
  | 'chennai'
  | 'naviMumbai'
  | 'thane'
  | 'kolkata'
  | 'ahmedabad'
  | 'other';

export interface ListingPack {
  id: PackId;
  name: string;
  /** Number of listings the pack grants. */
  listings: number;
  /** Validity in days from activation. */
  durationDays: number;
  tagline: string;
}

export const LISTING_PACKS: ListingPack[] = [
  { id: 'silver_100', name: '100 Silver Listings', listings: 100, durationDays: 90, tagline: 'Entry pack for individual owners' },
  { id: 'silver_200', name: '200 Silver Listings', listings: 200, durationDays: 90, tagline: 'For active owners & small agents' },
  { id: 'silver_250', name: '250 Silver Listings', listings: 250, durationDays: 180, tagline: 'Six months of steady posting' },
  { id: 'silver_350', name: '350 Silver Listings', listings: 350, durationDays: 180, tagline: 'Popular with growing agencies' },
  { id: 'silver_400', name: '400 Silver Listings', listings: 400, durationDays: 365, tagline: 'A full year of listings' },
  { id: 'silver_600', name: '600 Silver Listings', listings: 600, durationDays: 365, tagline: 'Best value for busy agents' },
  { id: 'silver_800', name: '800 Silver Listings', listings: 800, durationDays: 365, tagline: 'High-volume agencies & builders' },
  { id: 'silver_1000', name: '1000 Silver Listings', listings: 1000, durationDays: 365, tagline: 'Maximum reach for large teams' },
];

const PACKS_BY_ID: Record<PackId, ListingPack> = Object.fromEntries(
  LISTING_PACKS.map((p) => [p.id, p]),
) as Record<PackId, ListingPack>;

export function getPack(packId: string): ListingPack | null {
  return PACKS_BY_ID[packId as PackId] ?? null;
}

// Prices in rupees, taken verbatim from the sheet (incl. the rows where
// Hyderabad / Navi Mumbai diverge from their usual band — nothing is tiered
// away, the full matrix is stored). Navi Mumbai / Thane have their own columns
// but are not yet app cities, so they stay dormant until added. `other` carries
// the sheet's "Cat 2" values and is the price for every city not named above
// (Pune, Lucknow, …); the sheet's "Cat 3" column is intentionally unused.
export const CITY_PRICE_MATRIX: Record<PackId, Record<PriceColumn, number>> = {
  silver_100:  { mumbai: 10000, bangalore: 10000, delhiNcr: 8000,  hyderabad: 10000, chennai: 8000,  naviMumbai: 7500,  thane: 7500,  kolkata: 5000,  ahmedabad: 5000,  other: 4000 },
  silver_200:  { mumbai: 16000, bangalore: 16000, delhiNcr: 12000, hyderabad: 16000, chennai: 12000, naviMumbai: 10500, thane: 10500, kolkata: 8000,  ahmedabad: 8000,  other: 6500 },
  silver_250:  { mumbai: 20000, bangalore: 20000, delhiNcr: 14000, hyderabad: 20000, chennai: 14000, naviMumbai: 14000, thane: 14000, kolkata: 10000, ahmedabad: 10000, other: 8000 },
  silver_350:  { mumbai: 28500, bangalore: 28500, delhiNcr: 20000, hyderabad: 20000, chennai: 20000, naviMumbai: 20000, thane: 20000, kolkata: 15000, ahmedabad: 15000, other: 10500 },
  silver_400:  { mumbai: 35000, bangalore: 35000, delhiNcr: 25000, hyderabad: 35000, chennai: 25000, naviMumbai: 25000, thane: 25000, kolkata: 18000, ahmedabad: 18000, other: 13500 },
  silver_600:  { mumbai: 45000, bangalore: 45000, delhiNcr: 33000, hyderabad: 45000, chennai: 33000, naviMumbai: 30000, thane: 30000, kolkata: 25000, ahmedabad: 25000, other: 18000 },
  silver_800:  { mumbai: 65000, bangalore: 65000, delhiNcr: 60000, hyderabad: 65000, chennai: 60000, naviMumbai: 42500, thane: 42500, kolkata: 34000, ahmedabad: 34000, other: 25000 },
  silver_1000: { mumbai: 75000, bangalore: 75000, delhiNcr: 70000, hyderabad: 70000, chennai: 70000, naviMumbai: 50000, thane: 50000, kolkata: 40000, ahmedabad: 40000, other: 34000 },
};

// Maps each app city (CITIES_DATA names) to its price column. Only cities named
// individually in the sheet appear here; everything else (Pune, Lucknow, any
// future city) is billed at the `other` tier via columnForCity.
export const CITY_TO_COLUMN: Record<string, PriceColumn> = {
  'Mumbai': 'mumbai',
  'Bangalore': 'bangalore',
  'New Delhi': 'delhiNcr',
  'Noida': 'delhiNcr',
  'Gurgaon': 'delhiNcr',
  'Hyderabad': 'hyderabad',
  'Chennai': 'chennai',
  'Kolkata': 'kolkata',
  'Ahmedabad': 'ahmedabad',
};

/** Label for the catch-all purchase option covering every city not named in the
 *  sheet (Pune, Lucknow, …). Packs are bought and quota is tracked under this
 *  single key, so one "Other" pack covers all such cities. */
export const OTHER_CITY_LABEL = 'Other';

/** The options a pack can be purchased for: each sheet-named city individually,
 *  plus one "Other" bucket for everything else. Shown in the dashboard's city
 *  selector. */
export const SELLABLE_CITIES: string[] = [...Object.keys(CITY_TO_COLUMN), OTHER_CITY_LABEL];

export function columnForCity(city: string): PriceColumn {
  return CITY_TO_COLUMN[city] ?? 'other';
}

/**
 * The key a city's listing quota is tracked under. Sheet-named cities use their
 * own name; every other app city (Pune, Lucknow, …) collapses to the single
 * `OTHER_CITY_LABEL` bucket — so a pack bought for "Other" gates listings in any
 * such city, matching how they are priced. Keep purchase + posting + dashboard
 * all keyed through this so quota lines up with pricing.
 */
export function billingKeyForCity(city: string): string {
  return CITY_TO_COLUMN[city] ? city : OTHER_CITY_LABEL;
}

export interface ResolvedPrice {
  packId: PackId;
  city: string;
  column: PriceColumn;
  /** Price in rupees (display). */
  rupees: number;
  /** Price in paise (Razorpay charge amount). */
  amount: number;
}

/** Resolves the price of a pack for a given city, or null if either is unknown. */
export function resolvePrice(packId: string, city: string): ResolvedPrice | null {
  const pack = getPack(packId);
  if (!pack || !city) return null;
  const column = columnForCity(city);
  const rupees = CITY_PRICE_MATRIX[pack.id][column];
  if (rupees == null) return null;
  return { packId: pack.id, city, column, rupees, amount: rupees * 100 };
}

// ---------------------------------------------------------------------------
// Entitlement (city-scoped)
// ---------------------------------------------------------------------------

export interface ActivePack {
  id: string;
  packId: string;
  packName: string;
  /** City the pack was bought for; its quota only applies to this city. */
  city: string | null;
  listingsQuota: number;
  listingsUsed: number;
  remaining: number;
  expiresAt: string | null;
  activatedAt: string | null;
}

export interface Entitlement {
  isAdmin: boolean;
  unlimited: boolean;
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
  /** Total listings remaining across the free tier + all active packs. Quota is
   *  city-scoped, so this is informational — use remainingForCity to gate a post. */
  totalRemaining: number;
  /** True if the user may create at least one more listing in some city. */
  canCreate: boolean;
  activePacks: ActivePack[];
}

/**
 * Computes the current listing entitlement for a user. Admins are unlimited and
 * never consume quota. Everyone else gets FREE_LISTINGS free (usable in any
 * city), then must hold an active (non-expired) pack bought for the city they
 * post in. Active packs stack per city.
 */
export async function getEntitlement(userId: string, role: string): Promise<Entitlement> {
  const isAdmin = role === 'admin';
  if (isAdmin) {
    return {
      isAdmin: true,
      unlimited: true,
      freeLimit: FREE_LISTINGS,
      freeUsed: 0,
      freeRemaining: Infinity,
      totalRemaining: Infinity,
      canCreate: true,
      activePacks: [],
    };
  }

  const now = new Date();
  const [user, packs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { freeListingsUsed: true } }),
    prisma.subscription.findMany({
      where: { userId, status: 'active', expiresAt: { gt: now } },
      orderBy: { activatedAt: 'asc' },
    }),
  ]);

  const freeUsed = user?.freeListingsUsed ?? 0;
  const freeRemaining = Math.max(0, FREE_LISTINGS - freeUsed);

  const activePacks: ActivePack[] = packs.map((p) => ({
    id: p.id,
    packId: p.planId,
    packName: getPack(p.planId)?.name ?? p.planId,
    city: p.city ?? null,
    listingsQuota: p.listingsQuota,
    listingsUsed: p.listingsUsed,
    remaining: Math.max(0, p.listingsQuota - p.listingsUsed),
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    activatedAt: p.activatedAt ? p.activatedAt.toISOString() : null,
  }));

  const packRemaining = activePacks.reduce((sum, p) => sum + p.remaining, 0);
  const totalRemaining = freeRemaining + packRemaining;

  return {
    isAdmin: false,
    unlimited: false,
    freeLimit: FREE_LISTINGS,
    freeUsed,
    freeRemaining,
    totalRemaining,
    canCreate: totalRemaining > 0,
    activePacks,
  };
}

/** Listings the user can still post in a given city: the global free tier plus
 *  any active pack bought for that exact city. */
export function remainingForCity(ent: Entitlement, city: string): number {
  if (ent.unlimited) return Infinity;
  const packRemaining = ent.activePacks
    .filter((p) => p.city === city)
    .reduce((sum, p) => sum + p.remaining, 0);
  return ent.freeRemaining + packRemaining;
}

/** True if the user may post at least one more listing in the given city. */
export function canCreateInCity(ent: Entitlement, city: string): boolean {
  return ent.unlimited || remainingForCity(ent, city) > 0;
}

/**
 * Consumes exactly one listing credit for a city inside an existing transaction.
 * Draws from the free tier first (global), then from the oldest active pack
 * bought for that city with remaining quota. Returns the source used, or null if
 * no credit was available (caller should have checked canCreateInCity first;
 * this is the atomic guard against races). Admins should never call this.
 */
export async function consumeListingCredit(
  tx: Prisma.TransactionClient,
  userId: string,
  city: string,
): Promise<{ source: 'free' | 'pack'; packId?: string } | null> {
  const now = new Date();

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { freeListingsUsed: true },
  });

  if (user && user.freeListingsUsed < FREE_LISTINGS) {
    await tx.user.update({
      where: { id: userId },
      data: { freeListingsUsed: { increment: 1 } },
    });
    return { source: 'free' };
  }

  // Oldest active pack bought for THIS city that still has quota.
  const pack = await tx.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      city,
      expiresAt: { gt: now },
      listingsUsed: { lt: prisma.subscription.fields.listingsQuota },
    },
    orderBy: { activatedAt: 'asc' },
  });

  if (pack) {
    await tx.subscription.update({
      where: { id: pack.id },
      data: { listingsUsed: { increment: 1 } },
    });
    return { source: 'pack', packId: pack.id };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Razorpay
// ---------------------------------------------------------------------------

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Dev bypass lets the full plan/quota flow be tested without real Razorpay keys.
 * Only active outside production AND only when keys are absent.
 */
export function devBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && !razorpayConfigured();
}

/** Creates a Razorpay order via the REST API (no SDK dependency). */
export async function createRazorpayOrder(params: {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID!;
  const keySecret = process.env.RAZORPAY_KEY_SECRET!;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Razorpay order failed (${res.status}): ${text}`);
  }
  return res.json();
}

/** Verifies the Razorpay payment signature (HMAC-SHA256 of "orderId|paymentId"). */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');
  // timing-safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
