/**
 * backfill-coordinates-local.mjs — offline coordinate backfill, no paid API.
 *
 * The Google Geocoding path (scripts/backfill-coordinates.mjs) needs a
 * Geocoding-enabled server key; our only key is a referrer-restricted browser
 * key (REQUEST_DENIED). This script instead derives each listing's coordinates
 * from data we already own:
 *
 *   1. Match the listing's subLocality / locality (and their tokens) to a
 *      GeoPlace in the same city that has coordinates (8k+ seeded from OSM).
 *   2. Fall back to the city center when no place matches.
 *
 * A small deterministic jitter (seeded from the listing id) is added so several
 * listings in the same locality / city don't stack on a single pixel. It writes
 * the canonical `coordinates` JSON AND the denormalized latitude/longitude
 * columns so the nearby endpoint + radius search see the row.
 *
 * SAFE BY DEFAULT — dry run unless you pass --commit. Only touches rows whose
 * latitude is null.
 *
 *   node scripts/backfill-coordinates-local.mjs            # preview
 *   node scripts/backfill-coordinates-local.mjs --commit   # write
 *   options: --limit=N  --city="Lucknow"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const getOpt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const LIMIT = parseInt(getOpt('limit', '0'), 10) || 0;
const ONLY_CITY = getOpt('city', '');

// City centers (mirrors src/lib/maps/config.ts). Resolved fuzzily so DB variants
// like "Delhi / NCR" / "Bengaluru" still map correctly.
const CITY_CENTERS = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  delhi: { lat: 28.6139, lng: 77.209 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
};

function cityCenter(city) {
  const c = (city || '').toLowerCase();
  if (c.includes('delhi') || c.includes('ncr') || c.includes('noida') || c.includes('gurgaon')) return CITY_CENTERS.delhi;
  if (c.includes('bengaluru') || c.includes('bangalore')) return CITY_CENTERS.bangalore;
  for (const key of Object.keys(CITY_CENTERS)) if (c.includes(key)) return CITY_CENTERS[key];
  return null;
}

/** Deterministic small offset (~±250 m) from a listing id so pins don't stack. */
function jitter(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const dx = ((h & 0xffff) / 0xffff - 0.5) * 0.0045; // ~±250 m lat
  const dy = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 0.0045;
  return { dLat: dx, dLng: dy };
}

/** Candidate place names to try, most specific first, plus split tokens. */
function candidateNames(p) {
  const raw = [p.subLocality, p.locality].filter(Boolean);
  const out = [];
  for (const r of raw) {
    out.push(r);
    // split on commas / dashes / parens to recover a bare locality token
    for (const t of r.split(/[,\-()]/).map((s) => s.trim()).filter((s) => s.length >= 3)) out.push(t);
  }
  // de-dup, keep order
  return [...new Set(out)];
}

async function matchGeoPlace(city, names) {
  for (const n of names) {
    const exact = await prisma.geoPlace.findFirst({
      where: { city, name: { equals: n, mode: 'insensitive' }, latitude: { not: null } },
      select: { name: true, latitude: true, longitude: true, kind: true },
    });
    if (exact) return { ...exact, how: `exact:${n}` };
  }
  for (const n of names) {
    const partial = await prisma.geoPlace.findFirst({
      where: { city, name: { contains: n, mode: 'insensitive' }, latitude: { not: null } },
      orderBy: { kind: 'asc' }, // 'area' before 'locality' alphabetically
      select: { name: true, latitude: true, longitude: true, kind: true },
    });
    if (partial) return { ...partial, how: `contains:${n}` };
  }
  return null;
}

async function main() {
  console.log(`\nbackfill-coordinates-local — ${COMMIT ? 'COMMIT (will write)' : 'DRY RUN (no writes)'}`);

  const where = { latitude: null };
  if (ONLY_CITY) where.city = ONLY_CITY;

  let candidates = await prisma.property.findMany({
    where,
    select: { id: true, title: true, subLocality: true, locality: true, city: true },
    orderBy: { createdAt: 'desc' },
  });
  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT);

  console.log(`Found ${candidates.length} listing(s) without coordinates${ONLY_CITY ? ` in ${ONLY_CITY}` : ''}.\n`);

  const report = { byPlace: 0, byCity: 0, failed: 0, written: 0 };

  for (const p of candidates) {
    const names = candidateNames(p);
    const place = await matchGeoPlace(p.city, names);

    let base = null;
    let source = '';
    if (place) {
      base = { lat: place.latitude, lng: place.longitude };
      source = `GeoPlace "${place.name}" (${place.how})`;
      report.byPlace++;
    } else {
      const center = cityCenter(p.city);
      if (center) {
        base = center;
        source = `city center (${p.city})`;
        report.byCity++;
      }
    }

    if (!base) {
      report.failed++;
      console.log(`✗ FAIL  ${p.id}  — no GeoPlace and no city center for "${p.city}"`);
      continue;
    }

    const { dLat, dLng } = jitter(p.id);
    const coords = {
      lat: Number((base.lat + dLat).toFixed(6)),
      lng: Number((base.lng + dLng).toFixed(6)),
    };

    const tag = COMMIT ? 'WRITE' : 'WOULD';
    console.log(`✓ ${tag}  ${p.id}  → ${coords.lat},${coords.lng}  via ${source}`);

    if (COMMIT) {
      await prisma.property.update({
        where: { id: p.id },
        data: { coordinates: coords, latitude: coords.lat, longitude: coords.lng },
      });
      report.written++;
    }
  }

  console.log('\n──────── summary ────────');
  console.log(`matched via GeoPlace : ${report.byPlace}`);
  console.log(`via city center      : ${report.byCity}`);
  console.log(`failed               : ${report.failed}`);
  console.log(`written              : ${report.written}${COMMIT ? '' : '  (dry run — nothing written)'}`);
  if (!COMMIT && report.byPlace + report.byCity > 0) console.log('\nRe-run with --commit to persist.');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
