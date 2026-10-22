import { NextRequest, NextResponse } from 'next/server';
import { createOtpForPhone, normalizePhone } from '@/lib/otp';
import { sendOtpSms } from '@/lib/sms';

export const runtime = 'nodejs';

// POST /api/otp/request — send an OTP to verify a visitor's own mobile number.
// Unlike /api/auth/otp/send (sign-in), this works for ANY number, because the
// person sending an inquiry may be a guest. Pairs with /api/otp/confirm, which
// sets the short-lived contact-verify cookie the reveal endpoint requires.
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const normalized = normalizePhone(phone || '');

    if (normalized.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const created = await createOtpForPhone(normalized);
    if (!created.ok || !created.code) {
      return NextResponse.json({ success: false, error: created.error || 'Could not send code.' }, { status: 429 });
    }

    const delivery = await sendOtpSms(normalized, created.code);
    // devCode is only present in non-production console-delivery mode.
    return NextResponse.json({ success: true, devCode: delivery.devCode });
  } catch (err: any) {
    console.error('otp/request error', err);
    // In non-production, surface the provider's real reason (e.g. "SMS BALANCE
    // UNAVAILABLE") so delivery issues are diagnosable during setup.
    const detail = process.env.NODE_ENV !== 'production' && err?.message ? ` (${err.message})` : '';
    return NextResponse.json({ success: false, error: `Could not send the verification code. Please try again.${detail}` }, { status: 500 });
  }
}
