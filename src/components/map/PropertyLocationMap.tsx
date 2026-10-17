'use client';

/**
 * PropertyLocationMap — Phase 1 of the Google Maps integration.
 *
 * Feature C (detail-page map): shows the property's saved coordinates with a
 * marker, address, and a "Directions" button (deep-links to Google Maps).
 * Feature B (nearby places): on-demand Places (New) searchNearby per amenity
 * category, listed with name, category, straight-line distance, and rating.
 *
 * Design goals:
 *  - Degrade gracefully: no API key or no coordinates -> address + an external
 *    "Open in Google Maps" link, never a blank map or a fake pin.
 *  - Respect owner privacy: `approximate` hides the exact pin and shows an area
 *    circle instead, with a clear disclaimer.
 *  - Be cheap: nearby places are fetched only when the user selects a category,
 *    and results are cached per-category for the lifetime of the component.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Loader2,
  Star,
  ExternalLink,
  GraduationCap,
  Hospital,
  UtensilsCrossed,
  ShoppingCart,
  TrainFront,
  Trees,
  ShieldAlert,
} from 'lucide-react';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  isMapsEnabled,
  normalizeCoordinates,
  directionsUrl,
  mapsSearchUrl,
  haversineMeters,
  formatDistance,
  PROPERTY_MAP_ZOOM,
  APPROXIMATE_MAP_ZOOM,
  APPROXIMATE_RADIUS_METERS,
  NEARBY_SEARCH_RADIUS_METERS,
  type LatLngLiteral,
} from '@/lib/maps/config';
import { NEARBY_CATEGORIES, type NearbyCategory } from '@/lib/maps/nearbyCategories';

const CATEGORY_ICONS = {
  GraduationCap,
  Hospital,
  UtensilsCrossed,
  ShoppingCart,
  TrainFront,
  Trees,
} as const;

export interface PropertyLocationMapProps {
  coordinates?: { lat: number; lng: number } | null;
  address?: string;
  title: string;
  locality: string;
  city: string;
  /** When true, hide the exact pin and show an approximate area instead. */
  approximate?: boolean;
}

interface NearbyPlace {
  id: string;
  name: string;
  categoryLabel: string;
  location: LatLngLiteral;
  distanceMeters: number;
  rating: number | null;
  ratingCount: number | null;
}

/* --------------------------------- shell --------------------------------- */

export default function PropertyLocationMap(props: PropertyLocationMapProps) {
  const coords = normalizeCoordinates(props.coordinates);
  const searchLabel = props.address || `${props.locality}, ${props.city}`;

  // No browser key configured -> show address + external link only.
  if (!isMapsEnabled) {
    return (
      <LocationCard title="Location">
        <FallbackBody
          icon={<MapPin className="w-5 h-5 text-[#18A67D]" />}
          heading={searchLabel}
          note="Interactive map is not configured yet."
          searchLabel={searchLabel}
          coords={coords}
        />
      </LocationCard>
    );
  }

  // Key present but no usable coordinates -> safe fallback (no fake pin).
  if (!coords) {
    return (
      <LocationCard title="Location">
        <FallbackBody
          icon={<MapPin className="w-5 h-5 text-[#18A67D]" />}
          heading={searchLabel}
          note="The owner hasn't pinned an exact location for this listing."
          searchLabel={searchLabel}
          coords={null}
        />
      </LocationCard>
    );
  }

  return (
    <LocationCard title="Location & Nearby">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <MapBody {...props} coords={coords} searchLabel={searchLabel} />
      </APIProvider>
    </LocationCard>
  );
}

/* --------------------------------- body ---------------------------------- */

