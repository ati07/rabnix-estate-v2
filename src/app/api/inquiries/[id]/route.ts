import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeInquiry } from '@/lib/serialize';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';

const VALID = ['new', 'contacted', 'scheduled', 'closed'];

// PATCH /api/inquiries/:id — seller or admin updates status.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const inq = await prisma.inquiry.findUnique({ where: { id } });
    if (!inq) return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });

    if (inq.sellerUserId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!VALID.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.inquiry.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true, inquiry: serializeInquiry(updated) });
  } catch (err: any) {
    console.error('PATCH /api/inquiries/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to update inquiry' }, { status: 500 });
  }
}
