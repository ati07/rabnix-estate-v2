// Seed the GeoPlace locality/area master from OpenStreetMap — the free,
// MagicBricks-style alternative to paid Google Places. For each app city we ask
// the Overpass API for all named `place` nodes (suburb/neighbourhood/quarter/…)
// within a radius of the city centre, classify them into top-level localities
// vs. child areas, link each area to its nearest locality (the equivalent of
// MB's `localityId` back-reference), and upsert them into the GeoPlace table.
//
// No API key, no billing, no per-request cost — Overpass is free (just be
// polite: we query one city at a time with a short pause between).
//
// Usage:
//   node scripts/seed-geoplaces-osm.mjs              # seed all cities
//   node scripts/seed-geoplaces-osm.mjs Lucknow Pune # seed specific cities
//   node scripts/seed-geoplaces-osm.mjs --dry        # fetch + classify, no DB writes
//
// Needs DATABASE_URL (loaded from .env / .env.local automatically below).

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Minimal .env loader (PrismaClient does not read .env on its own) ---------
for (const file of ['.env', '.env.local']) {
  const p = resolve(ROOT, file);
  if (!existsSync(p)) continue;
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

// City centres + search radius (metres). Delhi/NCR uses a wide radius so the
// query also sweeps up Gurgaon, Noida, Ghaziabad & Faridabad localities.
const CITIES = {
  'Mumbai':      { lat: 19.0760, lng: 72.8777, radius: 35000 },
  'Bangalore':   { lat: 12.9716, lng: 77.5946, radius: 35000 },
  'Delhi \ NCR': { lat: 28.6139, lng: 77.2090, radius: 55000 },
  'Hyderabad':   { lat: 17.3850, lng: 78.4867, radius: 35000 },
  'Pune':        { lat: 18.5204, lng: 73.8567, radius: 35000 },
  'Chennai':     { lat: 13.0827, lng: 80.2707, radius: 35000 },
  'Kolkata':     { lat: 22.5726, lng: 88.3639, radius: 35000 },
  'Ahmedabad':   { lat: 23.0225, lng: 72.5714, radius: 30000 },
  'Lucknow':     { lat: 26.8467, lng: 80.9462, radius: 30000 },
};

// OSM place= values → our two-level kind. Larger divisions become localities;
// the smaller ones become sub-areas that hang off the nearest locality.
const LOCALITY_PLACES = new Set(['suburb', 'quarter', 'town', 'village']);
const AREA_PLACES = new Set(['neighbourhood', 'city_block', 'hamlet']);

// Public Overpass mirrors. The main instance rate-limits (HTTP 429/502/504)
// under load, so we rotate across mirrors and retry with backoff.
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const MAX_LINK_KM = 6; // an area further than this from any locality is promoted to a locality itself

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const INVENTORY_ONLY = args.includes('--inventory-only'); // skip Overpass, merge listings only
const OSM_ONLY = args.includes('--osm-only');             // skip the inventory merge
const requested = args.filter((a) => !a.startsWith('--'));
const targetCities = requested.length
  ? requested.map((r) => Object.keys(CITIES).find((c) => c.toLowerCase() === r.toLowerCase()) || r)
  : Object.keys(CITIES);

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Drop pure non-Latin names (e.g. Devanagari-only OSM nodes) — the UI is in
// English, so a Hindi-only label in the dropdown is just noise.
const hasLatin = (s) => /[A-Za-z]/.test(s);

// Strip a trailing ", <City>" and collapse whitespace from free-text that
// sellers typed into locality / subLocality fields.
function cleanPlace(raw, city) {
  let s = (raw || '').trim().replace(/\s+/g, ' ');
  const tail = new RegExp(`,\\s*${city.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*$`, 'i');
  s = s.replace(tail, '').trim();
  return s;
}

// Choose the best casing among duplicate spellings of one name: the one used on
// the most listings, tie-broken toward the variant with more capital letters so
// acronyms like "HSR Layout" survive instead of becoming "Hsr Layout".
function pickCanonical(variants) {
  return variants
    .slice()
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const caps = (s) => (s.match(/[A-Z]/g) || []).length;
      return caps(b.name) - caps(a.name);
    })[0].name;
}

