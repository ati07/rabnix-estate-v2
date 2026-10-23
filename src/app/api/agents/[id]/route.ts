import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeAgentUser, serializeProperty } from '@/lib/serialize';
import type { PreferredAgentItem } from '@/lib/homeSectionsData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RENT_TYPES = new Set(['rent', 'pg']);

// GET /api/agents/:id — the agent (a preferred-agent User) plus the listings
// they actually posted. Returns ONLY their own approved properties
// (postedByUserId === agent id). 404 when there is no such agent account; no
// demo fallback.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let agent: PreferredAgentItem | undefined;

  try {
    const row = await prisma.user.findFirst({
      where: { id, role: 'agent', isPreferredAgent: true },
    });
    if (row) {
      // Their real approved listings, split by sale/rent for the counts.
      const ownRows = await prisma.property.findMany({
        where: { verificationStatus: 'approved', postedByUserId: row.id },
        orderBy: { createdAt: 'desc' },
      });
      let forSale = 0;
      let forRent = 0;
      for (const p of ownRows) {
        if (RENT_TYPES.has(p.listingType)) forRent++;
        else forSale++;
      }
      agent = serializeAgentUser(row, { forSale, forRent });
      // Public agent profile — contact numbers are withheld (gated reveal only).
      const properties = ownRows.map((p) => serializeProperty(p));
      return NextResponse.json({ success: true, agent, properties });
    }
  } catch (err: any) {
    console.error('GET /api/agents/[id] error for', id, err?.message || err);
  }

  return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
}
