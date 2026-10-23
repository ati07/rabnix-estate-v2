import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeBuilder } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/builders — all builders from the DB. Returns an empty list when none
// exist (the UI renders a "Space available" placeholder); no demo fallback.
export async function GET() {
  try {
    const rows = await prisma.builder.findMany({ orderBy: { reviewsCount: 'desc' } });
    return NextResponse.json({ success: true, builders: rows.map(serializeBuilder) });
  } catch (err: any) {
    console.error('GET /api/builders error:', err?.message || err);
    return NextResponse.json({ success: true, builders: [] });
  }
}
