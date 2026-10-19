import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/cities/distinct
// The distinct `city` values that actually appear on APPROVED property listings,
// with a count each, ordered by inventory (busiest city first). Powers the "All
// Cities" section of the city selector so it always reflects what's really
// posted. Returns an empty list on any DB error so the caller can fall back to
// the static popular-city set.
export async function GET() {
  try {
    const grouped = await prisma.property.groupBy({
      by: ['city'],
      where: { verificationStatus: 'approved' },
      _count: { _all: true },
    });

    const cities = grouped
      .filter((g) => g.city && g.city.trim() !== '')
      .map((g) => ({ name: g.city.trim(), count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ success: true, cities });
  } catch (err: any) {
    console.warn('Prisma distinct-cities error:', err?.message || err);
    return NextResponse.json({ success: true, cities: [] });
  }
}
