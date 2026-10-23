import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCollection, serializeProperty } from '@/lib/serialize';
import type { CuratedCollection } from '@/lib/collectionsData';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Turn a collection's saved filter into a Prisma `where` over approved listings.
function whereFromFilters(f: CuratedCollection['filters']) {
  const where: any = { verificationStatus: 'approved' };
  if (f.isOwnerOnly) where.isExclusiveOwner = true;
  if (f.isVerifiedOnly) where.isVerified = true;
  if (f.isReraApprovedOnly) where.reraApproved = true;
  if (f.constructionStatus) where.constructionStatus = f.constructionStatus;
  if (f.category) where.category = f.category;
  if (f.listingType) where.listingType = f.listingType;
  if (Array.isArray(f.bhk) && f.bhk.length) where.bhk = { in: f.bhk };
  if (f.minPrice != null || f.maxPrice != null) {
    where.price = {};
    if (f.minPrice != null) where.price.gte = f.minPrice;
    if (f.maxPrice != null) where.price.lte = f.maxPrice;
  }
  return where;
}

// GET /api/collections/:id — collection + the *live* properties matching its
// filter. 404 when the collection does not exist; empty property list when
// nothing matches (no demo fallback).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let collection: CuratedCollection | undefined;
  try {
    const row = await prisma.collection.findUnique({ where: { id } });
    if (row) collection = serializeCollection(row);
  } catch (err: any) {
    console.error('GET /api/collections/[id] error for', id, err?.message || err);
  }
  if (!collection) return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });

  let properties: Property[] = [];
  try {
    const rows = await prisma.property.findMany({
      where: whereFromFilters(collection.filters),
      orderBy: { createdAt: 'desc' },
    });
    // Public collection — contact numbers are withheld (gated reveal only).
    properties = rows.map((p) => serializeProperty(p));
  } catch (err: any) {
    console.error('GET /api/collections/[id] properties error for', id, err?.message || err);
  }

  return NextResponse.json({ success: true, collection, properties, matchedCount: properties.length });
}
