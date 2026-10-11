import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCollection, serializeProperty, stripPropertyContact } from '@/lib/serialize';
import { getCollectionById } from '@/lib/collectionsData';
import { INITIAL_PROPERTIES } from '@/lib/realEstateData';
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

// Resolve a collection's filter against the static catalogue (DB-unavailable path).
function filterStatic(f: CuratedCollection['filters']): Property[] {
  return INITIAL_PROPERTIES.filter((p) => {
    if (p.verificationStatus && p.verificationStatus !== 'approved') return false;
    if (f.isOwnerOnly && !p.isExclusiveOwner) return false;
    if (f.isVerifiedOnly && !p.isVerified) return false;
    if (f.isReraApprovedOnly && !p.reraApproved) return false;
    if (f.constructionStatus && p.constructionStatus !== f.constructionStatus) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.listingType && p.listingType !== f.listingType) return false;
    if (Array.isArray(f.bhk) && f.bhk.length && (p.bhk == null || !f.bhk.includes(p.bhk))) return false;
    if (f.minPrice != null && p.price < f.minPrice) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
    return true;
  });
}

// GET /api/collections/:id — collection + the *live* properties matching its filter.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let collection: CuratedCollection | undefined;
  try {
    const row = await prisma.collection.findUnique({ where: { id } });
    if (row) collection = serializeCollection(row);
  } catch (err: any) {
    console.warn('Prisma collection fallback for', id, err?.message || err);
  }
  if (!collection) collection = getCollectionById(id);
  if (!collection) return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });

  let properties: Property[] = [];
  try {
    const rows = await prisma.property.findMany({
      where: whereFromFilters(collection.filters),
      orderBy: { createdAt: 'desc' },
    });
    // Public collection — contact numbers are withheld (gated reveal only).
    properties = rows.length > 0
      ? rows.map((p) => serializeProperty(p))
      : filterStatic(collection.filters).map(stripPropertyContact);
  } catch {
    properties = filterStatic(collection.filters).map(stripPropertyContact);
  }

  return NextResponse.json({ success: true, collection, properties, matchedCount: properties.length });
}
