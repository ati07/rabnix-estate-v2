import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface ListingStat {
  views: number;
  uniqueVisitors: number;
  leads: number;
  reveals: number;
}

// GET /api/analytics/listings
// Real per-listing engagement for the signed-in user's own properties, computed
// from the source tables rather than the denormalized counters on Property:
//   • views / uniqueVisitors — PropertyView rows
//   • leads                  — Inquiry rows
//   • reveals                — contact_revealed ActivityLog entries (gated phone
//                              reveals; the headline "my listing is working" signal
//                              for an owner-direct marketplace)
// Scoped strictly to listings the caller owns. Guests get empty stats.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: true, stats: {}, totals: emptyTotals() });

    const owned = await prisma.property.findMany({
      where: { postedByUserId: user.id },
      select: { id: true },
    });
    const ids = owned.map((p) => p.id);
    if (ids.length === 0) return NextResponse.json({ success: true, stats: {}, totals: emptyTotals() });

    const [views, inquiries, reveals] = await Promise.all([
      prisma.propertyView.findMany({
        where: { propertyId: { in: ids } },
        select: { propertyId: true, visitorKey: true },
      }),
      prisma.inquiry.groupBy({
        by: ['propertyId'],
        where: { propertyId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.activityLog.findMany({
        where: { action: 'contact_revealed', targetId: { in: ids } },
        select: { targetId: true },
      }),
    ]);

    // Seed every owned listing so the UI always has an entry (even all-zeros).
    const stats: Record<string, ListingStat> = {};
    for (const id of ids) stats[id] = { views: 0, uniqueVisitors: 0, leads: 0, reveals: 0 };

    const visitorsByListing: Record<string, Set<string>> = {};
    for (const v of views) {
      stats[v.propertyId].views++;
      (visitorsByListing[v.propertyId] ??= new Set()).add(v.visitorKey);
    }
    for (const id of ids) stats[id].uniqueVisitors = visitorsByListing[id]?.size ?? 0;

    for (const g of inquiries) stats[g.propertyId].leads = g._count._all;

    for (const r of reveals) {
      if (r.targetId && stats[r.targetId]) stats[r.targetId].reveals++;
    }

    const totals = Object.values(stats).reduce(
      (acc, s) => {
        acc.views += s.views;
        acc.uniqueVisitors += s.uniqueVisitors;
        acc.leads += s.leads;
        acc.reveals += s.reveals;
        return acc;
      },
      emptyTotals(),
    );

    return NextResponse.json({ success: true, stats, totals });
  } catch (err) {
    console.error('GET /api/analytics/listings error', err);
    return NextResponse.json({ success: true, stats: {}, totals: emptyTotals() });
  }
}

function emptyTotals(): ListingStat {
  return { views: 0, uniqueVisitors: 0, leads: 0, reveals: 0 };
}
