import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, toPublicProfile } from '@/lib/auth';
import { isAdminRole, isSuperAdmin } from '@/lib/roles';
import { csvToArray } from '@/lib/catalogHelpers';
import type { UserRole } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_ROLES: UserRole[] = ['buyer', 'owner', 'agent', 'builder', 'admin', 'superadmin'];

// PATCH /api/users/:id — admin (or superadmin). Admins may block/unblock, edit
// profile fields and curate preferred agents; changing a user's ROLE is a master
// control reserved for superadmins (so an admin cannot escalate privileges).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me || !isAdminRole(me.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const body = await req.json();
    const data: any = {};
    const logs: any[] = [];

    if (typeof body.isBlocked === 'boolean') {
      data.isBlocked = body.isBlocked;
      data.blockedReason = body.isBlocked ? (body.blockedReason || 'Suspended by Admin for policy violation.') : null;
      data.blockedAt = body.isBlocked ? new Date().toISOString().split('T')[0] : null;
      logs.push({
        action: body.isBlocked ? 'user_blocked' : 'user_unblocked',
        actorName: me.name, actorRole: 'Admin',
        details: body.isBlocked
          ? `Suspended user "${target.name}" (${target.email}). Reason: ${body.blockedReason || 'Policy violation'}`
          : `Reinstated user "${target.name}" (${target.email}).`,
        targetTitle: target.name, targetId: target.id,
        severity: body.isBlocked ? 'danger' : 'success',
      });
    }

    if (body.role && VALID_ROLES.includes(body.role) && body.role !== target.role) {
      // Role changes are a master control: only a superadmin may reassign roles.
      if (!isSuperAdmin(me.role)) {
        return NextResponse.json({ success: false, error: 'Only a Super Admin can change a user\'s role.' }, { status: 403 });
      }
      data.role = body.role;
      logs.push({
        action: 'user_registered',
        actorName: me.name, actorRole: 'Super Admin',
        details: `Changed role of "${target.name}" (${target.email}) from ${target.role.toUpperCase()} to ${String(body.role).toUpperCase()}.`,
        targetTitle: target.name, targetId: target.id,
        severity: 'info',
      });
    }

    // Editable profile fields (admin-managed).
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.email === 'string' && body.email.trim()) {
      const normalizedEmail = body.email.toLowerCase().trim();
      if (normalizedEmail !== target.email) {
        const clash = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (clash) {
          return NextResponse.json({ success: false, error: 'Another account already uses this email.' }, { status: 409 });
        }
        data.email = normalizedEmail;
      }
    }
    if (typeof body.phone === 'string' && body.phone.trim()) {
      data.phone = body.phone.startsWith('+91') ? body.phone.trim() : `+91 ${body.phone.trim()}`;
    }
    if (typeof body.city === 'string') data.city = body.city.trim() || null;
    if (typeof body.companyName === 'string') data.companyName = body.companyName.trim() || null;
    if (typeof body.reraNumber === 'string') data.reraNumber = body.reraNumber.trim() || null;
    if (typeof body.password === 'string' && body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      data.passwordHash = await hashPassword(body.password);
    }

    // --- Preferred Agent curation (admin-managed) ---
    // Editorial fields (isPreferredAgent, agentBadge, agentRating) are admin-only.
    // The remaining marketing fields are also editable here, though agents can
    // self-edit most of them from their dashboard.
    if (typeof body.isPreferredAgent === 'boolean') {
      data.isPreferredAgent = body.isPreferredAgent;
      logs.push({
        action: body.isPreferredAgent ? 'agent_promoted' : 'agent_demoted',
        actorName: me.name, actorRole: 'Admin',
        details: body.isPreferredAgent
          ? `Promoted "${target.name}" (${target.email}) to the Preferred Agents directory.`
          : `Removed "${target.name}" (${target.email}) from the Preferred Agents directory.`,
        targetTitle: target.name, targetId: target.id,
        severity: body.isPreferredAgent ? 'success' : 'warning',
      });
    }
    if (typeof body.agentBadge === 'string') data.agentBadge = body.agentBadge.trim() || null;
    if (body.agentRating !== undefined) data.agentRating = body.agentRating === '' || body.agentRating === null ? null : Number(body.agentRating);
    if (typeof body.agencyLogo === 'string') data.agencyLogo = body.agencyLogo.trim() || null;
    if (body.operatingSince !== undefined) data.operatingSince = body.operatingSince === '' || body.operatingSince === null ? null : Number(body.operatingSince);
    if (body.experienceYears !== undefined) data.experienceYears = body.experienceYears === '' || body.experienceYears === null ? null : Number(body.experienceYears);
    if (typeof body.buyersServed === 'string') data.buyersServed = body.buyersServed.trim() || null;
    if (typeof body.agentAbout === 'string') data.agentAbout = body.agentAbout.trim() || null;
    if (body.specializations !== undefined) data.specializations = csvToArray(body.specializations);
    if (body.areasServed !== undefined) data.areasServed = csvToArray(body.areasServed);
    if (body.languages !== undefined) data.languages = csvToArray(body.languages);

    const updated = await prisma.user.update({ where: { id }, data });
    if (logs.length) await prisma.activityLog.createMany({ data: logs });

    return NextResponse.json({ success: true, user: toPublicProfile(updated) });
  } catch (err: any) {
    console.error('PATCH /api/users/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/:id — superadmin only (a master control).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me || !isSuperAdmin(me.role)) {
      return NextResponse.json({ success: false, error: 'Super Admin access required' }, { status: 403 });
    }
    if (me.id === id) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'user_blocked',
        actorName: me.name, actorRole: 'Super Admin',
        details: `Deleted user profile "${target.name}" (${target.email}) permanently.`,
        targetTitle: target.name, targetId: target.id, severity: 'danger',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/users/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
