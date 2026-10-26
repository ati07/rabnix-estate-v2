import 'server-only';
import { prisma } from '@/lib/prisma';
import { serializeProperty } from '@/lib/serialize';
import { matchesFilters, normalizeFilterState, type PropertyFilterState } from '@/lib/propertyFilters';
import type { Property } from '@/lib/types';

/**
 * Shared matching for saved searches. Both the API (new-match badges) and the
 * listing-alert cron ask the same question: which newly-approved listings match
 * a stored filter set? We reuse the exact client-side predicate (matchesFilters)
 * so the alerts agree with what the user would see on /properties.
 *
 * Contact is withheld (serializeProperty(p, false)) — alert emails and badges
 * never need a phone number, keeping the anti-scraping guarantee intact.
 */

// Cap how many fresh rows we pull per search; inventory is small and the cron
// runs often, so this is just a safety bound against a backlog spike.
const SCAN_LIMIT = 500;

export async function matchingSince(
  filters: Partial<PropertyFilterState> | null | undefined,
  since: Date,
  limit = 50,
): Promise<Property[]> {
  const f = normalizeFilterState(filters);
  const rows = await prisma.property.findMany({
    where: { verificationStatus: 'approved', createdAt: { gt: since } },
    orderBy: { createdAt: 'desc' },
    take: SCAN_LIMIT,
  });
  const matched: Property[] = [];
  for (const r of rows) {
    const p = serializeProperty(r, false);
    if (matchesFilters(p, f)) {
      matched.push(p);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}

export async function countMatchingSince(
  filters: Partial<PropertyFilterState> | null | undefined,
  since: Date,
): Promise<number> {
  const f = normalizeFilterState(filters);
  const rows = await prisma.property.findMany({
    where: { verificationStatus: 'approved', createdAt: { gt: since } },
    orderBy: { createdAt: 'desc' },
    take: SCAN_LIMIT,
    // Full rows: matchesFilters inspects many fields, so we serialize + predicate
    // rather than build an equivalent Prisma where-clause (easy to drift).
  });
  let n = 0;
  for (const r of rows) {
    if (matchesFilters(serializeProperty(r, false), f)) n++;
  }
  return n;
}
