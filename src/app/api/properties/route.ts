import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeProperty, stripPropertyContact } from '@/lib/serialize';
import { INITIAL_PROPERTIES } from '@/lib/realEstateData';
import { getEntitlement, consumeListingCredit } from '@/lib/billing';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/properties
//   ?scope=public  -> only approved/verified (default for home & search)
//   ?scope=all     -> everything (admin only)
//   ?mine=1        -> only the current user's listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'public';
    const mine = searchParams.get('mine');
    const user = await getCurrentUser();

    const where: any = {};

    if (mine === '1') {
      if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      where.postedByUserId = user.id;
    } else if (scope === 'all') {
      if (user?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
      }
      // no filter — return everything
    } else {
      // public: approved listings, plus the viewer's own listings so they can see their pending ones
      where.OR = [
        { verificationStatus: 'approved' },
        ...(user ? [{ postedByUserId: user.id }] : []),
      ];
    }

    const rows = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Contact numbers are only exposed to an admin or to the listing's own owner.
    // Everyone else gets the listing WITHOUT a phone — they must use the gated
    // reveal endpoint (POST /api/properties/[id]/contact) to obtain it.
    const isAdmin = user?.role === 'admin';
    const canSeeContact = (row: { postedByUserId: string | null }) =>
      isAdmin || (!!user && row.postedByUserId === user.id);

    if (!rows || rows.length === 0) {
      const fallback = isAdmin ? INITIAL_PROPERTIES : INITIAL_PROPERTIES.map(stripPropertyContact);
      return NextResponse.json({ success: true, properties: fallback });
    }

    return NextResponse.json({
      success: true,
      properties: rows.map((r) => serializeProperty(r, canSeeContact(r))),
    });
  } catch (err: any) {
    console.warn('Prisma DB query fallback to INITIAL_PROPERTIES:', err?.message || err);
    return NextResponse.json({ success: true, properties: INITIAL_PROPERTIES.map(stripPropertyContact) });
  }
}

// POST /api/properties — create a listing (auth required). Always starts pending review.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please sign in to post a property.' }, { status: 401 });
    }
    if (user.isBlocked) {
      return NextResponse.json({ success: false, error: 'Blocked accounts cannot post listings.' }, { status: 403 });
    }

    const b = (await req.json()) as Partial<Property>;

    if (!b.price || !b.city || !b.locality) {
      return NextResponse.json({ success: false, error: 'City, locality and price are required.' }, { status: 400 });
    }
    // Capture narrowed required fields — TS loses the narrowing inside the
    // transaction closure below.
    const price = b.price;
    const city = b.city;
    const locality = b.locality;

    // Listing quota: admins are unlimited; everyone else gets FREE_LISTINGS free,
    // then needs an active plan with remaining quota. (Race-safe consume happens
    // inside the transaction below; this is the fast, friendly pre-check.)
    const entitlement = await getEntitlement(user.id, user.role);
    if (!entitlement.unlimited && !entitlement.canCreate) {
      return NextResponse.json(
        {
          success: false,
          error: 'listing-quota-exceeded',
          message:
            'You have used all your listings. Buy a plan from your dashboard to post more properties.',
        },
        { status: 402 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      // Atomically consume one credit unless the user is an admin. If nothing is
      // available (e.g. a race emptied the quota), abort the whole transaction.
      if (!entitlement.unlimited) {
        const consumed = await consumeListingCredit(tx, user.id);
        if (!consumed) {
          throw new Error('listing-quota-exceeded');
        }
      }

      const property = await tx.property.create({
        data: {
        title: b.title || 'Residential Property',
        tagline: b.tagline,
        listingType: b.listingType || 'buy',
        // Rent/sale sub-type only applies to commercial listings.
        commercialListingType: b.listingType === 'commercial' ? (b.commercialListingType || 'sale') : null,
        category: b.category || 'Apartment',
        city: city,
        locality: locality,
        subLocality: b.subLocality,
        price: price,
        priceFormatted: b.priceFormatted || `₹${price.toLocaleString('en-IN')}`,
        pricePerSqFt: b.pricePerSqFt ?? (b.carpetAreaSqFt ? Math.round(price / b.carpetAreaSqFt) : undefined),
        maintenance: b.maintenance,
        bhk: b.bhk,
        bathrooms: b.bathrooms ?? 1,
        balconies: b.balconies,
        carpetAreaSqFt: b.carpetAreaSqFt ?? 0,
        superBuiltUpAreaSqFt: b.superBuiltUpAreaSqFt,
        furnishing: b.furnishing || 'Unfurnished',
        floor: b.floor,
        totalFloors: b.totalFloors,
        facing: b.facing,
        constructionStatus: b.constructionStatus || 'Ready to Move',
        possessionDate: b.possessionDate || 'Immediate',
        reraId: b.reraId,
        reraApproved: !!b.reraId,
        // Enforced by server: new listings await admin verification.
        isVerified: false,
        verificationStatus: 'pending',
        images: b.images && b.images.length > 0 ? b.images : [],
        floorPlanImage: b.floorPlanImage,
        description: b.description || 'Property listing.',
        amenities: b.amenities || [],
        documentsSubmitted: b.documentsSubmitted || [],
        postedBy: (b.postedBy as object) || {
          name: user.name,
          type: user.role === 'builder' ? 'Builder' : user.role === 'agent' ? 'Verified Agent' : 'Owner',
          phone: user.phone,
          companyName: user.companyName,
        },
        nearbyLandmarks: (b.nearbyLandmarks as object) ?? undefined,
        coordinates: (b.coordinates as object) ?? undefined,
        postedByUserId: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'property_created',
          actorName: user.name,
          actorRole: user.role.toUpperCase(),
          details: `Submitted new listing for review in ${property.city}.`,
          targetTitle: property.title,
          targetId: property.id,
          severity: 'info',
        },
      });

      return property;
    });

    // Creator owns this listing, so it's safe to echo back their own contact.
    return NextResponse.json({ success: true, property: serializeProperty(created, true) });
  } catch (err: any) {
    if (err?.message === 'listing-quota-exceeded') {
      return NextResponse.json(
        {
          success: false,
          error: 'listing-quota-exceeded',
          message: 'You have used all your listings. Buy a plan to post more properties.',
        },
        { status: 402 },
      );
    }
    console.error('POST /api/properties error', err);
    return NextResponse.json({ success: false, error: 'Failed to create listing' }, { status: 500 });
  }
}
