import 'server-only';
import { prisma } from '@/lib/prisma';
import { serializeProperty } from '@/lib/serialize';
import type { Property } from '@/lib/types';

/**
 * Server-side loaders for SEO/AEO. These run only on the server (metadata,
 * JSON-LD, sitemap, generateStaticParams) and are the single source of truth
 * for "what the crawler sees" — distinct from the client context that hydrates
 * interactivity. The phone is ALWAYS withheld here (public, anti-scraping):
 * contact reveal stays gated behind POST /api/properties/[id]/contact.
 */

/**
 * Load one property for server rendering (metadata + JSON-LD + SSR HTML).
 * Returns null when the id is unknown or the DB is unreachable, so callers can
 * `notFound()`. Phone is never included.
 */
export async function getPropertyForPage(id: string): Promise<Property | null> {
  try {
    const p = await prisma.property.findUnique({ where: { id } });
    if (!p) return null;
    return serializeProperty(p, false);
  } catch (err) {
    console.error('getPropertyForPage error for id', id, err);
    return null;
  }
}

/**
 * All publicly indexable properties (approved only). Feeds the sitemap and, in
 * Phase C, generateStaticParams. Phone is never included.
 */
export async function getVerifiedProperties(): Promise<Property[]> {
  try {
    const rows = await prisma.property.findMany({
      where: { verificationStatus: 'approved' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => serializeProperty(p, false));
  } catch (err) {
    console.error('getVerifiedProperties error', err);
    return [];
  }
}

/**
 * IDs of all publicly indexable properties, for `generateStaticParams` so the
 * most-trafficked listings are pre-rendered at build time (others fall back to
 * on-demand ISR). Returns [] on any DB error so the build never fails.
 */
export async function getVerifiedPropertyIds(): Promise<string[]> {
  try {
    const rows = await prisma.property.findMany({
      where: { verificationStatus: 'approved' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  } catch (err) {
    console.error('getVerifiedPropertyIds error', err);
    return [];
  }
}
