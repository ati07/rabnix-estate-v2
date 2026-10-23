import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, setSessionCookie, toPublicProfile } from '@/lib/auth';
import { verifyOtpForPhone, normalizePhone } from '@/lib/otp';
import { verifyOtpForEmail, normalizeEmail } from '@/lib/emailOtp';
import type { UserRole } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_ROLES: UserRole[] = ['buyer', 'owner', 'agent', 'builder'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, city, companyName, reraNumber, phoneOtp, emailOtp } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, phone and password are required.' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    if (!phoneOtp || !emailOtp) {
      return NextResponse.json({ success: false, error: 'Mobile and email verification codes are required.' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Prove control of BOTH the phone and the email before the account exists.
    // Phone is checked first so that a wrong phone code doesn't burn the email
    // code (and vice-versa the user only re-sends the one that failed).
    const normalizedPhone = normalizePhone(phone);
    const phoneCheck = await verifyOtpForPhone(normalizedPhone, String(phoneOtp));
    if (!phoneCheck.ok) {
      return NextResponse.json({ success: false, error: `Mobile verification failed. ${phoneCheck.error || ''}`.trim() }, { status: 401 });
    }
    const emailCheck = await verifyOtpForEmail(normalizedEmail, String(emailOtp));
    if (!emailCheck.ok) {
      return NextResponse.json({ success: false, error: `Email verification failed. ${emailCheck.error || ''}`.trim() }, { status: 401 });
    }

    // Never allow self-registration as admin.
    const safeRole: UserRole = VALID_ROLES.includes(role) ? role : 'buyer';

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
        passwordHash: await hashPassword(password),
        role: safeRole,
        city: city || 'Bangalore',
        companyName: companyName || undefined,
        reraNumber: reraNumber || undefined,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'user_registered',
        actorName: user.name,
        actorRole: safeRole.toUpperCase(),
        details: `New account registered as ${safeRole.toUpperCase()} in ${user.city}.`,
        targetTitle: user.name,
        targetId: user.id,
        severity: 'success',
      },
    });

    const token = await createSessionToken({ userId: user.id, role: user.role as UserRole });
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: toPublicProfile(user) });
  } catch (err: any) {
    console.error('register error', err);
    return NextResponse.json({ success: false, error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
