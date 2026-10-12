import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getEntitlement,
  LISTING_PACKS,
  CITY_PRICE_MATRIX,
  CITY_TO_COLUMN,
  SELLABLE_CITIES,
  razorpayConfigured,
  devBypassEnabled,
} from '@/lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/billing — pack catalog + city pricing + the user's listing entitlement.
export async function GET() {
  const user = await getCurrentUser();

  const packs = LISTING_PACKS.map((p) => ({
    id: p.id,
    name: p.name,
    listings: p.listings,
    durationDays: p.durationDays,
    tagline: p.tagline,
  }));

  // Pricing is a function of pack × city; the client resolves a price via
  // priceMatrix[packId][cityToColumn[city] ?? 'cat3'].
  const pricing = {
    cities: SELLABLE_CITIES,
    cityToColumn: CITY_TO_COLUMN,
    priceMatrix: CITY_PRICE_MATRIX,
  };

  if (!user) {
    return NextResponse.json({ success: true, authenticated: false, packs, pricing });
  }

  const entitlement = await getEntitlement(user.id, user.role);

  return NextResponse.json({
    success: true,
    authenticated: true,
    packs,
    pricing,
    entitlement: {
      ...entitlement,
      // JSON can't carry Infinity — send null for unlimited (admin).
      freeRemaining: entitlement.unlimited ? null : entitlement.freeRemaining,
      totalRemaining: entitlement.unlimited ? null : entitlement.totalRemaining,
    },
    payment: {
      // Lets the dashboard show "test mode" and skip loading checkout.js.
      devBypass: devBypassEnabled(),
      configured: razorpayConfigured(),
    },
  });
}
