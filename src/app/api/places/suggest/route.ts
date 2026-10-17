import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/places/suggest — MagicBricks-style locality autosuggest, served from
// our own GeoPlace master (seeded free from OpenStreetMap; no paid API).
//
//   ?city=Lucknow&q=khu   → grouped matches { localities, areas, projects }
//   ?parentId=<id>        → the child sub-areas of one locality (drill-down)
//
// Everything is scoped to approved/public data and capped so the dropdown stays
// snappy. Any DB error degrades to empty groups so the caller can fall back to
// its static locality list.
const LIMIT = 12;

type SuggestLocality = { id: string; name: string; areaCount: number; lat: number | null; lng: number | null };
type SuggestArea = { id: string; name: string; parentName: string | null; lat: number | null; lng: number | null };
type SuggestProject = { id: string; name: string; locality: string };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parentId');
  const city = searchParams.get('city') || '';
  const q = (searchParams.get('q') || '').trim();

  try {
    // --- Drill-down: list the sub-areas of a selected locality -----------------
    if (parentId) {
      const children = await prisma.geoPlace.findMany({
        where: { parentId, kind: 'area' },
        orderBy: { name: 'asc' },
      });
      const areas: SuggestArea[] = children.map((c) => ({
        id: c.id,
        name: c.name,
        parentName: null,
        lat: c.latitude,
        lng: c.longitude,
      }));
      return NextResponse.json({ success: true, areas });
    }

    if (!city || city === 'All Cities') {
      return NextResponse.json({ success: true, localities: [], areas: [], projects: [] });
    }

    const nameFilter = q ? { name: { contains: q, mode: 'insensitive' as const } } : {};

    const [localityRows, areaRows, projectRows] = await Promise.all([
      prisma.geoPlace.findMany({
        where: { city, kind: 'locality', ...nameFilter },
        orderBy: { name: 'asc' },
        take: LIMIT,
        include: { _count: { select: { children: true } } },
      }),
      q
        ? prisma.geoPlace.findMany({
            where: { city, kind: 'area', ...nameFilter },
            orderBy: { name: 'asc' },
            take: LIMIT,
            include: { parent: { select: { name: true } } },
          })
        : Promise.resolve([]),
      q
        ? prisma.featuredProject.findMany({
            where: { city, name: { contains: q, mode: 'insensitive' } },
            orderBy: { name: 'asc' },
            take: LIMIT,
            select: { id: true, name: true, locality: true },
          })
        : Promise.resolve([]),
    ]);

    const localities: SuggestLocality[] = localityRows.map((l) => ({
      id: l.id,
      name: l.name,
      areaCount: l._count.children,
      lat: l.latitude,
      lng: l.longitude,
    }));

    const areas: SuggestArea[] = (areaRows as Array<{
      id: string; name: string; latitude: number | null; longitude: number | null; parent: { name: string } | null;
    }>).map((a) => ({
      id: a.id,
      name: a.name,
      parentName: a.parent?.name ?? null,
      lat: a.latitude,
      lng: a.longitude,
    }));

    const projects: SuggestProject[] = projectRows.map((p) => ({
      id: p.id,
      name: p.name,
      locality: p.locality,
    }));

    return NextResponse.json({ success: true, localities, areas, projects });
  } catch (err: any) {
    console.warn('places/suggest error:', err?.message || err);
    return NextResponse.json({ success: true, localities: [], areas: [], projects: [] });
  }
}
