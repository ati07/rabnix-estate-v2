import 'server-only';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Prisma, Subscription } from '@prisma/client';
import { CITIES_DATA } from '@/lib/realEstateData';
import { isAdminRole } from '@/lib/roles';

// ---------------------------------------------------------------------------
// Listing packs & pricing
// ---------------------------------------------------------------------------
//
// ACTIVE model (Nov 2026): listings are sold in two FLAT packs at one price
// nationwide — the buyer does not choose a city. Quota is GLOBAL: a pack's
// listings can be used to post in any city (the one free listing is global too).
//
// The earlier city-scoped matrix pricing (price = pack × city, quota scoped to
// the purchased city) is preserved below in the DRAFT section and can be
// switched back on by flipping CITY_SCOPED_BILLING — nothing there is deleted.

/**
 * Flip to `true` to re-enable the city-scoped matrix pricing kept in the DRAFT
 * section (LEGACY_LISTING_PACKS + CITY_PRICE_MATRIX). While `false` (current),
 * pricing is flat and listing quota is pooled globally across all cities.
 */
export const CITY_SCOPED_BILLING = false;

/** The single bucket every pack & credit is tracked under while billing is
 *  global, so a pack bought once gates listings in any city. (Ignored in favour
 *  of the per-city key when CITY_SCOPED_BILLING is re-enabled.) */
export const GLOBAL_BILLING_KEY = 'All';

// Free listings every new account gets before a paid pack is required.
export const FREE_LISTINGS = 1;

// Marks a Subscription row that was granted by a superadmin rather than paid for
// via Razorpay. It behaves exactly like a paid pack in the entitlement maths
// (active, stacks, consumed on posting) but carries amount 0 and a friendly
// label. Kept out of the PackId union because it is not a sellable SKU.
export const ADMIN_GRANT_PLAN_ID = 'admin_grant';

// Default validity of a superadmin listing grant (days from activation).
export const ADMIN_GRANT_DURATION_DAYS = 365;

export type PackId = 'starter_15' | 'pro_25';

export interface ListingPack {
  id: string;
  name: string;
  /** Number of listings the pack grants. */
  listings: number;
  /** Validity in days from activation. */
  durationDays: number;
  tagline: string;
  /** Flat price in rupees (nationwide) for an active pack. The DRAFT city-scoped
   *  packs leave this undefined and price via CITY_PRICE_MATRIX instead. */
  priceRupees?: number;
}

export const LISTING_PACKS: ListingPack[] = [
  { id: 'starter_15', name: '15 Listings', listings: 15, durationDays: 90,  tagline: 'For individual owners getting started', priceRupees: 500 },
  { id: 'pro_25',     name: '35 Listings', listings: 35, durationDays: 180, tagline: 'Best value for active sellers',         priceRupees: 1000 },
];

// ---------------------------------------------------------------------------
// DRAFT — city-scoped matrix pricing (kept for later; see CITY_SCOPED_BILLING)
// ---------------------------------------------------------------------------
//
// The previous pricing from the "Price Listing" sheet: a listing was sold in
// PACKS whose price depended on the CITY, with quota scoped to that city. Left
// intact so the product can switch back without re-deriving the matrix.

export type LegacyPackId =
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
// catch-all tier for any city NOT named individually in the sheet.
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

export const LEGACY_LISTING_PACKS: ListingPack[] = [
  { id: 'silver_100', name: '100 Silver Listings', listings: 100, durationDays: 90, tagline: 'Entry pack for individual owners' },
  { id: 'silver_200', name: '200 Silver Listings', listings: 200, durationDays: 90, tagline: 'For active owners & small agents' },
  { id: 'silver_250', name: '250 Silver Listings', listings: 250, durationDays: 180, tagline: 'Six months of steady posting' },
  { id: 'silver_350', name: '350 Silver Listings', listings: 350, durationDays: 180, tagline: 'Popular with growing agencies' },
  { id: 'silver_400', name: '400 Silver Listings', listings: 400, durationDays: 365, tagline: 'A full year of listings' },
  { id: 'silver_600', name: '600 Silver Listings', listings: 600, durationDays: 365, tagline: 'Best value for busy agents' },
  { id: 'silver_800', name: '800 Silver Listings', listings: 800, durationDays: 365, tagline: 'High-volume agencies & builders' },
  { id: 'silver_1000', name: '1000 Silver Listings', listings: 1000, durationDays: 365, tagline: 'Maximum reach for large teams' },
];

