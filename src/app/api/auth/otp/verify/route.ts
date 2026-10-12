import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie, toPublicProfile } from '@/lib/auth';
import { verifyOtpForPhone, normalizePhone, findUserByPhone } from '@/lib/otp';
import type { UserRole } from '@/lib/types';

export const runtime = 'nodejs';

// POST /api/auth/otp/verify — verify a mobile OTP and open a session.
// On success the phone is marked verified (this is proof of control) and a JWT
// session cookie is issued, mirroring the password login route.
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

    const user = await findUserByPhone(normalized);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with this mobile number.' }, { status: 404 });
    }
    if (user.isBlocked) {
      return NextResponse.json({
        success: false,
        error: `Your account has been suspended by BayBayt Admin. Reason: ${user.blockedReason || 'Policy violation. Contact support.'}`,
      }, { status: 403 });
    }

    // A successful OTP proves control of the number — persist verification.
    const fresh = user.isPhoneVerified
      ? user
      : await prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: true } });

    const token = await createSessionToken({ userId: fresh.id, role: fresh.role as UserRole });
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: toPublicProfile(fresh) });
  } catch (err: any) {
    console.error('otp/verify error', err);
    return NextResponse.json({ success: false, error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
