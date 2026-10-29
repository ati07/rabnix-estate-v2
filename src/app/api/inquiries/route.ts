import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeInquiry } from '@/lib/serialize';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/inquiries — admin: all; others: sent + received.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: true, inquiries: [] });

  const where = isAdminRole(user.role)
    ? {}
    : { OR: [{ sellerUserId: user.id }, { buyerUserId: user.id }] };

  const rows = await prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ success: true, inquiries: rows.map(serializeInquiry) });
}

// POST /api/inquiries — create an inquiry for a property.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const b = await req.json();

    if (!b.propertyId || !b.buyerName || !b.buyerPhone) {
      return NextResponse.json({ success: false, error: 'Property, name and phone are required.' }, { status: 400 });
    }

    const property = await prisma.property.findUnique({ where: { id: b.propertyId } });
    if (!property) return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId: property.id,
        propertyTitle: property.title,
        sellerUserId: property.postedByUserId ?? b.sellerUserId ?? undefined,
        buyerUserId: user?.id ?? b.buyerUserId ?? undefined,
        buyerName: b.buyerName,
        buyerPhone: b.buyerPhone,
        buyerEmail: b.buyerEmail || '',
        message: b.message || '',
        preferredTime: b.preferredTime || undefined,
      },
    });

    await prisma.property.update({
      where: { id: property.id },
      data: { inquiriesCount: { increment: 1 } },
    });

    await prisma.activityLog.create({
      data: {
        action: 'inquiry_received',
        actorName: b.buyerName,
        actorRole: 'Buyer',
        details: `New inquiry for "${property.title}".`,
        targetTitle: property.title,
        targetId: property.id,
        severity: 'info',
      },
    });

    return NextResponse.json({ success: true, inquiry: serializeInquiry(inquiry) });
  } catch (err: any) {
    console.error('POST /api/inquiries error', err);
    return NextResponse.json({ success: false, error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
