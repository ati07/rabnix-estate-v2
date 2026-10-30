/**
 * City/locality URL slug helper. Lives in its own dependency-free module (no
 * `server-only`) so it can be shared by both server code (cityLoader, sitemap)
 * and client components without dragging the DB layer into the client bundle.
 *
 * e.g. "New Delhi" -> "new-delhi", "Delhi & NCR" -> "delhi-and-ncr".
 */
export function cityToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