function MapBody({
  coords,
  address,
  searchLabel,
  approximate,
}: PropertyLocationMapProps & { coords: LatLngLiteral; searchLabel: string }) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The map couldn&apos;t load (check the Google Maps API key, its allowed origins, and that
            billing is enabled). Showing address instead.
          </span>
        </div>
        <AddressRow address={address} searchLabel={searchLabel} coords={coords} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approximate && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-xs text-[#475569]">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#64748B]" />
          <span>
            Approximate area shown to protect the owner&apos;s privacy. The exact location is shared
            after you connect with the seller.
          </span>
        </div>
      )}

      <div
        className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-[#CBD5E1]"
        role="region"
        aria-label="Property location map"
      >
        {status === APILoadingStatus.LOADING && (
          <div className="absolute inset-0 z-[1] grid place-items-center bg-[#F1F5F9]">
            <Loader2 className="w-6 h-6 text-[#18A67D] animate-spin" />
          </div>
        )}
        <MapCanvas coords={coords} approximate={!!approximate} />
      </div>

      <AddressRow address={address} searchLabel={searchLabel} coords={coords} />

      <NearbyPanel center={coords} />
    </div>
  );
}

/* ------------------------------- map canvas ------------------------------ */

function MapCanvas({ coords, approximate }: { coords: LatLngLiteral; approximate: boolean }) {
  const [nearbyMarkers, setNearbyMarkers] = useState<NearbyPlace[]>([]);

  return (
    <NearbyMarkersContext.Provider value={{ nearbyMarkers, setNearbyMarkers }}>
      <Map
        defaultCenter={coords}
        defaultZoom={approximate ? APPROXIMATE_MAP_ZOOM : PROPERTY_MAP_ZOOM}
        mapId={GOOGLE_MAPS_MAP_ID}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl
        className="w-full h-full"
      >
        {approximate ? (
          <AreaCircle center={coords} radius={APPROXIMATE_RADIUS_METERS} />
        ) : (
          <AdvancedMarker position={coords} title="Property location">
            <Pin background="#18A67D" borderColor="#0F2A43" glyphColor="#ffffff" />
          </AdvancedMarker>
        )}

        {nearbyMarkers.map((p) => (
          <AdvancedMarker key={p.id} position={p.location} title={`${p.name} · ${p.categoryLabel}`}>
            <Pin background="#0F2A43" borderColor="#0F2A43" glyphColor="#8BD3BD" scale={0.8} />
          </AdvancedMarker>
        ))}
      </Map>
    </NearbyMarkersContext.Provider>
  );
}

/** Lightweight channel so the nearby panel can push markers onto the map. */
const NearbyMarkersContext = createContext<{
  nearbyMarkers: NearbyPlace[];
  setNearbyMarkers: (p: NearbyPlace[]) => void;
}>({ nearbyMarkers: [], setNearbyMarkers: () => {} });

/** Draws a translucent circle for approximate-location mode. */
function AreaCircle({ center, radius }: { center: LatLngLiteral; radius: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    const circle = new google.maps.Circle({
      map,
      center,
      radius,
      strokeColor: '#18A67D',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#18A67D',
      fillOpacity: 0.12,
    });
    return () => circle.setMap(null);
  }, [map, center, radius]);
  return null;
}

/* ------------------------------ address row ------------------------------ */

