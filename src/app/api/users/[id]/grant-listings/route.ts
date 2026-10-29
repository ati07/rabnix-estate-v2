import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/roles';
import { grantListingsToUser, SELLABLE_CITIES, OTHER_CITY_LABEL } from '@/lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/users/:id/grant-listings — superadmin only (a master control).
//
// Grants a user extra listing quota for a city, with no payment. Reuses the
// billing entitlement path by creating an already-active `admin_grant`
// Subscription, so the credits behave exactly like a purchased pack (city
// scoped, stacking, consumed on posting). Body: { city, listings, durationDays? }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me || !isSuperAdmin(me.role)) {
      return NextResponse.json({ success: false, error: 'Super Admin access required' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      city?: string;
      listings?: number | string;
      durationDays?: number | string;
    };

    const city = String(body.city ?? '').trim();
    if (!city || !SELLABLE_CITIES.includes(city)) {
      return NextResponse.json(
        { success: false, error: `Pick a valid city. Allowed: ${SELLABLE_CITIES.join(', ')}.` },
        { status: 400 },
      );
    }

    const listings = Number(body.listings);
    if (!Number.isInteger(listings) || listings < 1 || listings > 100000) {
      return NextResponse.json(
        { success: false, error: 'Listings must be a whole number between 1 and 100000.' },
        { status: 400 },
      );
    }

    const durationDays =
      body.durationDays === undefined || body.durationDays === '' || body.durationDays === null
        ? undefined
        : Number(body.durationDays);
    if (durationDays !== undefined && (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650)) {
      return NextResponse.json(
        { success: false, error: 'Validity must be a whole number of days between 1 and 3650.' },
        { status: 400 },
      );
    }

    const sub = await grantListingsToUser({ userId: id, city, listings, durationDays });

    await prisma.activityLog.create({
      data: {
        action: 'plan_purchased',
        actorName: me.name,
        actorRole: 'Super Admin',
        details: `Granted ${listings} complimentary listing${listings === 1 ? '' : 's'} to "${target.name}" (${target.email}) for ${city === OTHER_CITY_LABEL ? 'Other cities' : city}.`,
        targetTitle: target.name,
        targetId: target.id,
        severity: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      grant: {
        id: sub.id,
        city: sub.city,
        listingsQuota: sub.listingsQuota,
        expiresAt: sub.expiresAt ? sub.expiresAt.toISOString() : null,
      },
    });
  } catch (err: any) {
    console.error('POST /api/users/[id]/grant-listings error', err);
    return NextResponse.json({ success: false, error: 'Failed to grant listings.' }, { status: 500 });
  }
}
