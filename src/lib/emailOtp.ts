import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Email verification codes for sign-up. Mirrors src/lib/otp.ts (the phone
// flow): 6 digits, hashed at rest, expire in 5 minutes, single-use, capped at a
// few verify attempts, with a resend cooldown. Keyed by the normalized email.
// There is no email sign-in — this only proves control of an email before an
// account is created.

const CODE_LENGTH = 6;
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5; // wrong-code tries before a code is burned
const RESEND_COOLDOWN_MS = 30 * 1000; // min gap between sends to one email

/** Lowercases and trims an email to a canonical form for storage/lookup. */
export function normalizeEmail(input: string): string {
  return String(input).toLowerCase().trim();
}

function generateCode(): string {
  const n = Math.floor(Math.random() * 10 ** CODE_LENGTH);
  return n.toString().padStart(CODE_LENGTH, '0');
}

export interface CreateEmailOtpResult {
  ok: boolean;
  code?: string; // plaintext, for the email sender only — never persisted/returned to client
  error?: string;
  retryAfterMs?: number;
}

/** Creates (and supersedes prior) a verification code for an email, returning
 *  the plaintext code for the email sender. Enforces a resend cooldown. */
export async function createOtpForEmail(email: string): Promise<CreateEmailOtpResult> {
  const recent = await prisma.emailOtpCode.findFirst({
    where: { email, consumed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (recent) {
    const since = Date.now() - recent.createdAt.getTime();
    if (since < RESEND_COOLDOWN_MS) {
      return { ok: false, error: 'Please wait before requesting another code.', retryAfterMs: RESEND_COOLDOWN_MS - since };
    }
  }

  // Supersede any outstanding codes for this email so only the newest is valid.
  await prisma.emailOtpCode.updateMany({
    where: { email, consumed: false },
    data: { consumed: true },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.emailOtpCode.create({
    data: { email, codeHash, expiresAt: new Date(Date.now() + EXPIRY_MS) },
  });

  return { ok: true, code };
}

export interface VerifyEmailOtpResult {
  ok: boolean;
  error?: string;
}

/** Validates a submitted code against the newest live code for the email.
 *  Consumes the code on success; burns it after too many wrong attempts. */
export async function verifyOtpForEmail(email: string, submitted: string): Promise<VerifyEmailOtpResult> {
  const code = submitted.replace(/\D/g, '');
  const record = await prisma.emailOtpCode.findFirst({
    where: { email, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { ok: false, error: 'This code has expired. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtpCode.update({ where: { id: record.id }, data: { consumed: true } });
    return { ok: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  const match = await bcrypt.compare(code, record.codeHash);
  if (!match) {
    await prisma.emailOtpCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: 'Incorrect code. Please try again.' };
  }

  await prisma.emailOtpCode.update({ where: { id: record.id }, data: { consumed: true } });
  return { ok: true };
}
