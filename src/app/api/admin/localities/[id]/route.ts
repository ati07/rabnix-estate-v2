import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH /api/admin/localities/:id  { city?, name?, thumbnail?, sortOrder? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.locality.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Locality not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { city?: string; name?: string; thumbnail?: string; sortOrder?: number } = {};
  if (typeof body?.city === 'string' && body.city.trim()) data.city = body.city.trim();
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.thumbnail === 'string' && body.thumbnail.trim()) data.thumbnail = body.thumbnail.trim();
  if (Number.isFinite(body?.sortOrder)) data.sortOrder = Number(body.sortOrder);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: 'Nothing to update.' }, { status: 400 });
  }

  // Guard the (city, name) uniqueness when either changes.
  const nextCity = data.city ?? existing.city;
  const nextName = data.name ?? existing.name;
  if (nextCity !== existing.city || nextName !== existing.name) {
    const clash = await prisma.locality.findUnique({ where: { city_name: { city: nextCity, name: nextName } } });
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { success: false, error: `"${nextName}" already exists for ${nextCity}.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.locality.update({ where: { id }, data });

  await prisma.activityLog.create({
    data: {
      action: 'locality_updated',
      actorName: user.name,
      actorRole: user.role.toUpperCase(),
      details: `Updated popular locality "${updated.name}" in ${updated.city}.`,
      targetTitle: updated.name,
      targetId: updated.id,
      severity: 'info',
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, locality: updated });
}

// DELETE /api/admin/localities/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.locality.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Locality not found.' }, { status: 404 });
  }

  await prisma.locality.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: 'locality_deleted',
      actorName: user.name,
      actorRole: user.role.toUpperCase(),
      details: `Removed popular locality "${existing.name}" in ${existing.city}.`,
      targetTitle: existing.name,
      targetId: existing.id,
      severity: 'warning',
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
