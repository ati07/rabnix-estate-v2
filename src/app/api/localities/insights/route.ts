import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeLocalityInsights, type InsightInput } from '@/lib/localityInsights';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/localities/insights?city=<name>&limit=<n>
// Real per-locality market intelligence (price/sqft, median rent, rental yield,
// BHK mix) derived from the city's approved inventory. No contact data leaves
// here, and localities with too little data are withheld rather than faked.
export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get('city')?.trim();
    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 8, 1), 20);
    if (!city) return NextResponse.json({ success: true, city: null, insights: [] });

    const rows = await prisma.property.findMany({
      where: { city: { equals: city, mode: 'insensitive' }, verificationStatus: 'approved' },
      select: {
        locality: true,
        listingType: true,
        commercialListingType: true,
        price: true,
        pricePerSqFt: true,
        carpetAreaSqFt: true,
        superBuiltUpAreaSqFt: true,
        bhk: true,
      },
    });

    const insights = computeLocalityInsights(rows as InsightInput[], limit);
    return NextResponse.json({ success: true, city, insights });
  } catch (err) {
    console.error('GET /api/localities/insights error', err);
    return NextResponse.json({ success: true, city: null, insights: [] });
  }
}
