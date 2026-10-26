import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteUrl } from '@/lib/siteUrl';
import { matchingSince } from '@/lib/savedSearchMatch';
import { sendListingAlertEmail, type ListingAlertItem } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Long-ish budget: one DB scan per alert-enabled saved search + an email each.
export const maxDuration = 60;

// Most listings we'll itemize in a single digest email.
const MAX_ITEMS_PER_EMAIL = 12;

/**
 * New-listing alert cron. For every alerts-enabled saved search, finds approved
 * listings posted since the search was last accounted for (`lastCheckedAt`) that
 * match its stored filters, emails the owner a digest, and advances the
 * watermark so each listing is emailed once. Searches with no new matches are
 * left untouched (cheap rescan next run; their in-app "N new" badge keeps
 * counting until the user views them).
 *
 * Invoked by Vercel Cron (see vercel.json). Protected by CRON_SECRET: Vercel
 * sends it as `Authorization: Bearer <CRON_SECRET>`. Locally, if CRON_SECRET is
 * unset and we're not in production, the endpoint is open for testing.
 */

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

async function run() {
  const base = getSiteUrl();
  const browseUrl = `${base}/properties`;

  const searches = await prisma.savedSearch.findMany({
    where: { alertsEnabled: true },
    include: { user: { select: { email: true, isBlocked: true } } },
  });

  let emailed = 0;
  let totalMatches = 0;
  const now = new Date();

  for (const s of searches) {
    if (!s.user || s.user.isBlocked || !s.user.email) continue;

    const matches = await matchingSince(s.filters as Record<string, unknown>, s.lastCheckedAt, MAX_ITEMS_PER_EMAIL);
    if (matches.length === 0) continue;

    totalMatches += matches.length;
    const items: ListingAlertItem[] = matches.map((p) => ({
      title: p.title,
      priceFormatted: p.priceFormatted,
      locality: p.locality,
      city: p.city,
      bhk: p.bhk ?? undefined,
      category: p.category,
      url: `${base}/properties/${p.id}`,
    }));

    const { sent } = await sendListingAlertEmail(s.user.email, { searchName: s.name, items, browseUrl });
    if (sent) {
      emailed++;
      // Only advance the watermark once the digest is out, so a send failure
      // retries the same listings next run rather than dropping them.
      await prisma.savedSearch.update({
        where: { id: s.id },
        data: { lastCheckedAt: now, lastNotifiedAt: now },
      });
    }
  }

  return { processed: searches.length, emailed, totalMatches };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await run();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('listing-alerts cron error', err);
    return NextResponse.json({ success: false, error: 'Cron failed' }, { status: 500 });
  }
}

// Allow POST too, so the job can be triggered by schedulers that prefer POST.
export const POST = GET;
