import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getContactVerifiedPhone } from '@/lib/auth';
import type { Property } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/properties/:id/contact — gated contact reveal.
//
// The seller/agent phone is deliberately withheld from every public list/detail
// payload (see serializeProperty) to stop bulk harvesting. A viewer obtains it
// one listing at a time through this endpoint, and every reveal is recorded in
// the activity log so abnormal harvesting is visible. The listing must be
// publicly visible (approved) unless the caller is its owner or an admin.
//
// A non-owner viewer must first prove control of a mobile number via OTP
// (POST /api/otp/request → /api/otp/confirm, which sets the contact-verify
// cookie). Only then is the seller's contact returned — so numbers can't be
// harvested without a traceable, verified phone. Owners/admins are exempt.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const property = await prisma.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const isAdmin = user?.role === 'admin';
    const isOwner = !!user && property.postedByUserId === user.id;
    const isPublic = property.verificationStatus === 'approved';

    if (!isPublic && !isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'This listing is not available.' }, { status: 403 });
    }

    // Gate the reveal on a verified mobile number for everyone but the
    // owner/admin. `verifiedPhone` is also recorded in the audit log below.
    let verifiedPhone: string | null = null;
    if (!isOwner && !isAdmin) {
      verifiedPhone = await getContactVerifiedPhone();
      if (!verifiedPhone) {
        return NextResponse.json(
          { success: false, error: 'Please verify your mobile number to view the seller’s contact details.', needsVerification: true },
          { status: 403 }
        );
      }
    }

    const postedBy = property.postedBy as Property['postedBy'];
    if (!postedBy?.phone) {
      return NextResponse.json({ success: false, error: 'No contact number is available for this listing.' }, { status: 404 });
    }

    // Record the reveal (owners/admins viewing their own listings don't need
    // auditing — only outside viewers can harvest).
    if (!isOwner && !isAdmin) {
      await prisma.activityLog.create({
        data: {
          action: 'contact_revealed',
          actorName: user?.name || (verifiedPhone ? `Verified +91 ${verifiedPhone}` : 'Guest'),
          actorRole: user?.role ? user.role.toUpperCase() : 'GUEST',
          details: `Revealed contact for "${property.title}"${verifiedPhone ? ` (verified mobile +91 ${verifiedPhone})` : ''}.`,
          targetTitle: property.title,
          targetId: property.id,
          severity: 'info',
        },
      });
    }

    return NextResponse.json({
      success: true,
      contact: {
        name: postedBy.name,
        phone: postedBy.phone,
        type: postedBy.type,
        companyName: postedBy.companyName,
      },
    });
  } catch (err: any) {
    console.error('POST /api/properties/[id]/contact error', err);
    return NextResponse.json({ success: false, error: 'Failed to reveal contact' }, { status: 500 });
  }
}