// Prices in rupees, taken verbatim from the sheet. `other` carries the sheet's
// "Cat 2" values and is the price for every city not named above.
export const CITY_PRICE_MATRIX: Record<LegacyPackId, Record<PriceColumn, number>> = {
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
// individually in the sheet appear here; everything else bills at `other`.
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
 *  sheet (Pune, Lucknow, …) under the city-scoped model. */
export const OTHER_CITY_LABEL = 'Other';

export function columnForCity(city: string): PriceColumn {
  return CITY_TO_COLUMN[city] ?? 'other';
}

// ---------------------------------------------------------------------------
// Lookups & pricing (active + draft resolved through one surface)
// ---------------------------------------------------------------------------

// Resolve a pack by id across BOTH the active flat packs and the legacy drafts,
// so pending/old subscriptions keyed to a silver_* plan still activate & display
// correctly after the switch to flat pricing.
const PACKS_BY_ID: Record<string, ListingPack> = Object.fromEntries(
  [...LISTING_PACKS, ...LEGACY_LISTING_PACKS].map((p) => [p.id, p]),
);

export function getPack(packId: string): ListingPack | null {
  return PACKS_BY_ID[packId] ?? null;
}

/** The options a pack can be purchased/granted for. Flat billing pools quota in
 *  one bucket (so a single "All" option); the city-scoped draft lists each
 *  sheet-named city plus the "Other" catch-all. */
export const SELLABLE_CITIES: string[] = CITY_SCOPED_BILLING
  ? [...Object.keys(CITY_TO_COLUMN), OTHER_CITY_LABEL]
  : [GLOBAL_BILLING_KEY];

/**
 * The key a listing's quota is tracked under. While billing is global this is
 * always GLOBAL_BILLING_KEY, so a pack bought once covers every city. Under the
 * city-scoped draft, sheet-named cities use their own name and the rest collapse
 * to the "Other" bucket. Keep purchase + posting + grants all keyed through this.
 */
export function billingKeyForCity(city: string): string {
  if (!CITY_SCOPED_BILLING) return GLOBAL_BILLING_KEY;
  return CITY_TO_COLUMN[city] ? city : OTHER_CITY_LABEL;
}

export interface ResolvedPrice {
  packId: string;
  city: string;
  column: PriceColumn;
  /** Price in rupees (display). */
  rupees: number;
  /** Price in paise (Razorpay charge amount). */
  amount: number;
}

/**
 * Resolves the price of a pack, or null if unknown. Flat billing uses the pack's
 * own `priceRupees` and ignores the city; the city-scoped draft reads the
 * pack × city matrix.
 */
export function resolvePrice(packId: string, city?: string): ResolvedPrice | null {
  const pack = getPack(packId);
  if (!pack) return null;

  if (!CITY_SCOPED_BILLING) {
    if (pack.priceRupees == null) return null;
    return {
      packId: pack.id,
      city: city?.trim() || GLOBAL_BILLING_KEY,
      column: 'other',
      rupees: pack.priceRupees,
      amount: pack.priceRupees * 100,
    };
  }

  if (!city) return null;
  const column = columnForCity(city);
  const rupees = (CITY_PRICE_MATRIX as Record<string, Record<PriceColumn, number>>)[pack.id]?.[column];
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
  const isAdmin = isAdminRole(role);
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
    packName: p.planId === ADMIN_GRANT_PLAN_ID
      ? 'Complimentary listings (admin grant)'
      : getPack(p.planId)?.name ?? p.planId,
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

/** Listings the user can still post in a given city. Under global billing every
 *  active pack applies regardless of city, so this is just the total remaining;
 *  under the city-scoped draft it is the free tier plus packs bought for that
 *  exact city. */
export function remainingForCity(ent: Entitlement, city: string): number {
  if (ent.unlimited) return Infinity;
  if (!CITY_SCOPED_BILLING) return ent.totalRemaining;
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

  // Oldest active pack with quota left. Global billing draws from any pack
  // (city pooled); the city-scoped draft restricts to packs bought for THIS city.
  const pack = await tx.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      ...(CITY_SCOPED_BILLING ? { city } : {}),
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

export function razorpayWebhookConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
}

/**
 * Verifies a Razorpay webhook. The signature is an HMAC-SHA256 of the RAW
 * request body keyed by the webhook secret (a different secret from the API
 * key secret — set it to match the one configured on the Razorpay webhook).
 * The body MUST be the exact bytes received; do not re-serialize parsed JSON.
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Activates a paid subscription and logs it — the single source of truth shared
 * by the client-driven verify route and the Razorpay webhook. Idempotent: if the
 * subscription is already active (e.g. verify won the race, or the webhook fires
 * twice) it returns success without double-activating or double-logging. Uses a
 * conditional updateMany so concurrent callers can't both activate.
 */
export async function activatePaidSubscription(
  subscriptionId: string,
  paymentId: string | null,
): Promise<{ ok: boolean; alreadyActive: boolean; notFound?: boolean; subscription?: Subscription }> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return { ok: false, alreadyActive: false, notFound: true };
  if (sub.status === 'active') return { ok: true, alreadyActive: true, subscription: sub };

  const pack = getPack(sub.planId);
  if (!pack) return { ok: false, alreadyActive: false };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + pack.durationDays * 24 * 60 * 60 * 1000);

  // Only this call that flips a non-active row to active "wins" and logs; a
  // concurrent verify/webhook sees count 0 and treats it as already active.
  const res = await prisma.subscription.updateMany({
    where: { id: sub.id, status: { not: 'active' } },
    data: {
      status: 'active',
      activatedAt: now,
      expiresAt,
      razorpayPaymentId: paymentId ?? sub.razorpayPaymentId ?? null,
    },
  });

  if (res.count === 0) {
    const fresh = await prisma.subscription.findUnique({ where: { id: sub.id } });
    return { ok: true, alreadyActive: true, subscription: fresh ?? sub };
  }

  const actor = await prisma.user.findUnique({
    where: { id: sub.userId },
    select: { name: true, role: true },
  });
  await prisma.activityLog.create({
    data: {
      action: 'plan_purchased',
      actorName: actor?.name ?? 'Unknown',
      actorRole: (actor?.role ?? 'user').toUpperCase(),
      details: `Purchased ${pack.name} (${pack.listings} listings${sub.city ? ` in ${sub.city}` : ''}) for ₹${(sub.amount / 100).toLocaleString('en-IN')}.`,
      targetId: sub.id,
      severity: 'success',
    },
  });

  const fresh = await prisma.subscription.findUnique({ where: { id: sub.id } });
  return { ok: true, alreadyActive: false, subscription: fresh ?? sub };
}

// ---------------------------------------------------------------------------
// Superadmin listing grants
// ---------------------------------------------------------------------------

/**
 * Grants a user extra listing quota for a city, with no payment. Creates an
 * already-active `admin_grant` Subscription so it flows through the exact same
 * entitlement + consumption path as a paid pack (city-scoped, stacking). The
 * city is normalised through billingKeyForCity so a grant lines up with how
 * that city's listings are gated (sheet-named cities keep their name; all
 * others collapse to the "Other" bucket). Superadmin-only — the caller must
 * enforce authorisation.
 */
export async function grantListingsToUser(params: {
  userId: string;
  city: string;
  listings: number;
  durationDays?: number;
}): Promise<Subscription> {
  const city = billingKeyForCity(params.city);
  const now = new Date();
  const durationDays = params.durationDays ?? ADMIN_GRANT_DURATION_DAYS;
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return prisma.subscription.create({
    data: {
      userId: params.userId,
      planId: ADMIN_GRANT_PLAN_ID,
      city,
      listingsQuota: params.listings,
      listingsUsed: 0,
      amount: 0,
      currency: 'INR',
      status: 'active',
      activatedAt: now,
      expiresAt,
    },
  });
}
