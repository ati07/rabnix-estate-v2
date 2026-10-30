import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PopularLocalityCardItem } from '@/lib/homeSectionsData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fallback tile image for an auto-surfaced locality whose listings have no
// photos. A data-URI SVG (map-pin on a mint tile) so it renders through
// next/image without the SVG optimizer (dangerouslyAllowSVG is off).
const PLACEHOLDER_THUMB =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMTIiIGhlaWdodD0iMTEyIiB2aWV3Qm94PSIwIDAgMTEyIDExMiI+PHJlY3Qgd2lkdGg9IjExMiIgaGVpZ2h0PSIxMTIiIGZpbGw9IiNFN0Y2RjEiLz48cGF0aCBkPSJNNTYgMzBjLTExIDAtMjAgOS0yMCAyMCAwIDE1IDIwIDMyIDIwIDMyczIwLTE3IDIwLTMyYzAtMTEtOS0yMC0yMC0yMHptMCAyN2E3IDcgMCAxMTAtMTQgNyA3IDAgMDEwIDE0eiIgZmlsbD0iIzBFN0M1RCIvPjwvc3ZnPg==';

// Build a "₹ X - ₹ Y per sqft" string from live min/max price-per-sqft.
function priceRangeLabel(min: number | null, max: number | null): string {
  if (!min || !max) return 'Price on request';
  const fmt = (n: number) => `₹ ${Math.round(n).toLocaleString('en-IN')}`;
  return min === max ? `${fmt(min)} per sqft` : `${fmt(min)} - ${fmt(max)} per sqft`;
}

// GET /api/localities?city=Lucknow
// AUTOMATIC: every locality in the city with >=1 approved listing is surfaced.
// Admin-curated `Locality` tiles are an overlay, not a gate — where a tile
// exists it supplies the custom thumbnail + sort order and sorts first; any
// locality WITHOUT a tile is still shown, using a real photo pulled from one of
// its own listings (falling back to a placeholder only if no listing has an
// image). propertiesCount + priceRangeSqFt are always computed live from
// approved Property rows. Empty city => empty list (UI shows "Space available").
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || '';

  try {
    // Live stats per locality (approved inventory only) for this city.
    const grouped = await prisma.property.groupBy({
      by: ['locality'],
      where: { city, verificationStatus: 'approved' },
      _count: { _all: true },
      _min: { pricePerSqFt: true },
      _max: { pricePerSqFt: true },
    });

    // Merge case/spacing variants of the same locality (listings store
    // "Khurram Nagar" vs "Khurram nagar" inconsistently) into one bucket keyed
    // by a normalized name: sum counts, widen the price range, remember the
    // most-listed original casing as a display fallback.
    type Bucket = { key: string; display: string; displayCount: number; count: number; min: number | null; max: number | null };
    const buckets = new Map<string, Bucket>();
    for (const g of grouped) {
      if (!g.locality || g._count._all <= 0) continue;
      const key = g.locality.trim().toLowerCase();
      const b = buckets.get(key);
      const min = g._min.pricePerSqFt;
      const max = g._max.pricePerSqFt;
      if (!b) {
        buckets.set(key, { key, display: g.locality.trim(), displayCount: g._count._all, count: g._count._all, min, max });
      } else {
        b.count += g._count._all;
        if (min != null) b.min = b.min == null ? min : Math.min(b.min, min);
        if (max != null) b.max = b.max == null ? max : Math.max(b.max, max);
        if (g._count._all > b.displayCount) { b.display = g.locality.trim(); b.displayCount = g._count._all; }
      }
    }
    const withInventory = [...buckets.values()].sort((a, b) => b.count - a.count);

    if (withInventory.length === 0) {
      return NextResponse.json({ success: true, localities: [], source: 'live' });
    }

    // Admin-curated tiles (overlay): custom thumbnail + sort order, matched by
    // locality name (case-insensitive).
    const curated = await prisma.locality.findMany({
      where: { city },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const curatedByName = new Map(curated.map((t) => [t.name.trim().toLowerCase(), t]));

    // One representative listing photo per locality for the tiles that need it
    // (i.e. localities without a curated thumbnail). Pick the first image of an
    // approved, image-bearing listing in that locality (matched case-insensitively).
    const needPhotoKeys = withInventory
      .filter((b) => !curatedByName.get(b.key)?.thumbnail)
      .map((b) => b.key);
    const photoByLocality = new Map<string, string>();
    if (needPhotoKeys.length > 0) {
      const rows = await prisma.property.findMany({
        where: { city, verificationStatus: 'approved' },
        select: { locality: true, images: true },
      });
      const need = new Set(needPhotoKeys);
      for (const r of rows) {
        const key = r.locality.trim().toLowerCase();
        if (need.has(key) && !photoByLocality.has(key) && r.images.length > 0) {
          photoByLocality.set(key, r.images[0]);
        }
      }
    }

    // Assemble: curated-first (by their sort order), then the rest by count.
    const curatedOrder = new Map(curated.map((t, i) => [t.name.trim().toLowerCase(), i]));
    const localities: PopularLocalityCardItem[] = withInventory
      .map((b) => {
        const tile = curatedByName.get(b.key);
        return {
          id: tile?.id ?? `auto-${b.key}`,
          name: tile?.name ?? b.display,
          city,
          thumbnail: tile?.thumbnail || photoByLocality.get(b.key) || PLACEHOLDER_THUMB,
          priceRangeSqFt: priceRangeLabel(b.min, b.max),
          propertiesCount: b.count,
          _curatedRank: curatedOrder.has(b.key) ? curatedOrder.get(b.key)! : Number.MAX_SAFE_INTEGER,
          _count: b.count,
        };
      })
      .sort((a, b) => a._curatedRank - b._curatedRank || b._count - a._count)
      .map(({ _curatedRank, _count, ...item }) => item);

    return NextResponse.json({ success: true, localities, source: 'live' });
  } catch (err: any) {
    console.error('GET /api/localities error:', err?.message || err);
    return NextResponse.json({ success: true, localities: [], source: 'live' });
  }
}
