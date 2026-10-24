import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activatePaidSubscription, verifyRazorpayWebhookSignature } from '@/lib/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/billing/webhook — server-to-server activation from Razorpay.
// This is the safety net for the client-driven /verify flow: if the buyer's
// browser drops after paying (UPI/netbanking redirects, flaky mobile), Razorpay
// still calls us here and we activate the pack. Point the Razorpay webhook at
// this URL and subscribe to `payment.captured` (and optionally `order.paid`),
// using the secret stored in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  // Signature is computed over the RAW body — read it as text, never parse first.
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    // Reject anything we can't authenticate (bad/missing signature, or the
    // secret isn't configured on our side).
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const type: string | undefined = event?.event;
  // `payment.captured` carries the order id on the payment entity; `order.paid`
  // carries it on the order entity. Support both.
  const orderId: string | null =
    event?.payload?.payment?.entity?.order_id ??
    event?.payload?.order?.entity?.id ??
    null;
  const paymentId: string | null = event?.payload?.payment?.entity?.id ?? null;

  try {
    if ((type === 'payment.captured' || type === 'order.paid') && orderId) {
      const sub = await prisma.subscription.findFirst({ where: { razorpayOrderId: orderId } });
      if (sub) {
        // Idempotent — a no-op if /verify already activated this subscription.
        await activatePaidSubscription(sub.id, paymentId);
      }
    }
  } catch (err) {
    // Log but still 200 below so Razorpay doesn't hammer retries; a failed
    // activation here is recoverable via the client /verify path.
    console.error('POST /api/billing/webhook activation error', err);
  }

  // Always acknowledge events we authenticated, including ones we don't act on,
  // so Razorpay marks delivery successful and stops retrying.
  return NextResponse.json({ ok: true });
}
