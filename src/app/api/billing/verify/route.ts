import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getPack, verifyRazorpaySignature, devBypassEnabled, activatePaidSubscription } from '@/lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/billing/verify — confirm a payment and activate the pack.
// In production verifies the Razorpay signature; in dev-bypass mode activates
// directly. Sets expiresAt = now + plan validity. Idempotent-ish: re-verifying an
// already-active subscription is a no-op success.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please sign in.' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      subscriptionId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    if (!body.subscriptionId) {
      return NextResponse.json({ success: false, error: 'Missing subscription.' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: body.subscriptionId } });
    if (!subscription || subscription.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Subscription not found.' }, { status: 404 });
    }
    if (subscription.status === 'active') {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const pack = getPack(subscription.planId);
    if (!pack) {
      return NextResponse.json({ success: false, error: 'Unknown pack.' }, { status: 400 });
    }

    const bypass = devBypassEnabled();

    if (!bypass) {
      const ok = verifyRazorpaySignature({
        orderId: body.razorpay_order_id ?? '',
        paymentId: body.razorpay_payment_id ?? '',
        signature: body.razorpay_signature ?? '',
      });
      // The order id must also match the one we created for this subscription.
      if (!ok || body.razorpay_order_id !== subscription.razorpayOrderId) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'failed' },
        });
        return NextResponse.json({ success: false, error: 'Payment verification failed.' }, { status: 400 });
      }
    }

    const paymentId = body.razorpay_payment_id ?? (bypass ? 'dev_bypass' : null);
    const result = await activatePaidSubscription(subscription.id, paymentId);
    if (!result.ok || !result.subscription) {
      return NextResponse.json({ success: false, error: 'Could not activate the pack.' }, { status: 500 });
    }
    const activated = result.subscription;

    return NextResponse.json({
      success: true,
      alreadyActive: result.alreadyActive,
      subscription: {
        id: activated.id,
        planId: activated.planId,
        listingsQuota: activated.listingsQuota,
        expiresAt: activated.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err: any) {
    console.error('POST /api/billing/verify error', err);
    return NextResponse.json({ success: false, error: 'Could not verify the payment.' }, { status: 500 });
  }
}