function AddressRow({
  address,
  searchLabel,
  coords,
}: {
  address?: string;
  searchLabel: string;
  coords: LatLngLiteral | null;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <MapPin className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#475569] leading-snug break-words">
          {address || searchLabel}
        </p>
      </div>
      <a
        href={coords ? directionsUrl(coords) : mapsSearchUrl(searchLabel)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold transition-colors"
      >
        <Navigation className="w-3.5 h-3.5" />
        Directions
      </a>
    </div>
  );
}

/* ------------------------------ nearby panel ----------------------------- */

function NearbyPanel({ center }: { center: LatLngLiteral }) {
  const placesLib = useMapsLibrary('places');
  const { setNearbyMarkers } = useNearbyMarkers();

  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Per-category result cache for this component's lifetime (session only).
  const cache = useRef<Record<string, NearbyPlace[]>>({});
  const [results, setResults] = useState<NearbyPlace[]>([]);

  const runSearch = useCallback(
    async (cat: NearbyCategory) => {
      if (!placesLib) return;
      setError(null);

      if (cache.current[cat.id]) {
        setResults(cache.current[cat.id]);
        setNearbyMarkers(cache.current[cat.id]);
        return;
      }

      setLoading(true);
      try {
        // Places API (New): Place.searchNearby. Requests only the fields we show.
        const { places } = await placesLib.Place.searchNearby({
          fields: ['displayName', 'location', 'rating', 'userRatingCount'],
          locationRestriction: { center, radius: NEARBY_SEARCH_RADIUS_METERS },
          includedTypes: cat.types,
          maxResultCount: 12,
          rankPreference: placesLib.SearchNearbyRankPreference.DISTANCE,
        });

        const mapped: NearbyPlace[] = (places ?? [])
          .map((pl) => {
            const loc = pl.location;
            if (!loc) return null;
            const location = { lat: loc.lat(), lng: loc.lng() };
            return {
              id: pl.id,
              name: pl.displayName ?? 'Unnamed place',
              categoryLabel: cat.label,
              location,
              distanceMeters: haversineMeters(center, location),
              rating: pl.rating ?? null,
              ratingCount: pl.userRatingCount ?? null,
            } as NearbyPlace;
          })
          .filter((x): x is NearbyPlace => x !== null)
          .sort((a, b) => a.distanceMeters - b.distanceMeters);

        cache.current[cat.id] = mapped;
        setResults(mapped);
        setNearbyMarkers(mapped);
      } catch (e) {
        setError('Could not load nearby places right now.');
        setResults([]);
        setNearbyMarkers([]);
      } finally {
        setLoading(false);
      }
    },
    [placesLib, center, setNearbyMarkers],
  );

  const onToggle = (cat: NearbyCategory) => {
    if (active === cat.id) {
      setActive(null);
      setResults([]);
      setNearbyMarkers([]);
      return;
    }
    setActive(cat.id);
    void runSearch(cat);
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F2A43]">What&apos;s nearby</h3>
        {!placesLib && <span className="text-[11px] text-[#94A3B8]">loading places…</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NEARBY_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          const on = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              disabled={!placesLib}
              aria-pressed={on}
              onClick={() => onToggle(cat)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                on
                  ? 'bg-[#0F2A43] text-white border-[#0F2A43]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F2A43] hover:border-[#18A67D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-xs text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#18A67D]" />
              Finding places…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 text-xs text-amber-800 bg-amber-50">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-xs text-[#64748B]">No places found within 1.5 km.</div>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {results.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0F2A43] truncate">{p.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                      <span>{p.categoryLabel}</span>
                      <span>·</span>
                      <span title="Straight-line distance">~{formatDistance(p.distanceMeters)}</span>
                      {p.rating != null && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {p.rating.toFixed(1)}
                            {p.ratingCount != null && (
                              <span className="text-[#94A3B8]"> ({p.ratingCount})</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <a
                    href={directionsUrl(p.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Directions to ${p.name}`}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#0E7C5D] hover:underline"
                  >
                    Directions
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="px-3 py-2 text-[10px] text-[#94A3B8] bg-[#F8FAFC] border-t border-[#E2E8F0]">
            Distances are straight-line (as the crow flies), not driving distance. Place data © Google.
          </p>
        </div>
      )}
    </div>
  );
}

function useNearbyMarkers() {
  return useContext(NearbyMarkersContext);
}

/* --------------------------- shared presentational --------------------------- */

function LocationCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-4 shadow-xs">
      <h2 className="text-lg font-bold text-[#0F2A43]">{title}</h2>
      {children}
    </div>
  );
}

function FallbackBody({
  icon,
  heading,
  note,
  searchLabel,
  coords,
}: {
  icon: React.ReactNode;
  heading: string;
  note: string;
  searchLabel: string;
  coords: LatLngLiteral | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <p className="text-sm font-semibold text-[#0F2A43] break-words">{heading}</p>
          <p className="text-xs text-[#64748B]">{note}</p>
        </div>
      </div>
      <a
        href={coords ? directionsUrl(coords) : mapsSearchUrl(searchLabel)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#18A67D] text-[#0F2A43] text-xs font-bold transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5 text-[#18A67D]" />
        Open in Google Maps
      </a>
    </div>
  );
}
