import { CityInfo } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';

// Approximate centre coordinates for each supported city. Keyed by the exact
// `name` used in CITIES_DATA so we can map a user's GPS fix to the nearest city.
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.076, lng: 72.8777 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'New Delhi': { lat: 28.6139, lng: 77.209 },
  'Noida': { lat: 28.5355, lng: 77.391 },
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Hyderabad': { lat: 17.385, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
};

// Haversine distance in kilometres between two lat/lng points.
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Resolve a supported city NAME from request geo signals (Vercel edge headers),
 * given a header accessor. Pure and framework-free so it can run in the API
 * route, middleware, or a server component. Returns `null` when no usable
 * signal exists (e.g. local dev / loopback IP). Prefers precise lat/lng, then
 * falls back to the reported IP city name.
 */
export function cityNameFromGeoHeaders(get: (name: string) => string | null | undefined): string | null {
  const lat = get('x-vercel-ip-latitude');
  const lng = get('x-vercel-ip-longitude');
  if (lat && lng) {
    const c = nearestCity({ lat: parseFloat(lat), lng: parseFloat(lng) });
    if (c) return c.name;
  }
  const ipCity = get('x-vercel-ip-city');
  if (ipCity) {
    const decoded = decodeURIComponent(ipCity).toLowerCase();
    const match = CITIES_DATA.find(
      (c) =>
        c.name.toLowerCase().includes(decoded) ||
        decoded.includes(c.name.toLowerCase().split(' ')[0])
    );
    if (match) return match.name;
  }
  return null;
}

/** Return the supported CityInfo whose centre is closest to the given coordinates. */
export function nearestCity(coords: { lat: number; lng: number }): CityInfo | null {
  let best: CityInfo | null = null;
  let bestDist = Infinity;
  for (const city of CITIES_DATA) {
    const c = CITY_COORDINATES[city.name];
    if (!c) continue;
    const d = distanceKm(coords, c);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

/**
 * Ask the browser for the user's location and resolve to the nearest supported city.
 * Resolves to `null` if geolocation is unavailable, denied, or times out — callers
 * should simply keep their current/default city in that case.
 */
export function detectNearestCity(): Promise<CityInfo | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(nearestCity({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/**
 * Permission-free fallback: ask the server to infer the city from the request
 * IP (via Vercel edge geo headers). Resolves to `null` when no geo signal is
 * available (e.g. local dev) or on any error. Used when browser geolocation is
 * denied or unavailable.
 */
export async function detectCityByIp(): Promise<CityInfo | null> {
  try {
    const res = await fetch('/api/geo', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.city) {
      return CITIES_DATA.find((c) => c.name === data.city) || null;
    }
    return null;
  } catch {
    return null;
  }
}
