import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/localities[?city=Lucknow]
// Admin-only. Returns curated locality tiles with their LIVE approved-listing
// count so the admin can see which tiles are actually visible on the site
// (count > 0) vs. hidden (count = 0, no inventory yet).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;

  const curated = await prisma.locality.findMany({
    where: city ? { city } : undefined,
    orderBy: [{ city: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  // Live approved counts across all cities present in the curated set.
  const cities = Array.from(new Set(curated.map((l) => l.city)));
  const grouped = cities.length
    ? await prisma.property.groupBy({
        by: ['city', 'locality'],
        where: { city: { in: cities }, verificationStatus: 'approved' },
        _count: { _all: true },
      })
    : [];
  const counts = new Map(
    grouped.map((g) => [`${g.city.toLowerCase()}|${g.locality.toLowerCase()}`, g._count._all])
  );

  const localities = curated.map((l) => ({
    ...l,
    liveCount: counts.get(`${l.city.toLowerCase()}|${l.name.toLowerCase()}`) ?? 0,
  }));

  return NextResponse.json({ success: true, localities });
}

// POST /api/admin/localities  { city, name, thumbnail, sortOrder? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const city = (body?.city || '').trim();
  const name = (body?.name || '').trim();
  const thumbnail = (body?.thumbnail || '').trim();
  const sortOrder = Number.isFinite(body?.sortOrder) ? Number(body.sortOrder) : 0;

  if (!city || !name || !thumbnail) {
    return NextResponse.json(
      { success: false, error: 'City, locality name and a thumbnail image are required.' },
      { status: 400 }
    );
  }

  const existing = await prisma.locality.findUnique({ where: { city_name: { city, name } } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: `"${name}" already exists for ${city}.` },
      { status: 409 }
    );
  }

  const created = await prisma.locality.create({ data: { city, name, thumbnail, sortOrder } });

  await prisma.activityLog.create({
    data: {
      action: 'locality_created',
      actorName: user.name,
      actorRole: user.role.toUpperCase(),
      details: `Added popular locality "${name}" in ${city}.`,
      targetTitle: name,
      targetId: created.id,
      severity: 'info',
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, locality: created });
}
