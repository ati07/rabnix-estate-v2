import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Mobile OTP sign-in flow. Codes are 6 digits, hashed at rest, expire in 5
// minutes, single-use, and capped at a few verify attempts. Requesting a new
// code supersedes the phone's prior unconsumed codes.

const CODE_LENGTH = 6;
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5; // wrong-code tries before a code is burned
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between sends to one phone

/** Normalizes any Indian mobile input to its last 10 digits. */
export function normalizePhone(input: string): string {
  return String(input).replace(/\D/g, '').slice(-10);
}

/** Finds a user by mobile number, tolerant of how the phone is stored.
 *  Stored phones vary in formatting (seeded demo users keep internal spaces
 *  like "+91 98765 43210", while registrations store "+91 9876543210"), so a
 *  raw `contains` on the 10-digit string can miss. We narrow with a loose
 *  last-5-digit filter, then confirm on a fully normalized comparison. */
export async function findUserByPhone(normalized: string) {
  const candidates = await prisma.user.findMany({
    where: { phone: { contains: normalized.slice(-5) } },
  });
  return candidates.find((u) => normalizePhone(u.phone) === normalized) ?? null;
}

function generateCode(): string {
  // Uniform 6-digit code, zero-padded (avoids Math.random bias toward shorter).
  const n = Math.floor(Math.random() * 10 ** CODE_LENGTH);
  return n.toString().padStart(CODE_LENGTH, '0');
}

export interface CreateOtpResult {
  ok: boolean;
  code?: string; // plaintext, for the SMS sender only — never persisted/returned to client
  error?: string;
  retryAfterMs?: number;
}

/** Creates (and supersedes prior) an OTP for a phone, returning the plaintext
 *  code for the SMS sender. Enforces a resend cooldown. */
export async function createOtpForPhone(phone: string): Promise<CreateOtpResult> {
  const recent = await prisma.otpCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    const since = Date.now() - recent.createdAt.getTime();
    if (since < RESEND_COOLDOWN_MS) {
      return { ok: false, error: 'Please wait before requesting another code.', retryAfterMs: RESEND_COOLDOWN_MS - since };
    }
  }

  // Supersede any outstanding codes for this phone so only the newest is valid.
  await prisma.otpCode.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.otpCode.create({
    data: { phone, codeHash, expiresAt: new Date(Date.now() + EXPIRY_MS) },
  });

  return { ok: true, code };
}

export interface VerifyOtpResult {
  ok: boolean;
  error?: string;
}

/** Validates a submitted code against the newest live OTP for the phone.
 *  Consumes the code on success; burns it after too many wrong attempts. */
export async function verifyOtpForPhone(phone: string, submitted: string): Promise<VerifyOtpResult> {
  const code = submitted.replace(/\D/g, '');
  const record = await prisma.otpCode.findFirst({
    where: { phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, error: 'This code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { consumed: true } });
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: 'Incorrect code. Please try again.' };
  }

  await prisma.otpCode.update({ where: { id: record.id }, data: { consumed: true } });
  return { ok: true };
}
