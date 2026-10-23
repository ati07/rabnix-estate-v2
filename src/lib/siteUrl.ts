// Canonical base URL for the site, used by metadata, the sitemap, robots, and
// absolute OG/Twitter image resolution. Resolved server-side only, so a plain
// (non-public) SITE_URL is used — NEXT_PUBLIC_* is avoided because it trips up
// the Vercel build. Set SITE_URL to the production domain
// (https://www.baybayt.com); falls back to Vercel's auto-injected deployment
// URL, then to localhost for local dev.
export function getSiteUrl(): string {
  const fromEnv = process.env.SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
