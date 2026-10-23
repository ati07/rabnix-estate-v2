import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeProperty } from '@/lib/serialize';
import { coordinateColumns } from '@/lib/maps/config';
import type { Property, VerificationStatus } from '@/lib/types';

export const runtime = 'nodejs';

// GET /api/properties/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    const p = await prisma.property.findUnique({ where: { id } });
    if (p) {
      // Withhold the phone from the public detail payload; only the owner or an
      // admin receive it inline. Everyone else reveals it via the gated endpoint.
      const includeContact = !!user && (user.role === 'admin' || p.postedByUserId === user.id);
      return NextResponse.json({ success: true, property: serializeProperty(p, includeContact) });
    }
  } catch (err: any) {
    console.error('GET /api/properties/[id] error for id', id, err?.message);
  }

  return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
}

// PATCH /api/properties/:id
//   - owner can edit their own listing fields
//   - admin can additionally change verificationStatus (approve/reject/review)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });

    const isOwner = existing.postedByUserId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
    }

    const b = (await req.json()) as Partial<Property> & { verificationStatus?: VerificationStatus; rejectionReason?: string };
    const data: any = {};

    // Verification changes: admin only.
    if (b.verificationStatus !== undefined) {
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Only admins can verify listings.' }, { status: 403 });
      const status = b.verificationStatus;
      data.verificationStatus = status;
      data.isVerified = status === 'approved';
      data.rejectionReason = status === 'rejected' ? (b.rejectionReason || 'Rejected by admin.') : null;

      await prisma.activityLog.create({
        data: {
          action: status === 'approved' ? 'property_verified' : status === 'rejected' ? 'property_rejected' : 'property_created',
          actorName: user.name,
          actorRole: 'Admin',
          details:
            status === 'approved' ? 'Approved listing and awarded Verified Seal.' :
            status === 'rejected' ? `Rejected listing. Reason: ${b.rejectionReason || 'Not specified'}` :
            'Moved listing to under review.',
          targetTitle: existing.title,
          targetId: existing.id,
          severity: status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
        },
      });
    }

    // Promotion flags (isFeatured / isExclusiveOwner / priceDrop): admin only.
    // These control which curated home-page rails a listing surfaces in, so owners
    // must not be able to self-promote — only admins can toggle them.
    const PROMO_FLAGS = ['isFeatured', 'isExclusiveOwner', 'priceDrop'] as const;
    const promoChanges: string[] = [];
    for (const flag of PROMO_FLAGS) {
      if (b[flag] !== undefined) {
        if (!isAdmin) {
          return NextResponse.json({ success: false, error: 'Only admins can change promotion flags.' }, { status: 403 });
        }
        data[flag] = !!b[flag];
        promoChanges.push(`${flag}=${!!b[flag]}`);
      }
    }
    if (promoChanges.length) {
      await prisma.activityLog.create({
        data: {
          action: 'property_promoted',
          actorName: user.name,
          actorRole: 'Admin',
          details: `Updated promotion flags on "${existing.title}": ${promoChanges.join(', ')}.`,
          targetTitle: existing.title,
          targetId: existing.id,
          severity: 'info',
        },
      });
    }

    // Owner-editable fields (also editable by admin). Promotion flags are handled
    // above (admin only) and deliberately excluded here.
    const editable: (keyof Property)[] = [
      'title', 'tagline', 'listingType', 'commercialListingType', 'category', 'city', 'state', 'country', 'locality', 'subLocality',
      'address', 'coordinates',
      'price', 'priceFormatted', 'pricePerSqFt', 'maintenance', 'bhk', 'bathrooms', 'balconies',
      'carpetAreaSqFt', 'superBuiltUpAreaSqFt', 'furnishing', 'floor', 'totalFloors', 'facing',
      'constructionStatus', 'possessionDate', 'reraId', 'images', 'floorPlanImage', 'description',
      'panoramaImages', 'videoUrl', 'virtualTourUrl',
      'amenities',
    ];
    for (const key of editable) {
      if (b[key] !== undefined) data[key] = b[key];
    }

    // When coordinates change, re-derive the indexed geo columns so radius /
    // nearby queries stay consistent with the canonical coordinates JSON.
    if (b.coordinates !== undefined) {
      Object.assign(data, coordinateColumns(b.coordinates));
    }

    // An owner editing their own listing sends it back to the verification queue
    // — they must not keep the Verified seal after changing price, photos, media,
    // etc. Admin edits don't trigger this (admins set verificationStatus
    // explicitly above). Only fires when editable fields actually changed.
    if (isOwner && !isAdmin && b.verificationStatus === undefined && Object.keys(data).length > 0) {
      data.isVerified = false;
      data.verificationStatus = 'pending';
      await prisma.activityLog.create({
        data: {
          action: 'property_created',
          actorName: user.name,
          actorRole: user.role.toUpperCase(),
          details: `Edited "${existing.title}" — returned to the verification queue.`,
          targetTitle: existing.title,
          targetId: existing.id,
          severity: 'info',
        },
      });
    }

    const updated = await prisma.property.update({ where: { id }, data });
    // Caller is the owner or an admin (guarded above), so include their contact.
    return NextResponse.json({ success: true, property: serializeProperty(updated, true) });
  } catch (err: any) {
    console.error('PATCH /api/properties/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE /api/properties/:id — owner or admin.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });

    if (existing.postedByUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
    }

    await prisma.property.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'property_deleted',
        actorName: user.name,
        actorRole: user.role.toUpperCase(),
        details: `Deleted listing "${existing.title}".`,
        targetTitle: existing.title,
        targetId: existing.id,
        severity: 'danger',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/properties/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to delete listing' }, { status: 500 });
  }
}
