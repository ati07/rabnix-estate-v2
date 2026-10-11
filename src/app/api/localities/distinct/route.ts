import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/localities/distinct?city=Lucknow
// Autocomplete source derived purely from LIVE inventory: the distinct
// `locality` values that actually appear on APPROVED property listings for the
// city. Always accurate to what's really posted (unlike the static list or the
// admin-curated tiles). Ordered by listing count so the areas with the most
// inventory rank first. Returns an empty list on any DB error so the caller can
// fall back to its static locality set.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '';

  if (!city || city === 'All Cities') {
    return NextResponse.json({ success: true, localities: [] });
  }

  try {
    const grouped = await prisma.property.groupBy({
      by: ['locality'],
      where: { city, verificationStatus: 'approved' },
      _count: { _all: true },
    });

    const localities = grouped
      .filter((g) => g.locality && g.locality.trim() !== '')
      .sort((a, b) => b._count._all - a._count._all)
      .map((g) => g.locality.trim());

    return NextResponse.json({ success: true, localities });
  } catch (err: any) {
    console.warn('Prisma distinct-localities error:', err?.message || err);
    return NextResponse.json({ success: true, localities: [] });
  }
}