async function fetchCityPlaces(center) {
  const places = [...LOCALITY_PLACES, ...AREA_PLACES].join('|');
  const query = `[out:json][timeout:60];
    node["place"~"^(${places})$"]["name"](around:${center.radius},${center.lat},${center.lng});
    out body;`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    // Overpass rejects requests without a real User-Agent (HTTP 406).
    'User-Agent': 'BayBayt-locality-seed/1.0 (real-estate app; contact admin@baybayt.example)',
  };
  const body = 'data=' + encodeURIComponent(query);

  let lastErr;
  for (let attempt = 0; attempt < OVERPASS_MIRRORS.length * 2; attempt++) {
    const url = OVERPASS_MIRRORS[attempt % OVERPASS_MIRRORS.length];
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      if (res.status === 429 || res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(`Overpass ${res.status} ${res.statusText}`);
      }
      if (!res.ok) throw new Error(`Overpass ${res.status} ${res.statusText}`);
      return parseElements(await res.json());
    } catch (err) {
      lastErr = err;
      await sleep(2000 + attempt * 1500); // backoff before trying the next mirror
    }
  }
  throw lastErr;
}

function parseElements(json) {
  return (json.elements || [])
    .filter((e) => e.tags?.name && typeof e.lat === 'number' && typeof e.lon === 'number')
    .map((e) => ({
      name: e.tags.name.trim(),
      place: e.tags.place,
      lat: e.lat,
      lng: e.lon,
    }));
}

function classify(nodes) {
  // De-dup by lower(name), preferring the more significant place type so a name
  // tagged both suburb and neighbourhood lands as a locality.
  const rank = (p) => (LOCALITY_PLACES.has(p) ? 2 : 1);
  const byName = new Map();
  for (const n of nodes) {
    if (!hasLatin(n.name)) continue; // skip Devanagari-only OSM labels
    const key = n.name.toLowerCase();
    const prev = byName.get(key);
    if (!prev || rank(n.place) > rank(prev.place)) byName.set(key, n);
  }
  const unique = [...byName.values()];
  const localities = unique.filter((n) => LOCALITY_PLACES.has(n.place));
  const rawAreas = unique.filter((n) => AREA_PLACES.has(n.place));

  // Link each area to its nearest locality; promote orphans to localities so
  // nothing becomes an unreachable (parentless) suggestion.
  const areas = [];
  for (const a of rawAreas) {
    let best = null;
    let bestKm = Infinity;
    for (const l of localities) {
      const km = haversineKm(a.lat, a.lng, l.lat, l.lng);
      if (km < bestKm) { bestKm = km; best = l; }
    }
    if (best && bestKm <= MAX_LINK_KM) {
      areas.push({ ...a, parentName: best.name });
    } else {
      localities.push(a); // promote: standalone top-level locality
    }
  }
  return { localities, areas };
}

async function seedCity(city) {
  const center = CITIES[city];
  if (!center) {
    console.warn(`! Skipping "${city}" — no centre coordinates configured.`);
    return;
  }
  process.stdout.write(`• ${city}: querying Overpass… `);
  const nodes = await fetchCityPlaces(center);
  const { localities, areas } = classify(nodes);
  console.log(`${nodes.length} nodes → ${localities.length} localities, ${areas.length} areas`);

  if (DRY) {
    const sample = localities.slice(0, 8).map((l) => l.name).join(', ');
    console.log(`    e.g. ${sample}${localities.length > 8 ? '…' : ''}`);
    return;
  }

  // Upsert localities first so we can resolve parentId for the areas.
  const idByName = new Map();
  for (const l of localities) {
    const row = await prisma.geoPlace.upsert({
      where: { city_name_kind: { city, name: l.name, kind: 'locality' } },
      update: { latitude: l.lat, longitude: l.lng, source: 'osm' },
      create: { city, name: l.name, kind: 'locality', latitude: l.lat, longitude: l.lng, source: 'osm' },
    });
    idByName.set(l.name.toLowerCase(), row.id);
  }

  for (const a of areas) {
    const parentId = idByName.get(a.parentName.toLowerCase()) ?? null;
    await prisma.geoPlace.upsert({
      where: { city_name_kind: { city, name: a.name, kind: 'area' } },
      update: { latitude: a.lat, longitude: a.lng, parentId, source: 'osm' },
      create: { city, name: a.name, kind: 'area', latitude: a.lat, longitude: a.lng, parentId, source: 'osm' },
    });
  }
  console.log(`    ✓ upserted ${localities.length + areas.length} places for ${city}`);
}

