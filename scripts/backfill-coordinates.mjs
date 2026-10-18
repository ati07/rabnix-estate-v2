/**
 * backfill-coordinates.mjs — one-off helper to geocode existing listings that
 * have no saved `coordinates`, so they can appear on the discovery map.
 *
 * SAFE BY DEFAULT: this is a DRY RUN unless you pass --commit. It never touches
 * rows that already have coordinates, rate-limits its calls, and prints a
 * per-row report so you can review before writing anything.
 *
 *   # preview what WOULD happen (no DB writes, no cost beyond geocode lookups):
 *   node scripts/backfill-coordinates.mjs
 *
 *   # actually write resolved coordinates back:
 *   node scripts/backfill-coordinates.mjs --commit
 *
 *   # options:
 *   --limit=50        only process the first N candidates (default: all)
 *   --delay=200       ms between geocode calls (default: 200 → ~5 req/s)
 *   --city="Lucknow"  only backfill a single city
 *
 * REQUIRES a server-side Geocoding key in env (NOT the NEXT_PUBLIC browser key):
 *   GOOGLE_MAPS_SERVER_API_KEY=...        (preferred)
 *   # falls back to GOOGLE_MAP_KEY if the above is unset.
 * The key must have the "Geocoding API" enabled and should be IP/none-referrer
 * restricted (it is used server-side only — never ship it to the browser).
 *
 * Geocoding is billed per request. Review pricing before a large run:
 *   https://mapsplatform.google.com/intl/en_in/pricing/
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const getOpt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const LIMIT = parseInt(getOpt('limit', '0'), 10) || 0;
const DELAY_MS = parseInt(getOpt('delay', '200'), 10) || 200;
const ONLY_CITY = getOpt('city', '');

const API_KEY = (process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAP_KEY || '').trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Same validation as src/lib/maps/config.ts normalizeCoordinates. */
function normalize(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null; // null island
  return { lat, lng };
}

/** Build the most specific address string we can for a listing. */
function addressFor(p) {
  const parts = [p.address, p.subLocality, p.locality, p.city, 'India'].filter(Boolean);
  // de-dup consecutive identical parts (e.g. address already contains locality)
  return [...new Set(parts)].join(', ');
}

async function geocode(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query,
  )}&region=in&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
    const { lat, lng } = data.results[0].geometry.location;
    return { ok: true, coords: normalize(lat, lng), formatted: data.results[0].formatted_address };
  }
  return { ok: false, status: data.status, message: data.error_message };
}

async function main() {
  console.log(`\nbackfill-coordinates — ${COMMIT ? 'COMMIT (will write)' : 'DRY RUN (no writes)'}`);
  if (!API_KEY) {
    console.error(
      '\n✗ No geocoding key found. Set GOOGLE_MAPS_SERVER_API_KEY (or GOOGLE_MAP_KEY) in your env.\n',
    );
    process.exit(1);
  }

  const where = { coordinates: { equals: null } };
  if (ONLY_CITY) where.city = ONLY_CITY;

  let candidates = await prisma.property.findMany({
    where,
    select: { id: true, title: true, address: true, subLocality: true, locality: true, city: true },
    orderBy: { createdAt: 'desc' },
  });
  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT);

  console.log(
    `Found ${candidates.length} listing(s) without coordinates` +
      `${ONLY_CITY ? ` in ${ONLY_CITY}` : ''}.` +
      `  delay=${DELAY_MS}ms\n`,
  );

  const report = { resolved: 0, written: 0, failed: 0, skipped: 0 };

  for (const p of candidates) {
    const query = addressFor(p);
    if (!query || query === 'India') {
      report.skipped++;
      console.log(`- SKIP   ${p.id}  (no usable address) — "${p.title}"`);
      continue;
    }

    try {
      const r = await geocode(query);
      if (!r.ok || !r.coords) {
        report.failed++;
        console.log(`✗ FAIL   ${p.id}  [${r.status || 'INVALID'}] ${query}`);
      } else {
        report.resolved++;
        const tag = COMMIT ? 'WRITE' : 'WOULD ';
        console.log(
          `✓ ${tag}  ${p.id}  → ${r.coords.lat.toFixed(5)},${r.coords.lng.toFixed(5)}  (${query})`,
        );
        if (COMMIT) {
          // Keep the denormalized, indexed lat/lng columns in sync with the
          // canonical `coordinates` JSON (same contract as coordinateColumns()
          // used by POST/PATCH /api/properties and the seed) — otherwise
          // /api/properties/nearby and the radius search can't see this row.
          await prisma.property.update({
            where: { id: p.id },
            data: { coordinates: r.coords, latitude: r.coords.lat, longitude: r.coords.lng },
          });
          report.written++;
        }
      }
    } catch (err) {
      report.failed++;
      console.log(`✗ ERROR  ${p.id}  ${err?.message || err}`);
    }

    await sleep(DELAY_MS);
  }

  console.log('\n──────── summary ────────');
  console.log(`resolved : ${report.resolved}`);
  console.log(`written  : ${report.written}${COMMIT ? '' : '  (dry run — nothing written)'}`);
  console.log(`failed   : ${report.failed}`);
  console.log(`skipped  : ${report.skipped}`);
  if (!COMMIT && report.resolved > 0) {
    console.log('\nRe-run with --commit to persist the resolved coordinates.');
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
