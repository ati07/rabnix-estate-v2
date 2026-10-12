import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { User as DbUser } from '@prisma/client';
import type { UserProfile, UserRole } from '@/lib/types';

const COOKIE_NAME = 'baybayt_session';
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-insecure-secret-change-me'
);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  [key: string]: unknown;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// --- Contact-reveal phone verification ---------------------------------------
// A short-lived proof that the current visitor verified control of a mobile
// number via OTP. The gated contact-reveal endpoint requires this before it
// hands a seller's number to a non-owner, so contacts can't be harvested
// without a traceable, verified phone. One verification unlocks reveals for the
// cookie's lifetime (visitors shouldn't be re-prompted for every listing).
const CONTACT_COOKIE = 'baybayt_contact_verify';
const CONTACT_TTL_SECONDS = 60 * 30; // 30 minutes

export async function setContactVerifyCookie(phone: string) {
  const token = await new SignJWT({ phone, purpose: 'contact' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${CONTACT_TTL_SECONDS}s`)
    .sign(secret);
  const store = await cookies();
  store.set(CONTACT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CONTACT_TTL_SECONDS,
  });
}

/** Returns the verified phone from the contact-verify cookie, or null. */
export async function getContactVerifiedPhone(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CONTACT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== 'contact') return null;
    return typeof payload.phone === 'string' ? payload.phone : null;
  } catch {
    return null;
  }
}

/** Returns the currently authenticated user (public profile) or null. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  return toPublicProfile(user);
}

/** Strips passwordHash and shapes a DB user into the UserProfile the UI expects. */
export function toPublicProfile(user: DbUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as UserRole,
    city: user.city ?? undefined,
    avatar: user.avatar ?? undefined,
    companyName: user.companyName ?? undefined,
    reraNumber: user.reraNumber ?? undefined,
    isPhoneVerified: user.isPhoneVerified,
    isEmailVerified: user.isEmailVerified,
    isBlocked: user.isBlocked,
    blockedReason: user.blockedReason ?? undefined,
    blockedAt: user.blockedAt ?? undefined,
    lastActive: user.lastActive ?? undefined,
    createdAt: user.createdAt.toISOString().split('T')[0],
    // Preferred Agent directory profile.
    isPreferredAgent: user.isPreferredAgent,
    agencyLogo: user.agencyLogo ?? undefined,
    agentBadge: user.agentBadge ?? undefined,
    agentRating: user.agentRating ?? undefined,
    operatingSince: user.operatingSince ?? undefined,
    experienceYears: user.experienceYears ?? undefined,
    buyersServed: user.buyersServed ?? undefined,
    specializations: user.specializations,
    areasServed: user.areasServed,
    languages: user.languages,
    agentAbout: user.agentAbout ?? undefined,
  };
}
