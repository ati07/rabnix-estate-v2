import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeProperty } from '@/lib/serialize';
import { haversineMeters, normalizeCoordinates, type LatLngLiteral } from '@/lib/maps/config';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/properties/nearby — server-side radius ("area distance") search.
//
//   ?lat=19.07&lng=72.87&radius=3000   → approved listings within 3 km of the
//                                         point, nearest first, each annotated
//                                         with distanceMeters.
//   &exclude=<id>                       → drop one listing (e.g. the current one
//                                         on a detail page's "nearby" strip).
//   &limit=24                           → cap the result count.
//
// It prefilters with a bounding box on the indexed (latitude, longitude) columns
// so the DB does the cheap work, then refines with an exact haversine distance
// and sorts by it. Honors the same public scope + contact-stripping rules as
// GET /api/properties. Any DB error degrades to an empty result set.

const DEFAULT_RADIUS_M = 3000;
const MAX_RADIUS_M = 50000; // 50 km hard cap
const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;
const BBOX_SCAN_CAP = 500; // most rows a single bbox query may pull before refine

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const center = normalizeCoordinates({
    lat: Number(searchParams.get('lat')),
    lng: Number(searchParams.get('lng')),
  });
  if (!center) {
    return NextResponse.json(
      { success: false, error: 'Valid lat and lng query params are required.' },
      { status: 400 },
    );
  }

  const radius = clamp(Number(searchParams.get('radius')) || DEFAULT_RADIUS_M, 1, MAX_RADIUS_M);
  const limit = clamp(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 1, MAX_LIMIT);
  const excludeId = searchParams.get('exclude') || undefined;

  // Bounding box around the center. 1° latitude ≈ 111.32 km everywhere; 1°
  // longitude shrinks toward the poles by cos(lat). Guard the cosine so we never
  // divide by ~0 (would blow the box up); clamp to a sane minimum.
  const latDelta = radius / 111320;
  const cosLat = Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01);
  const lngDelta = radius / (111320 * cosLat);

  try {
    const user = await getCurrentUser();
    const isAdmin = isAdminRole(user?.role);

    const where: Record<string, unknown> = {
      latitude: { gte: center.lat - latDelta, lte: center.lat + latDelta },
      longitude: { gte: center.lng - lngDelta, lte: center.lng + lngDelta },
      // Public scope: approved listings, plus the viewer's own pending ones.
      OR: [
        { verificationStatus: 'approved' },
        ...(user ? [{ postedByUserId: user.id }] : []),
      ],
    };
    if (excludeId) where.id = { not: excludeId };

    const rows = await prisma.property.findMany({ where, take: BBOX_SCAN_CAP });

    const canSeeContact = (row: { postedByUserId: string | null }) =>
      isAdmin || (!!user && row.postedByUserId === user.id);

    const results = rows
      .map((r) => {
        const loc: LatLngLiteral | null =
          r.latitude != null && r.longitude != null
            ? normalizeCoordinates({ lat: r.latitude, lng: r.longitude })
            : null;
        if (!loc) return null;
        const distanceMeters = Math.round(haversineMeters(center, loc));
        if (distanceMeters > radius) return null; // bbox corner outside the circle
        return { property: serializeProperty(r, canSeeContact(r)), distanceMeters };
      })
      .filter((x): x is { property: ReturnType<typeof serializeProperty>; distanceMeters: number } => x !== null)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, limit);

    return NextResponse.json({ success: true, center, radius, count: results.length, results });
  } catch (err: any) {
    console.warn('GET /api/properties/nearby error:', err?.message || err);
    return NextResponse.json({ success: true, center, radius, count: 0, results: [] });
  }
}
