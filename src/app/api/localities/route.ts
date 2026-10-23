import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PopularLocalityCardItem } from '@/lib/homeSectionsData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Build a "₹ X - ₹ Y per sqft" string from live min/max price-per-sqft.
function priceRangeLabel(min: number | null, max: number | null): string {
  if (!min || !max) return 'Price on request';
  const fmt = (n: number) => `₹ ${Math.round(n).toLocaleString('en-IN')}`;
  return min === max ? `${fmt(min)} per sqft` : `${fmt(min)} - ${fmt(max)} per sqft`;
}

// GET /api/localities?city=Lucknow
// Source of truth = admin-curated Locality tiles for the city. Each tile's
// propertiesCount and priceRangeSqFt are computed LIVE from approved Property
// rows whose `locality` matches the tile name (case-insensitive). Tiles with
// zero matching approved listings are hidden (inventory-gated / "option 4").
// If the admin has curated nothing for the city — or nothing currently has
// inventory — we return an empty list (the UI shows a "Space available"
// placeholder). No static/demo fallback.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '';

  try {
    const curated = await prisma.locality.findMany({
      where: { city },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (curated.length === 0) {
      return NextResponse.json({ success: true, localities: [], source: 'live' });
    }

    // Live stats per locality (approved inventory only) for this city.
    const grouped = await prisma.property.groupBy({
      by: ['locality'],
      where: { city, verificationStatus: 'approved' },
      _count: { _all: true },
      _min: { pricePerSqFt: true },
      _max: { pricePerSqFt: true },
    });
    const stats = new Map(
      grouped.map((g) => [
        g.locality.toLowerCase(),
        { count: g._count._all, min: g._min.pricePerSqFt, max: g._max.pricePerSqFt },
      ])
    );

    const localities: PopularLocalityCardItem[] = [];
    for (const t of curated) {
      const s = stats.get(t.name.toLowerCase());
      if (!s || s.count === 0) continue; // hide empty localities
      localities.push({
        id: t.id,
        name: t.name,
        city: t.city,
        thumbnail: t.thumbnail,
        priceRangeSqFt: priceRangeLabel(s.min, s.max),
        propertiesCount: s.count,
      });
    }

    return NextResponse.json({ success: true, localities, source: 'live' });
  } catch (err: any) {
    console.error('GET /api/localities error:', err?.message || err);
    return NextResponse.json({ success: true, localities: [], source: 'live' });
  }
}
