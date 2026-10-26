import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { normalizeFilterState, countActiveFilters } from '@/lib/propertyFilters';
import { countMatchingSince } from '@/lib/savedSearchMatch';
import { Prisma, type SavedSearch } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Saved searches for the signed-in user. A saved search stores a snapshot of
 * the /properties filter state and (optionally) drives new-listing email alerts
 * via /api/cron/listing-alerts. GET also returns `newCount` — approved listings
 * created since the search was last checked that still match — so the UI can
 * badge "N new".
 */

const MAX_SAVED_SEARCHES = 30; // guardrail per user

async function serialize(row: SavedSearch) {
  const filters = normalizeFilterState(row.filters as Record<string, unknown>);
  return {
    id: row.id,
    name: row.name,
    filters,
    activeFilterCount: countActiveFilters(filters),
    alertsEnabled: row.alertsEnabled,
    newCount: await countMatchingSince(filters, row.lastCheckedAt),
    lastNotifiedAt: row.lastNotifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /api/saved-searches — the signed-in user's saved searches, newest first.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: true, savedSearches: [] });

  const rows = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  const savedSearches = await Promise.all(rows.map(serialize));
  return NextResponse.json({ success: true, savedSearches });
}

// POST /api/saved-searches — create { name, filters, alertsEnabled? }.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to save a search.' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 80) : '';
  if (!name) return NextResponse.json({ success: false, error: 'A name is required.' }, { status: 400 });

  const count = await prisma.savedSearch.count({ where: { userId: user.id } });
  if (count >= MAX_SAVED_SEARCHES) {
    return NextResponse.json(
      { success: false, error: `You can keep up to ${MAX_SAVED_SEARCHES} saved searches.` },
      { status: 400 },
    );
  }

  // Store a normalized, full filter snapshot so matching is always well-defined.
  const filters = normalizeFilterState(b.filters);
  const row = await prisma.savedSearch.create({
    data: {
      userId: user.id,
      name,
      filters: filters as unknown as Prisma.InputJsonObject,
      alertsEnabled: b.alertsEnabled !== false,
    },
  });
  return NextResponse.json({ success: true, savedSearch: await serialize(row) });
}

// PATCH /api/saved-searches?id=... — toggle alerts or mark matches as seen.
// Body: { alertsEnabled?: boolean, markSeen?: true } (markSeen advances the
// new-match watermark so the "N new" badge resets).
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  const existing = await prisma.savedSearch.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const b = await req.json().catch(() => ({}));
  const data: { alertsEnabled?: boolean; lastCheckedAt?: Date } = {};
  if (typeof b.alertsEnabled === 'boolean') data.alertsEnabled = b.alertsEnabled;
  if (b.markSeen === true) data.lastCheckedAt = new Date();

  const row = await prisma.savedSearch.update({ where: { id }, data });
  return NextResponse.json({ success: true, savedSearch: await serialize(row) });
}

// DELETE /api/saved-searches?id=... — remove one of the user's saved searches.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  await prisma.savedSearch.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ success: true });
}
