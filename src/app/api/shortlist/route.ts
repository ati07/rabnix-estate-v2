import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-persisted shortlist (saved properties) for the signed-in user.
 * Guests keep a localStorage shortlist (see propertyContext); on login the
 * client POSTs that local set here to merge it, then relies on the DB.
 *
 * All responses return the full current `propertyIds` so the client can replace
 * its state in one shot. Unauthenticated callers get an empty list (200), never
 * a 401 — the shortlist is a convenience, not a gated resource.
 */

async function currentIds(userId: string): Promise<string[]> {
  const rows = await prisma.shortlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { propertyId: true },
  });
  return rows.map((r) => r.propertyId);
}

// GET /api/shortlist — the signed-in user's shortlisted property ids.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: true, propertyIds: [] });
  return NextResponse.json({ success: true, propertyIds: await currentIds(user.id) });
}

// POST /api/shortlist — add one { propertyId } or merge many { propertyIds }.
// Idempotent: existing rows are skipped, so re-posting is safe.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to save properties.' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(b.propertyIds)
    ? b.propertyIds
    : b.propertyId
      ? [b.propertyId]
      : [];
  const clean = [...new Set(ids.filter((x): x is string => typeof x === 'string' && x.length > 0))];
  if (clean.length === 0) {
    return NextResponse.json({ success: false, error: 'propertyId(s) required' }, { status: 400 });
  }

  // Only shortlist ids that are real properties, so a stale local set can't
  // insert dangling rows (the FK would reject them anyway).
  const existing = await prisma.property.findMany({
    where: { id: { in: clean } },
    select: { id: true },
  });
  const valid = existing.map((p) => p.id);
  if (valid.length > 0) {
    await prisma.shortlist.createMany({
      data: valid.map((propertyId) => ({ userId: user.id, propertyId })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true, propertyIds: await currentIds(user.id) });
}

// DELETE /api/shortlist?propertyId=... — remove one from the shortlist.
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: 'Sign in to manage saved properties.' }, { status: 401 });

  const propertyId = new URL(req.url).searchParams.get('propertyId');
  if (!propertyId) return NextResponse.json({ success: false, error: 'propertyId required' }, { status: 400 });

  await prisma.shortlist.deleteMany({ where: { userId: user.id, propertyId } });
  return NextResponse.json({ success: true, propertyIds: await currentIds(user.id) });
}