// Merge the localities (and clean sub-localities) that actually appear on this
// city's listings into the master. This is what surfaces real, locally-used
// areas that OSM doesn't tag — e.g. "Khurram Nagar" in Lucknow — and is exactly
// how a MagicBricks-style master grows from its own inventory over time. These
// rows are marked source='inventory' and never clobber OSM coordinates.
async function mergeCityInventory(city) {
  const grouped = await prisma.property.groupBy({
    by: ['locality', 'subLocality'],
    where: { city },
    _count: { _all: true },
  });

  // Collapse spelling/casing variants of each locality to one canonical name.
  const locVariants = new Map(); // lowerKey -> [{name, count}]
  const subByLoc = new Map();    // canonicalLocLower -> Map(lowerKey -> {name,count})

  for (const g of grouped) {
    const loc = cleanPlace(g.locality, city);
    if (!loc || !hasLatin(loc)) continue;
    const lk = loc.toLowerCase();
    if (!locVariants.has(lk)) locVariants.set(lk, []);
    locVariants.get(lk).push({ name: loc, count: g._count._all });

    // A sub-locality is only kept if it's a clean, distinct single area — not
    // junk like "Gomti Nagar, Lucknow" or a comma-laden free-text blob.
    const sub = cleanPlace(g.subLocality, city);
    if (sub && hasLatin(sub) && !sub.includes(',') && sub.toLowerCase() !== lk) {
      if (!subByLoc.has(lk)) subByLoc.set(lk, new Map());
      const m = subByLoc.get(lk);
      const sk = sub.toLowerCase();
      if (!m.has(sk)) m.set(sk, []);
      m.get(sk).push({ name: sub, count: g._count._all });
    }
  }

  let locCount = 0;
  let areaCount = 0;
  for (const [lk, variants] of locVariants) {
    const name = pickCanonical(variants);
    if (DRY) { locCount++; continue; }
    // Only create if missing; don't downgrade an existing OSM row's source/coords.
    const existing = await prisma.geoPlace.findUnique({
      where: { city_name_kind: { city, name, kind: 'locality' } },
    });
    const row = existing ?? await prisma.geoPlace.create({
      data: { city, name, kind: 'locality', source: 'inventory' },
    });
    if (!existing) locCount++;

    const subs = subByLoc.get(lk);
    if (subs) {
      for (const sv of subs.values()) {
        const subName = pickCanonical(sv);
        if (subName.toLowerCase() === name.toLowerCase()) continue;
        const ex = await prisma.geoPlace.findUnique({
          where: { city_name_kind: { city, name: subName, kind: 'area' } },
        });
        if (ex) {
          if (!ex.parentId) await prisma.geoPlace.update({ where: { id: ex.id }, data: { parentId: row.id } });
        } else {
          await prisma.geoPlace.create({
            data: { city, name: subName, kind: 'area', parentId: row.id, source: 'inventory' },
          });
          areaCount++;
        }
      }
    }
  }
  console.log(`    ✓ inventory merge: +${locCount} localities, +${areaCount} areas for ${city}`);
}

async function main() {
  const mode = INVENTORY_ONLY ? 'inventory only' : OSM_ONLY ? 'OSM only' : 'OSM + inventory';
  console.log(`Seeding GeoPlace (${mode})${DRY ? ' [dry run]' : ''} for: ${targetCities.join(', ')}\n`);
  for (const city of targetCities) {
    try {
      if (!INVENTORY_ONLY) {
        await seedCity(city);
        await sleep(1500); // be polite to the public Overpass instance
      }
      if (!OSM_ONLY) await mergeCityInventory(city);
    } catch (err) {
      console.error(`  ✗ ${city} failed: ${err.message}`);
    }
  }
  console.log('\nDone.');
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
