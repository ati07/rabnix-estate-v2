import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOtpForEmail, normalizeEmail } from '@/lib/emailOtp';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

// POST /api/auth/email-otp/send — send a verification code to an email during
// sign-up. Rejects an email that already has an account (so the user finds out
// before entering a code), then generates/stores the code (src/lib/emailOtp.ts)
// and delivers it (src/lib/email.ts: console in dev, Resend in prod).
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalized = normalizeEmail(email || '');

    if (!normalized || !normalized.includes('@')) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 });
    }

    const created = await createOtpForEmail(normalized);
    if (!created.ok || !created.code) {
      return NextResponse.json({ success: false, error: created.error || 'Could not send code.' }, { status: 429 });
    }

    const delivery = await sendVerificationEmail(normalized, created.code);

    // devCode is only present in non-production console-delivery mode.
    return NextResponse.json({ success: true, devCode: delivery.devCode });
  } catch (err: any) {
    console.error('email-otp/send error', err);
    // In non-production, surface the provider's real reason so delivery issues
    // are diagnosable during setup.
    const detail = process.env.NODE_ENV !== 'production' && err?.message ? ` (${err.message})` : '';
    return NextResponse.json({ success: false, error: `Could not send the verification code. Please try again.${detail}` }, { status: 500 });
  }
}
