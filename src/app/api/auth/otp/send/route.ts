import { NextRequest, NextResponse } from 'next/server';
import { createOtpForPhone, normalizePhone, findUserByPhone } from '@/lib/otp';
import { sendOtpSms } from '@/lib/sms';

export const runtime = 'nodejs';

// POST /api/auth/otp/send — request a mobile OTP for sign-in.
// Only sends to a phone that belongs to an existing account (this is a sign-in
// flow, not registration). Codes are generated/stored by src/lib/otp.ts and
// delivered via src/lib/sms.ts (console in dev, MSG91 in prod).
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const normalized = normalizePhone(phone || '');

    if (normalized.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const user = await findUserByPhone(normalized);

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this mobile number. Please sign up first.' }, { status: 404 });
    }
    if (user.isBlocked) {
      return NextResponse.json({
        success: false,
        error: `Your account has been suspended by BayBayt Admin. Reason: ${user.blockedReason || 'Policy violation. Contact support.'}`,
      }, { status: 403 });
    }

    const created = await createOtpForPhone(normalized);
    if (!created.ok || !created.code) {
      return NextResponse.json({ success: false, error: created.error || 'Could not send code.' }, { status: 429 });
    }

    const delivery = await sendOtpSms(normalized, created.code);

    // devCode is only present in non-production console-delivery mode.
    return NextResponse.json({ success: true, devCode: delivery.devCode });
  } catch (err: any) {
    console.error('otp/send error', err);
    return NextResponse.json({ success: false, error: 'Could not send the verification code. Please try again.' }, { status: 500 });
  }
}
