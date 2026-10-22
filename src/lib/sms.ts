import 'server-only';

// Pluggable SMS delivery for OTP sign-in.
//
// The real estate app targets India. Two providers are supported, plus a
// console fallback so the whole OTP flow is testable end-to-end for free until
// credentials are set.
//
//  • renflair — a DLT-free OTP gateway (sms.renflair.in). A single GET carries
//    the API key, the 10-digit number, and our code. This is the current live
//    provider because it needs no DLT registration. To go live:
//      SMS_PROVIDER=renflair
//      RENFLAIR_API_KEY=<API key from the Renflair dashboard>
//
//  • msg91 — India-first, cheapest for +91, but requires DLT-registered
//    templates. To go live:
//      SMS_PROVIDER=msg91
//      MSG91_AUTH_KEY=<authkey from MSG91 dashboard>
//      MSG91_OTP_TEMPLATE_ID=<id of an approved MSG91 "OTP" template containing ##OTP##>
//    The DLT header/sender is bound to the template in the MSG91 panel, so no
//    separate sender id is needed here.

export interface SmsResult {
  sent: boolean;
  /** The code, echoed back ONLY in non-production console-delivery mode so the
   *  flow can be tested without an SMS account. Never populated in production. */
  devCode?: string;
}

const isProd = process.env.NODE_ENV === 'production';

/** Sends a 6-digit OTP to an Indian mobile number (last-10 digits, no +91). */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();

  if (provider === 'renflair' && process.env.RENFLAIR_API_KEY) {
    await sendViaRenflair(phone, code);
    return { sent: true };
  }

  if (provider === 'msg91' && process.env.MSG91_AUTH_KEY) {
    await sendViaMsg91(phone, code);
    return { sent: true };
  }

  // No provider configured → dev fallback. Log to the server console so OTP
  // sign-in is usable locally, and surface the code in the response only when
  // not in production.
  console.log(
    `[OTP] +91 ${phone} → code ${code} (no SMS provider configured; console delivery)`
  );
  return { sent: true, devCode: isProd ? undefined : code };
}

/** Renflair OTP gateway (https://sms.renflair.in/V1.php). A DLT-free OTP API:
 *  one GET with the API key, the 10-digit number (no country code), and our
 *  code. We generate and verify the code ourselves (see src/lib/otp.ts);
 *  Renflair only delivers it. The gateway answers with JSON and can return
 *  HTTP 200 for a logical failure, so we inspect the body and throw on failure
 *  rather than falsely claim it sent — the caller then surfaces an error. */
async function sendViaRenflair(phone: string, code: string): Promise<void> {
  const apiKey = process.env.RENFLAIR_API_KEY!;

  const url = new URL('https://sms.renflair.in/V1.php');
  url.searchParams.set('API', apiKey);
  url.searchParams.set('PHONE', phone); // normalized to last-10 digits by the caller
  url.searchParams.set('OTP', code);

  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON body — fall through to the HTTP check below.
  }

  if (!res.ok) {
    throw new Error(`Renflair send failed (${res.status}): ${text.slice(0, 200) || 'no response body'}`);
  }

  // Renflair signals logical failure in the body (HTTP is still 200). Treat an
  // explicit error/false status as a failure; anything else is accepted.
  const status = String(data?.status ?? data?.Status ?? '').toLowerCase();
  const isError = data?.status === false || status === 'error' || status === 'false' || status === 'failed';
  if (isError) {
    throw new Error(`Renflair send failed: ${data?.message || data?.msg || text.slice(0, 200) || 'unknown error'}`);
  }
}

/** MSG91 OTP API (v5). We generate and verify the code ourselves (see
 *  src/lib/otp.ts); MSG91 only delivers it, so we pass our own `otp` rather
 *  than letting MSG91 generate one. Requires an approved "OTP" template that
 *  contains an ##OTP## variable. MSG91 returns HTTP 200 even for logical
 *  failures (with `type: "error"`), so we check the body too and throw on
 *  failure — the caller then surfaces an error instead of claiming it sent. */
async function sendViaMsg91(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!templateId) {
    throw new Error('MSG91_OTP_TEMPLATE_ID is not set.');
  }

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  // MSG91 expects the country code prefixed and no spaces, e.g. 919876543210.
  url.searchParams.set('mobile', `91${phone}`);
  url.searchParams.set('otp', code);

  const res = await fetch(url, {
    method: 'POST',
    headers: { authkey: authKey, 'Content-Type': 'application/json' },
  });

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok || data?.type === 'error') {
    throw new Error(`MSG91 send failed (${res.status}): ${data?.message || 'unknown error'}`);
  }
}
