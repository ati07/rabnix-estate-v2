import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CITIES_DATA } from '@/lib/realEstateData';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/localities/available?city=Lucknow
// Admin-only. Powers the "Add locality" picker. Primary source = distinct
// `locality` values that actually appear in APPROVED listings for the city
// (with their live count), so curated tiles line up with real inventory.
// Secondary source = the canonical CITIES_DATA.popularLocalities name list.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdminRole(user?.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const city = (searchParams.get('city') || '').trim();
  if (!city) {
    return NextResponse.json({ success: false, error: 'city is required.' }, { status: 400 });
  }

  // Real localities from approved inventory (primary).
  const grouped = await prisma.property.groupBy({
    by: ['locality'],
    where: { city, verificationStatus: 'approved' },
    _count: { _all: true },
    orderBy: { _count: { locality: 'desc' } },
  });
  const fromListings = grouped
    .filter((g) => g.locality && g.locality.trim())
    .map((g) => ({ name: g.locality, count: g._count._all }));

  // Already-curated names for this city (so the UI can mark/skip them).
  const curated = await prisma.locality.findMany({ where: { city }, select: { name: true } });
  const curatedNames = curated.map((c) => c.name);

  // Canonical suggestions (secondary) — names not already surfaced by listings.
  const cityData = CITIES_DATA.find((c) => c.name === city);
  const listingNameSet = new Set(fromListings.map((l) => l.name.toLowerCase()));
  const suggestions = (cityData?.popularLocalities || []).filter(
    (n) => !listingNameSet.has(n.toLowerCase())
  );

  return NextResponse.json({
    success: true,
    fromListings,   // [{ name, count }] — have real approved inventory
    suggestions,    // string[] — canonical names, no inventory yet
    curatedNames,   // string[] — already added for this city
  });
}
