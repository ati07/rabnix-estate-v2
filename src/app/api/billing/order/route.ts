import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getPack, resolvePrice, createRazorpayOrder, devBypassEnabled, razorpayConfigured } from '@/lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/billing/order — start a purchase. Creates a pending Subscription row
// and (in production / when keys are set) a Razorpay order the client checks out.
// In dev without keys, returns devBypass:true so the flow can be tested end-to-end.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please sign in to buy a plan.' }, { status: 401 });
    }
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admins have unlimited listings and do not need a plan.' },
        { status: 400 },
      );
    }
    if (user.isBlocked) {
      return NextResponse.json({ success: false, error: 'Blocked accounts cannot buy plans.' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { packId?: string; city?: string };
    const pack = getPack(body.packId ?? '');
    if (!pack) {
      return NextResponse.json({ success: false, error: 'Unknown pack.' }, { status: 400 });
    }
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    if (!city) {
      return NextResponse.json({ success: false, error: 'Please choose a city for this pack.' }, { status: 400 });
    }
    // Price is resolved server-side from the city matrix — never trust a client amount.
    const priced = resolvePrice(pack.id, city);
    if (!priced) {
      return NextResponse.json({ success: false, error: 'Could not price this pack for that city.' }, { status: 400 });
    }

    const bypass = devBypassEnabled();

    let razorpayOrderId: string | null = null;
    if (!bypass) {
      if (!razorpayConfigured()) {
        return NextResponse.json(
          { success: false, error: 'Payments are not configured. Please try again later.' },
          { status: 503 },
        );
      }
      const order = await createRazorpayOrder({
        amount: priced.amount,
        currency: 'INR',
        receipt: `rbx_${Date.now()}`,
        notes: { userId: user.id, packId: pack.id, city },
      });
      razorpayOrderId = order.id;
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: pack.id,
        city,
        listingsQuota: pack.listings,
        amount: priced.amount,
        currency: 'INR',
        status: 'created',
        razorpayOrderId,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      devBypass: bypass,
      order: bypass
        ? null
        : {
            id: razorpayOrderId,
            amount: priced.amount,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
          },
      plan: { id: pack.id, name: pack.name, listings: pack.listings, priceRupees: priced.rupees, city },
      prefill: { name: user.name, email: user.email, contact: user.phone },
    });
  } catch (err: any) {
    console.error('POST /api/billing/order error', err);
    return NextResponse.json({ success: false, error: 'Could not start the purchase.' }, { status: 500 });
  }
}
