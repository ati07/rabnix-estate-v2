# MSG91 OTP Integration — BayBayt Setup Guide

_Last updated: 2026-10-12_

## How MSG91 fits

BayBayt generates, hashes, stores, and verifies every OTP itself (`src/lib/otp.ts` + the `OtpCode` table). MSG91 is only the delivery pipe — it carries the SMS to the phone. Nothing about the verification logic changes when you switch it on.

The same OTP flow powers two features:

- **Phone sign-in** — logging in with a mobile number instead of a password.
- **Contact-reveal verification** — a visitor verifies their own mobile in a popup before a seller's phone number is shown (anti-scraping).

Today both run in **console-delivery mode**: with no SMS provider set, the code is printed to the server console and returned as a `devCode` in the API response (never in production), so the flow is fully testable for free. Turning on MSG91 just swaps that console step for a real SMS. The four steps below are all you need.

## Step 1 — Finish DLT registration (do this first)

India's TRAI rules require **DLT (Distributed Ledger Technology) registration** before any transactional SMS will deliver to an Indian number. This is a legal requirement, not an MSG91 one — every provider (MSG91, Twilio, anyone) needs it. It takes roughly **1–3 working days** to clear, so start here.

Inside your MSG91 dashboard (MSG91 provides a DLT onboarding flow, or you register on a DLT portal such as Jio/Vodafone/Airtel and link it):

1. **Register the Principal Entity** — your business, verified with GST / company documents. You get an Entity ID.
2. **Register a Header (Sender ID)** — the 6-character alphanumeric ID the SMS comes from, e.g. `BAYBYT`. Pick the **Transactional / Service** category for OTP.
3. **Register an OTP content template** — the exact message text with a variable placeholder, e.g.
    - `Your BayBayt verification code is {#var#}. Do not share it with anyone.`
    - Submit it under the **OTP** template type. Once approved you get a **DLT template ID**.
4. **Link the DLT entity/template inside MSG91** so MSG91 knows which header and template to send under.

You cannot send a single real OTP until the header and an OTP template are **approved**. Until then, leave `SMS_PROVIDER` empty and keep using console delivery for testing.

## Step 2 — Get your MSG91 credentials

From the MSG91 dashboard, collect two values the app needs:

| Value | Where to find it | Env var it maps to |
| --- | --- | --- |
| **Auth Key** | Dashboard → Settings → API → *Auth Key* (one per account) | `MSG91_AUTH_KEY` |
| **OTP Template ID** | Dashboard → OTP section → your approved OTP template | `MSG91_OTP_TEMPLATE_ID` |

The app uses MSG91's **OTP API** (`https://control.msg91.com/api/v5/otp`) and passes BayBayt's own code as the `otp` value — so the MSG91 OTP template must contain the `##OTP##` variable (that is the placeholder MSG91 substitutes the code into). If your template uses a different variable name, update it to `##OTP##`, or MSG91 will reject the send.

Keep the Auth Key secret — it is a server-side credential and must never appear in client code or the repo.

## Step 3 — Set the environment variables

Set three variables. Locally, add them to `.env`; in production, add the same three in **Vercel → Project → Settings → Environment Variables**.

```
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=<your auth key from Step 2>
MSG91_OTP_TEMPLATE_ID=<your approved OTP template id from Step 2>
```

How the switch behaves:

- `SMS_PROVIDER` **empty or unset** → console delivery (free dev mode, `devCode` returned outside production). This is the current state.
- `SMS_PROVIDER=msg91` **with** a non-empty `MSG91_AUTH_KEY` → real SMS through MSG91.

So flipping between the two is just setting or clearing `SMS_PROVIDER`. The matching entries already exist as placeholders in `.env.example` (lines 42–53) — copy them into your real `.env` and fill in the values.

## Step 4 — Restart and test

1. **Restart the dev server** (`npm run dev`) so the new env vars are picked up. On Vercel, redeploy after adding the variables.
2. Open a property and submit an inquiry (or use phone sign-in) to trigger the **OTP popup**.
3. Enter a real **+91** number you control and request the code.
4. Once `SMS_PROVIDER=msg91` is live, the server no longer returns a `devCode` and the popup no longer prefills it — the code arrives as a real SMS. Enter it to verify.
5. Confirm the seller's contact reveals only after a successful verification.

If you still see a dev code prefilled, `SMS_PROVIDER` is not set to `msg91` or `MSG91_AUTH_KEY` is empty — the app fell back to console delivery.

## Step 5 — Troubleshooting

MSG91 returns HTTP 200 even for logical failures (`type: "error"` in the body), which the adapter already detects and surfaces as an error. Common failures:

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `MSG91_OTP_TEMPLATE_ID is not set` | Env var missing | Set `MSG91_OTP_TEMPLATE_ID` and restart |
| MSG91 error: invalid/unknown template | Template ID wrong, or template not approved | Use the exact approved OTP template ID; wait for DLT approval |
| MSG91 error: authentication failed | Wrong or inactive Auth Key | Re-copy the Auth Key from Settings → API |
| SMS never arrives (no API error) | DLT header/template still pending, or number not on a trial-allowed list | Finish DLT approval; on a trial account, add the number to verified/test numbers |
| Still getting a `devCode` | `SMS_PROVIDER` not `msg91`, or `MSG91_AUTH_KEY` empty | Set both; restart the server |
| Code rejected as invalid | Template variable is not `##OTP##` | Edit the MSG91 template to use `##OTP##` |

## Reference — code touch-points

No code changes are needed to go live; the integration is purely environment-driven.

- `src/lib/sms.ts` — the pluggable SMS adapter. When `SMS_PROVIDER=msg91`, `sendViaMsg91()` calls the MSG91 OTP API (`/api/v5/otp`), passing our own `otp`. Otherwise it logs to the console and returns a `devCode` (non-production only).
- `src/lib/otp.ts` — generates, hashes, stores, and verifies the codes (`OtpCode` table); shared by sign-in and contact-reveal.
- `.env.example` (lines 42–53) — documented placeholders for `SMS_PROVIDER`, `MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`.
