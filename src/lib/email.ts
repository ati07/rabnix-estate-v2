import 'server-only';

// Pluggable email delivery for sign-up verification codes.
//
// Mirrors src/lib/sms.ts: one real provider plus a console fallback so the
// whole email-verification flow is testable end-to-end for free until
// credentials are set.
//
//  • resend — https://resend.com. A single HTTPS POST carries the API key, the
//    from/to addresses and the HTML body; no SMTP, no new npm dependency. To go
//    live:
//      EMAIL_PROVIDER=resend
//      RESEND_API_KEY=<API key from the Resend dashboard>
//      EMAIL_FROM="BayBayt <verify@yourdomain.com>"   (must be a verified sender)
//
// With no provider configured the code is logged to the server console and
// echoed back to the caller ONLY in non-production, exactly like the SMS path.

export interface EmailResult {
  sent: boolean;
  /** The code, echoed back ONLY in non-production console-delivery mode so the
   *  flow can be tested without an email account. Never populated in production. */
  devCode?: string;
}

const isProd = process.env.NODE_ENV === 'production';

/** Sends a 6-digit email-verification code to `email`. */
export async function sendVerificationEmail(email: string, code: string): Promise<EmailResult> {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();

  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    await sendViaResend(email, `${code} is your BayBayt verification code`, verificationHtml(code));
    return { sent: true };
  }

  // No provider configured → dev fallback. Log to the server console so email
  // verification is usable locally, and surface the code in the response only
  // when not in production.
  console.log(
    `[EMAIL] ${email} → verification code ${code} (no email provider configured; console delivery)`
  );
  return { sent: true, devCode: isProd ? undefined : code };
}

export interface ListingAlertItem {
  title: string;
  priceFormatted: string;
  locality: string;
  city: string;
  bhk?: number;
  category?: string;
  url: string; // absolute listing URL
}

/** Sends a "new matching listings" digest for one saved search. Mirrors the
 *  verification path: real send via Resend when configured, console fallback
 *  otherwise. Returns { sent } so the cron can decide whether to advance the
 *  search's notified watermark. */
export async function sendListingAlertEmail(
  email: string,
  args: { searchName: string; items: ListingAlertItem[]; browseUrl: string },
): Promise<EmailResult> {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
  const subject =
    args.items.length === 1
      ? `New listing for "${args.searchName}" on BayBayt`
      : `${args.items.length} new listings for "${args.searchName}" on BayBayt`;

  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    await sendViaResend(email, subject, listingAlertHtml(args));
    return { sent: true };
  }

  console.log(
    `[EMAIL] ${email} → ${args.items.length} new listing(s) for "${args.searchName}" (console delivery; no email provider configured)`
  );
  return { sent: true };
}

/** Resend email API (https://api.resend.com/emails). Returns 2xx with an id on
 *  success; any non-2xx is a failure we throw on so the caller surfaces an
 *  error rather than falsely claiming it sent. */
async function sendViaResend(email: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY!;
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set.');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [email], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Resend send failed (${res.status}): ${text.slice(0, 200) || 'no response body'}`);
  }
}

/** Escapes text interpolated into email HTML (listing titles are user content). */
function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

/** New-listing digest email (inline-styled, no external assets). */
function listingAlertHtml(args: { searchName: string; items: ListingAlertItem[]; browseUrl: string }): string {
  const rows = args.items
    .map(
      (it) => `<a href="${esc(it.url)}" style="display:block;text-decoration:none;color:inherit;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;margin:0 0 10px">
    <div style="font-size:16px;font-weight:800;color:#0E7C5D">${esc(it.priceFormatted)}</div>
    <div style="font-size:14px;font-weight:600;color:#0F2A43;margin:2px 0">${esc(it.title)}</div>
    <div style="font-size:12px;color:#64748B">${esc([it.bhk ? `${it.bhk} BHK` : '', it.category || '', [it.locality, it.city].filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</div>
  </a>`,
    )
    .join('');

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#172033">
  <div style="font-size:18px;font-weight:800;color:#0F2A43;margin-bottom:4px">BayBayt</div>
  <p style="font-size:14px;color:#334155;margin:0 0 18px">New owner-direct ${args.items.length === 1 ? 'listing matches' : 'listings match'} your saved search <strong>${esc(args.searchName)}</strong>:</p>
  ${rows}
  <a href="${esc(args.browseUrl)}" style="display:inline-block;margin-top:8px;background:#18A67D;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:10px">See all matches</a>
  <p style="font-size:11px;color:#94A3B8;margin:22px 0 0">You're getting this because you enabled alerts for this search on BayBayt. Open the search on the Properties page and tap the bell to turn alerts off.</p>
</div>`;
}

/** Minimal, inline-styled verification email (no external assets). */
function verificationHtml(code: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#172033">
  <div style="font-size:18px;font-weight:800;color:#0F2A43;margin-bottom:8px">BayBayt</div>
  <p style="font-size:14px;color:#64748B;margin:0 0 20px">Use this code to verify your email and finish creating your account. It expires in 5 minutes.</p>
  <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0E7C5D;background:#E7F6F1;border:1px solid #18A67D33;border-radius:12px;padding:16px;text-align:center">${code}</div>
  <p style="font-size:12px;color:#94A3B8;margin:20px 0 0">If you didn't request this, you can safely ignore this email.</p>
</div>`;
}
