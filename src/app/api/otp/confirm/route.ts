import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpForPhone, normalizePhone } from '@/lib/otp';
import { setContactVerifyCookie } from '@/lib/auth';

export const runtime = 'nodejs';

// POST /api/otp/confirm — verify a visitor's OTP and issue the contact-verify
// cookie. This does NOT sign anyone in; it only proves the visitor controls the
// number, which the gated contact-reveal endpoint then requires.
export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    const normalized = normalizePhone(phone || '');
    const code = String(otp || '').replace(/\D/g, '');

    if (normalized.length !== 10 || !code) {
      return NextResponse.json({ success: false, error: 'Please enter the code sent to your mobile.' }, { status: 400 });
    }

    const result = await verifyOtpForPhone(normalized, code);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error || 'Invalid code.' }, { status: 401 });
    }

    await setContactVerifyCookie(normalized);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('otp/confirm error', err);
    return NextResponse.json({ success: false, error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
