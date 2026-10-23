import 'server-only';
import { prisma } from '@/lib/prisma';
import {
  serializeFeaturedProject,
  serializeBuilder,
  serializeCollection,
  serializeAgentUser,
  serializeProperty,
} from '@/lib/serialize';
import type { FeaturedProjectItem, PreferredAgentItem } from '@/lib/homeSectionsData';
import type { Builder } from '@/lib/buildersData';
import type { CuratedCollection } from '@/lib/collectionsData';
import type { Property } from '@/lib/types';

/**
 * Server-side loaders for the project/builder/collection/agent detail pages —
 * the "what the crawler sees" source, mirroring the public branch of each
 * /api/* GET. Phone/contact numbers are always withheld (anti-scraping), and
 * only publicly visible records are returned (approved projects, preferred
 * agents). A non-public or missing record returns null so the server wrapper
 * can fall back to the client (owner/admin view) or 404.
 */

/**
 * ID lists for `generateStaticParams` — pre-render the publicly indexable
 * records at build time (others fall back to on-demand ISR). Each returns []
 * on any DB error so the build never fails.
 */
export async function getApprovedProjectIds(): Promise<string[]> {
  try {
    const rows = await prisma.featuredProject.findMany({
      where: { submissionStatus: 'approved' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('getApprovedProjectIds error', err);
    return [];
  }
}

export async function getBuilderIds(): Promise<string[]> {
  try {
    const rows = await prisma.builder.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('getBuilderIds error', err);
    return [];
  }
}

export async function getPreferredAgentIds(): Promise<string[]> {
  try {
    const rows = await prisma.user.findMany({
      where: { role: 'agent', isPreferredAgent: true, isBlocked: false },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('getPreferredAgentIds error', err);
    return [];
  }
}

export async function getCollectionIds(): Promise<string[]> {
  try {
    const rows = await prisma.collection.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('getCollectionIds error', err);
    return [];
  }
}

/** Approved project only (public). Non-approved → null (client handles owner view). */
export async function getProjectForPage(id: string): Promise<FeaturedProjectItem | null> {
  try {
    const row = await prisma.featuredProject.findUnique({ where: { id } });
    if (!row || row.submissionStatus !== 'approved') return null;
    return serializeFeaturedProject(row);
  } catch (err) {
    console.error('getProjectForPage error for', id, err);
    return null;
  }
}

/** Builder by id or slug. */
export async function getBuilderForPage(id: string): Promise<Builder | null> {
  try {
    const row = await prisma.builder.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    return row ? serializeBuilder(row) : null;
  } catch (err) {
    console.error('getBuilderForPage error for', id, err);
    return null;
  }
}

const RENT_TYPES = new Set(['rent', 'pg']);

/** Preferred agent (public) plus their own approved listings (phone withheld). */
export async function getAgentForPage(
  id: string,
): Promise<{ agent: PreferredAgentItem; properties: Property[] } | null> {
  try {
    const row = await prisma.user.findFirst({ where: { id, role: 'agent', isPreferredAgent: true } });
    if (!row) return null;
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
    return {
      agent: serializeAgentUser(row, { forSale, forRent }),
      properties: ownRows.map((p) => serializeProperty(p)),
    };
  } catch (err) {
    console.error('getAgentForPage error for', id, err);
    return null;
  }
}

/** Turn a collection's saved filter into a Prisma `where` over approved listings.
 * Mirrors the logic in GET /api/collections/[id]. */
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

/** Collection plus the live approved listings matching its filter (phone withheld). */
export async function getCollectionForPage(
  id: string,
): Promise<{ collection: CuratedCollection; properties: Property[] } | null> {
  try {
    const row = await prisma.collection.findUnique({ where: { id } });
    if (!row) return null;
    const collection = serializeCollection(row);
    let properties: Property[] = [];
    try {
      const rows = await prisma.property.findMany({
        where: whereFromFilters(collection.filters),
        orderBy: { createdAt: 'desc' },
      });
      properties = rows.map((p) => serializeProperty(p));
    } catch (err) {
      console.error('getCollectionForPage properties error for', id, err);
    }
    return { collection, properties };
  } catch (err) {
    console.error('getCollectionForPage error for', id, err);
    return null;
  }
}
