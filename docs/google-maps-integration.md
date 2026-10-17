# Google Maps Integration — Setup & Status

This document covers the Google Maps Platform integration for BayBayt. It is
being delivered in phases (agreed with the product owner):

- **Phase 1: Property-detail map + nearby places.** ✅ Implemented.
- **Phase 2: Interactive search/results map with filter sync + bounds filtering.** ✅ Implemented.
- **Create/edit location picker migrated from Leaflet/OSM to Google Maps.** ✅ Done.
  The `leaflet` / `react-leaflet` packages were removed; `LocationPickerMap` now uses
  Google Places Autocomplete + a draggable Advanced Marker + Geocoder reverse-geocode.
- Phase 3 (remaining): Radius / area search + server-side geo endpoints. ⏳ Not started.

---

## What Phase 1 adds

On the property-detail page (`/properties/[id]`) a new **Location & Nearby** card:

- Renders the property's saved `coordinates` with a branded marker.
- Shows the `address` (falls back to `locality, city`) and a **Directions** button
  that deep-links to Google Maps (works with no API key — it's just a URL).
- **Nearby places (Feature B):** six amenity categories (Schools, Hospitals,
  Food & Cafes, Shopping, Transit, Parks). Clicking a category runs one
  Places (New) `searchNearby` call within 1.5 km, lists name / category /
  straight-line distance / rating, drops lightweight markers, and offers a
  per-place Directions link. Results are **cached per category** for the page's
  lifetime, so re-selecting a category makes no new request.

### Graceful degradation (no silent failures)

| Condition | Behaviour |
|---|---|
| `GOOGLE_MAP_KEY` unset | No map; shows address + "Open in Google Maps" link. |
| Property has no / invalid coordinates | No fake pin; shows address + external search link. |
| Key invalid / billing off / referrer blocked | Amber notice + address fallback (via Maps JS auth-failure status). |
| `approximate` prop true | Exact pin hidden; translucent area circle + privacy disclaimer. |

Coordinate validation (`normalizeCoordinates`) rejects NaN, out-of-range, and the
`(0,0)` "null island", so bad data never renders as a confident pin.

---

## What Phase 2 adds

A new **discovery map** at `/properties/map` — a split view with the results list
on the left and a live Google map on the right.

- **Same data, same filters.** It reuses the existing `useProperties()` client
  context (no second fetch) and a shared filter module
  (`src/lib/propertyFilters.ts`) that mirrors the `/properties` catalog logic
  field-for-field, so both pages always agree on what matches.
- **Price-pill markers + clustering.** Each mappable listing gets a branded price
  pill (Advanced Marker); nearby pills collapse into clusters
  (`@googlemaps/markerclusterer`) and the map auto-fits to the result set.
- **Bounds filtering.** Panning/zooming emits the visible bounds (debounced
  ~250 ms); the list narrows to the markers currently in view.
- **Two-way selection.** Hovering/clicking a list card highlights + pans to its
  marker; clicking a marker opens a preview (image, price, title, locality,
  details link) and highlights the card.
- **Filter round-trip.** The catalog's **Map view** button serializes the current
  in-page filters into the URL; `/properties/map` reads them back via
  `parseFiltersFromParams`, and its **List view** button carries them back.

### The coordinate-data caveat (important)

Markers only appear for listings that have **real saved `coordinates`**. Most
existing listings were created before the location picker, so they have none.
Rather than invent a city-center pin, the map **omits** those listings and shows
an honest count ("N without a pin") with a link to the full list view. Until
coordinates are backfilled (see below) or new listings are posted with the
picker, the map will show only a subset of matching listings.

### Phase 2 degradation

| Condition | Behaviour |
|---|---|
| `GOOGLE_MAP_KEY` unset | Map panel shows a "Map not configured" notice; the list panel still works. |
| Listing has no / invalid coordinates | Not placed on the map; counted and linked to list view. |
| No matching listing has coordinates | List panel shows an empty-state with a link to the full catalog. |

---

## Backfilling coordinates for existing listings

`scripts/backfill-coordinates.mjs` geocodes listings that have no `coordinates`
so they can appear on the map. It is **dry-run by default** and must be run
manually — it is never invoked automatically.

```
# preview only — no DB writes:
node scripts/backfill-coordinates.mjs

# actually persist resolved coordinates:
node scripts/backfill-coordinates.mjs --commit

# options: --limit=50  --delay=200  --city="Lucknow"
```

It only touches rows where `coordinates IS NULL`, never overwrites existing
coordinates, rate-limits its calls (`--delay`, default 200 ms), validates each
result with the same rules as the app, and prints a per-row + summary report.

It needs a **server-side** Geocoding key (NOT the browser key):
`GOOGLE_MAPS_SERVER_API_KEY` (falls back to the existing `GOOGLE_MAP_KEY`). The
key must have the **Geocoding API** enabled. Geocoding is billed per request —
review pricing and run with `--limit` first.

---

## Required Google Cloud setup

1. Create (or reuse) a project at <https://console.cloud.google.com/>.
2. **Enable billing** on the project. Maps/Places will not serve requests without
   an active billing account — do not assume free-tier covers production.
3. **APIs to enable** (APIs & Services → Library) — Phase 1 needs exactly two:
   - **Maps JavaScript API**
   - **Places API (New)**  ← the integration uses `Place.searchNearby`, which is
     the *new* Places API, not the legacy "Places API".
4. **Create a browser API key** (APIs & Services → Credentials → Create API key):
   - **Application restrictions → HTTP referrers**, add your origins only:
     `https://your-domain.com/*` and `http://localhost:3000/*`.
   - **API restrictions → Restrict key**, select only *Maps JavaScript API* and
     *Places API (New)*.
5. (Optional) Create a **Map ID** (Google Maps Platform → Map Management) for
   custom styling; Advanced Markers otherwise use the built-in `DEMO_MAP_ID`.
6. **Cost controls:** set a **budget + billing alerts** (Billing → Budgets) and,
   if desired, per-API **quota caps** (APIs & Services → Quotas). Review current
   pricing for your billing country before go-live:
   <https://mapsplatform.google.com/intl/en_in/pricing/>.

> Phase 1 uses **no server-side Google key** — all calls are browser-side via the
> restricted browser key. A separate, environment-restricted server key will only
> be introduced if/when Phase 3 adds server-side Geocoding for address→coordinate
> resolution or backfill.

---

## Environment variables

Add to `.env` (see `.env.example` for the full annotated block):

```
GOOGLE_MAP_KEY="your-restricted-browser-key"
GOOGLE_MAP_ID=""   # optional; DEMO_MAP_ID used if blank
```

`GOOGLE_MAP_KEY` / `GOOGLE_MAP_ID` are plain (non-`NEXT_PUBLIC_`) vars, so they are
inlined into the client bundle via the `env` map in `next.config.ts` — the Maps
JavaScript API runs in the browser and needs the key there. It is therefore a
*referrer-restricted browser* key, not a server secret. The key is read only
through `src/lib/maps/config.ts`; it is never logged.

---

## Files added / changed (Phase 1)

**Added**
- `src/lib/maps/config.ts` — key reading, `isMapsEnabled`, coordinate validation,
  distance helpers, directions/search URL builders.
- `src/lib/maps/nearbyCategories.ts` — amenity category → Places type mapping.
- `src/components/map/PropertyLocationMap.tsx` — the detail-page map + nearby panel.

**Changed**
- `src/app/properties/[id]/page.tsx` — renders `<PropertyLocationMap>` after the
  "Verified Title & Legal Clearance" block.
- `.env.example` — documented the two new env vars.
- `package.json` — added `@vis.gl/react-google-maps` (Google's React wrapper,
  React 19 compatible; loads the Maps JS script on demand).

No database changes in Phase 1. `Property.coordinates` (Json) and `Property.address`
(String) already exist and are reused.

## Files added / changed (Phase 2)

**Added**
- `src/lib/propertyFilters.ts` — shared filter state/predicate/sort, reused by the
  catalog and the map so they stay in sync.
- `src/components/map/PropertyDiscoveryMap.tsx` — clustered price-pill markers,
  preview popup, auto-fit, debounced bounds emission, no-key fallback.
- `src/app/properties/map/page.tsx` — the split-view discovery page.
- `scripts/backfill-coordinates.mjs` — dry-run-by-default coordinate backfill.

**Changed**
- `src/app/properties/page.tsx` — added a **Map view** button that serializes the
  current filters into the map URL.
- `package.json` — added `@googlemaps/markerclusterer`.

Still no database changes in Phase 2 — the existing `Property.coordinates` is reused.
Server-side geo querying (PostGIS / indexed lat-lng) is deferred to Phase 3 where it
pairs with radius search; Phase 2 filters bounds client-side over the already-loaded
set, which is cheap because the data is fetched once into context.

---

## Pricing considerations (verify before production)

- **Maps JavaScript API** is billed per **map load** (one load = one detail-page
  view that shows the map).
- **Places API (New) Nearby Search** is billed per request; the panel makes **at
  most one request per category selection per page view** (cached thereafter), so
  a visitor who opens all six categories once triggers six Nearby requests.
- **Directions links are free** — they open Google Maps in a new tab and are not
  API calls.
- Google offers recurring monthly credit on Maps Platform, but amounts/terms
  change and vary by country; confirm current figures on the pricing page above
  and set a budget alert rather than relying on free usage.

---

## Testing notes

- `tsc --noEmit` and `next build` both pass with the integration in place.
- **Live Google calls were NOT verified** because no API key is configured in this
  environment. With a key set, verify: map renders at the property's pin; the
  Directions button opens Google Maps; each nearby category returns results and
  drops markers; an invalid key shows the amber fallback; a listing with no
  coordinates shows the address-only fallback.
