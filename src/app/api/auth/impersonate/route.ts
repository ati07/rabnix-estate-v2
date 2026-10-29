import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getRealSessionUser,
  setImpersonationCookie,
  clearImpersonationCookie,
} from '@/lib/auth';
import { isSuperAdmin } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/impersonate — superadmin only. Start viewing a user's
// dashboard. Body: { targetId }. Sets the impersonation cookie so getCurrentUser
// resolves to the target for subsequent requests.
export async function POST(req: NextRequest) {
  // Must check the REAL session (not getCurrentUser, which would already be
  // impersonated if a session was active).
  const real = await getRealSessionUser();
  if (!real || !isSuperAdmin(real.role)) {
    return NextResponse.json({ success: false, error: 'Super Admin access required' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { targetId?: string };
  const targetId = String(body.targetId ?? '').trim();
  if (!targetId) {
    return NextResponse.json({ success: false, error: 'targetId is required.' }, { status: 400 });
  }
  if (targetId === real.id) {
    return NextResponse.json({ success: false, error: 'You are already signed in as yourself.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  await setImpersonationCookie(real.id, target.id);

  await prisma.activityLog.create({
    data: {
      action: 'user_impersonated',
      actorName: real.name,
      actorRole: 'Super Admin',
      details: `Super Admin started viewing the dashboard of "${target.name}" (${target.email}).`,
      targetTitle: target.name,
      targetId: target.id,
      severity: 'warning',
    },
  });

  return NextResponse.json({
    success: true,
    user: { id: target.id, name: target.name, role: target.role },
  });
}

// DELETE /api/auth/impersonate — stop impersonating and return to the real
// session. Safe to call unauthenticated: it only clears the impersonation
// cookie, reverting to whatever real session cookie is present.
export async function DELETE() {
  await clearImpersonationCookie();
  return NextResponse.json({ success: true });
}
