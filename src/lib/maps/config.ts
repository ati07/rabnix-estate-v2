/**
 * Google Maps Platform configuration — single source of truth for the browser
 * map key and shared map options. Phase 1 (property-detail map + nearby places)
 * uses ONLY the browser key with the Maps JavaScript API + Places library.
 *
 * Keys follow the project's env conventions:
 *   GOOGLE_MAP_KEY  — browser Maps key, restricted to your site origins +
 *                     Maps JS + Places APIs.
 *
 * GOOGLE_MAP_KEY is a plain (non-NEXT_PUBLIC_) var, so it is inlined into the
 * client bundle via the `env` map in next.config.ts — the Maps JavaScript API
 * runs in the browser and needs the key there. It is a referrer-restricted
 * browser key, not a server secret.
 *
 * The key is intentionally read only through this module so missing/empty keys
 * degrade gracefully (the UI shows an address + "Open in Google Maps" link
 * instead of a blank map) rather than throwing. Never log the key's value.
 */

// NOTE: Next inlines this at build time via next.config.ts `env`, so it must be
// a static property access (not a dynamic key) to be replaced correctly.
const RAW_KEY = process.env.GOOGLE_MAP_KEY ?? '';

/** The browser Maps key, or '' when unset. Trimmed to tolerate stray quotes. */
export const GOOGLE_MAPS_API_KEY = RAW_KEY.trim();

/** True only when a non-empty browser key is configured. Gate all map UI on this. */
export const isMapsEnabled = GOOGLE_MAPS_API_KEY.length > 0;

/**
 * Optional Map ID for Advanced Markers / cloud-based map styling. Advanced
 * Markers require a Map ID; when none is set we fall back to a plain style id
 * that still renders (Google accepts 'DEMO_MAP_ID' for development).
 */
export const GOOGLE_MAPS_MAP_ID =
  (process.env.GOOGLE_MAP_ID ?? '').trim() || 'DEMO_MAP_ID';

/** Libraries we actually use. Keep this minimal to limit surface.
 *  places  — nearby search + create/edit autocomplete
 *  marker  — Advanced Markers (detail, discovery, picker)
 *  geocoding — reverse-geocode in the create/edit picker (optional; degrades) */
export const GOOGLE_MAPS_LIBRARIES = ['places', 'marker', 'geocoding'] as const;

/** Default zoom when focusing a single property. */
export const PROPERTY_MAP_ZOOM = 15;

/** Zoom used when only an approximate area is shown. */
export const APPROXIMATE_MAP_ZOOM = 13;

/** Radius (metres) of the "approximate location" circle when exact pin is hidden. */
export const APPROXIMATE_RADIUS_METERS = 650;

/** Default radius (metres) for nearby-place searches. */
export const NEARBY_SEARCH_RADIUS_METERS = 1500;

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Approximate centers for the 9 app cities (keys match billing CITY_TO_COLUMN,
 * incl. the literal 'Delhi \ NCR'). Used as a fallback map view when a filtered
 * set has no coordinates yet.
 */
export const CITY_CENTERS: Record<string, LatLngLiteral> = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  'Delhi \\ NCR': { lat: 28.6139, lng: 77.209 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
};

/** Center of India — ultimate fallback when no city match. */
export const INDIA_CENTER: LatLngLiteral = { lat: 22.5937, lng: 78.9629 };

/** Resolve a map center for a city name, falling back to India center. */
export function cityCenter(city?: string): LatLngLiteral {
  if (city && CITY_CENTERS[city]) return CITY_CENTERS[city];
  return INDIA_CENTER;
}

/** True when a point lies inside a bounds rectangle (handles antimeridian). */
export function withinBounds(p: LatLngLiteral, b: MapBounds): boolean {
  const latOk = p.lat <= b.north && p.lat >= b.south;
  const lngOk = b.west <= b.east ? p.lng >= b.west && p.lng <= b.east : p.lng >= b.west || p.lng <= b.east;
  return latOk && lngOk;
}

/**
 * Validate a coordinate pair. Returns a clean {lat,lng} or null. Guards against
 * NaN, out-of-range, and the (0,0) "null island" that usually signals bad data.
 */
export function normalizeCoordinates(input: unknown): LatLngLiteral | null {
  if (!input || typeof input !== 'object') return null;
  const c = input as Record<string, unknown>;
  const lat = typeof c.lat === 'number' ? c.lat : Number(c.lat);
  const lng = typeof c.lng === 'number' ? c.lng : Number(c.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null; // null island — treat as missing
  return { lat, lng };
}

/**
 * Derive the denormalized {latitude, longitude} columns from a coordinates
 * input for a Property write. Returns nulls when the input is missing/invalid so
 * the indexed columns stay consistent with the canonical `coordinates` JSON
 * (used by /api/properties on create and /api/properties/[id] on edit).
 */
export function coordinateColumns(input: unknown): { latitude: number | null; longitude: number | null } {
  const loc = normalizeCoordinates(input);
  return loc ? { latitude: loc.lat, longitude: loc.lng } : { latitude: null, longitude: null };
}

/** Build a Google Maps "directions to" URL (works without any API key). */
export function directionsUrl(dest: LatLngLiteral, label?: string): string {
  const q = `${dest.lat},${dest.lng}`;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  return label ? `${base}&destination_place_id=${encodeURIComponent(label)}` : base;
}

/** Build a Google Maps "search this address/place" URL (no API key needed). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Haversine straight-line distance in metres between two points. */
export function haversineMeters(a: LatLngLiteral, b: LatLngLiteral): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Human-friendly straight-line distance, e.g. "650 m" or "1.2 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
