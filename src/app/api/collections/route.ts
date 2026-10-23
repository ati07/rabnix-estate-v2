import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCollection } from '@/lib/serialize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/collections — all curated collections from the DB. Returns an empty
// list when none exist (UI shows a "Space available" placeholder); no fallback.
export async function GET() {
  try {
    const rows = await prisma.collection.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, collections: rows.map(serializeCollection) });
  } catch (err: any) {
    console.error('GET /api/collections error:', err?.message || err);
    return NextResponse.json({ success: true, collections: [] });
  }
}
