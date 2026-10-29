import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, toPublicProfile } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/roles';
import { FREE_LISTINGS, ADMIN_GRANT_PLAN_ID } from '@/lib/billing';
import type { UserRole } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/users — admin (or superadmin). Returns all users (public profiles, no
// hashes), each annotated with live counts: listings posted (Property.postedByUserId)
// and buyer leads received (Inquiry.sellerUserId), so the admin table shows real
// activity rather than zeros.
export async function GET() {
  const me = await getCurrentUser();
  if (!me || !isAdminRole(me.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const now = new Date();
  const [users, listingCounts, inquiryCounts, grantCounts] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.property.groupBy({
      by: ['postedByUserId'],
      where: { postedByUserId: { not: null } },
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ['sellerUserId'],
      where: { sellerUserId: { not: null } },
      _count: { _all: true },
    }),
    // Remaining complimentary (superadmin-granted) listings: sum quota minus used
    // across each user's active, non-expired admin_grant packs.
    prisma.subscription.groupBy({
      by: ['userId'],
      where: { planId: ADMIN_GRANT_PLAN_ID, status: 'active', expiresAt: { gt: now } },
      _sum: { listingsQuota: true, listingsUsed: true },
    }),
  ]);

  const listingMap = new Map(listingCounts.map((r) => [r.postedByUserId, r._count._all]));
  const inquiryMap = new Map(inquiryCounts.map((r) => [r.sellerUserId, r._count._all]));
  const grantMap = new Map(
    grantCounts.map((r) => [r.userId, Math.max(0, (r._sum.listingsQuota ?? 0) - (r._sum.listingsUsed ?? 0))]),
  );

  const out = users.map((u) => ({
    ...toPublicProfile(u),
    postedListingsCount: listingMap.get(u.id) ?? 0,
    totalInquiriesReceived: inquiryMap.get(u.id) ?? 0,
    // Admins/superadmins post unlimited (null); everyone else gets the free tier
    // minus what they've already used.
    freeListingsRemaining: isAdminRole(u.role) ? null : Math.max(0, FREE_LISTINGS - (u.freeListingsUsed ?? 0)),
    // Remaining listings from superadmin grants (0 if none). null for admins
    // (they're unlimited and never hold grant packs).
    grantedListingsRemaining: isAdminRole(u.role) ? null : (grantMap.get(u.id) ?? 0),
  }));

  return NextResponse.json({ success: true, users: out });
}

// Superadmins may provision any role (including admin/superadmin), unlike
// self-registration. Account creation is a master control, hence superadmin-only.
const VALID_ROLES: UserRole[] = ['buyer', 'owner', 'agent', 'builder', 'admin', 'superadmin'];

// POST /api/users — superadmin only. Create a new account of any role.
export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser();
    if (!me || !isSuperAdmin(me.role)) {
      return NextResponse.json({ success: false, error: 'Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password, role, city, companyName, reraNumber } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, phone and password are required.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    const safeRole: UserRole = VALID_ROLES.includes(role) ? role : 'buyer';

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).startsWith('+91') ? phone : `+91 ${phone}`,
        passwordHash: await hashPassword(password),
        role: safeRole,
        city: city || 'Bangalore',
        companyName: companyName || undefined,
        reraNumber: reraNumber || undefined,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'user_registered',
        actorName: me.name,
        actorRole: 'Super Admin',
        details: `Super Admin created a new ${safeRole.toUpperCase()} account for "${user.name}" (${user.email}).`,
        targetTitle: user.name,
        targetId: user.id,
        severity: 'success',
      },
    });

    return NextResponse.json({ success: true, user: toPublicProfile(user) });
  } catch (err: any) {
    console.error('POST /api/users error', err);
    return NextResponse.json({ success: false, error: 'Failed to create user.' }, { status: 500 });
  }
}
