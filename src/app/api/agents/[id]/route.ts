import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeAgentUser, serializeProperty, stripPropertyContact } from '@/lib/serialize';
import { getAgentById, getAgentProperties, HOME_PREFERRED_AGENTS } from '@/lib/homeSectionsData';
import { INITIAL_PROPERTIES } from '@/lib/realEstateData';
import type { PreferredAgentItem } from '@/lib/homeSectionsData';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RENT_TYPES = new Set(['rent', 'pg']);

// GET /api/agents/:id — the agent (a preferred-agent User) plus the listings
// they actually posted. For a real agent account we return ONLY their own
// approved properties (postedByUserId === agent id). Legacy/static agents
// (resolved from the seed catalogue, no real account) fall back to the old
// re-badging helper since there is no user to attribute listings to.
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
    console.warn('Prisma agent fallback for', id, err?.message || err);
  }

  // --- Static / legacy fallback (no real account) ---
  if (!agent) agent = getAgentById(id) ?? HOME_PREFERRED_AGENTS.find((a) => a.id === id);
  if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });

  let allProperties: Property[] = [];
  try {
    const rows = await prisma.property.findMany({
      where: { verificationStatus: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    allProperties = rows.length > 0
      ? rows.map((p) => serializeProperty(p))
      : INITIAL_PROPERTIES.map(stripPropertyContact);
  } catch {
    allProperties = INITIAL_PROPERTIES.map(stripPropertyContact);
  }

  const properties = getAgentProperties(agent, allProperties);
  return NextResponse.json({ success: true, agent, properties });
}
