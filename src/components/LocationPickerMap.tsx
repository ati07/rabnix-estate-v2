'use client';

/**
 * LocationPickerMap — the Google-Maps-backed location picker used by the
 * create/edit forms (post-property page + dashboard inline upload). It touches
 * the browser Maps SDK, so it MUST only be imported via next/dynamic with
 * { ssr: false }. Use the <LocationPicker> wrapper, never this directly.
 *
 * Uses Google Maps Platform (same GOOGLE_MAP_KEY as the rest of the integration):
 *   • Places Autocomplete (New) for the search box,
 *   • a draggable Advanced Marker + click-to-drop on the map,
 *   • Geocoder reverse-geocoding to auto-fill the address (degrades gracefully if
 *     the Geocoding API isn't enabled — the pin still saves, address stays editable).
 *
 * If GOOGLE_MAP_KEY is unset the component still works as a plain editable address
 * field (no map), so posting a listing never hard-depends on the map.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Search, MapPin, LocateFixed, Loader2, X } from 'lucide-react';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  isMapsEnabled,
  cityCenter,
  CITY_CENTERS,
  type LatLngLiteral,
} from '@/lib/maps/config';

export type LatLng = LatLngLiteral;

export interface LocationValue {
  address?: string;
  coordinates?: LatLng;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  /** Bias search + default map center to this app city. */
  city?: string;
  /** Tailwind height class for the map. Defaults to h-64. */
  heightClass?: string;
}

interface PanTarget {
  lat: number;
  lng: number;
  zoom: number;
  nonce: number;
}

export default function LocationPickerMap(props: LocationPickerProps) {
  // No key → graceful text-only fallback so posting still works.
  if (!isMapsEnabled) {
    return <AddressOnlyFallback {...props} />;
  }
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <PickerBody {...props} />
    </APIProvider>
  );
}

function PickerBody({ value, onChange, city, heightClass = 'h-64' }: LocationPickerProps) {
  const places = useMapsLibrary('places');
  const geocoding = useMapsLibrary('geocoding');

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [panTarget, setPanTarget] = useState<PanTarget | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const knownCity = !!(city && CITY_CENTERS[city]);
  const center = value.coordinates ?? cityCenter(city);
  const initialZoom = value.coordinates ? 16 : knownCity ? 11 : 5;
  const hasPin = !!value.coordinates;

  useEffect(() => {
    if (geocoding && !geocoderRef.current) geocoderRef.current = new geocoding.Geocoder();
  }, [geocoding]);

  // Reverse-geocode a coordinate into an address and push both up. Non-fatal:
  // if the Geocoding API isn't enabled, we keep the coordinate and leave the
  // address for the user to type.
  const resolveAndEmit = useCallback(
    async (c: LatLng) => {
      onChange({ address: value.address, coordinates: c });
      const geocoder = geocoderRef.current;
      if (!geocoder) return;
      setResolving(true);
      try {
        const { results } = await geocoder.geocode({ location: c });
        const formatted = results?.[0]?.formatted_address;
        if (formatted) onChange({ address: formatted, coordinates: c });
      } catch {
        /* keep the coordinate even if reverse-geocode fails */
      } finally {
        setResolving(false);
      }
    },
    [onChange, value.address],
  );

  // Debounced Places Autocomplete (New), biased to the chosen city + India.
  useEffect(() => {
    const q = query.trim();
    if (!places || q.length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        if (!tokenRef.current) tokenRef.current = new places.AutocompleteSessionToken();
        const request: google.maps.places.AutocompleteRequest = {
          input: q,
          includedRegionCodes: ['in'],
          sessionToken: tokenRef.current,
        };
        if (knownCity) {
          request.locationBias = { center: cityCenter(city), radius: 50000 };
        }
        const { suggestions: out } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (!cancelled) {
          setSuggestions(out.filter((s) => s.placePrediction));
          setOpenResults(true);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, places, knownCity, city]);

  // Close dropdown on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpenResults(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pickSuggestion = async (s: google.maps.places.AutocompleteSuggestion) => {
    const prediction = s.placePrediction;
    if (!prediction) return;
    setOpenResults(false);
    setQuery('');
    setSuggestions([]);
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      const loc = place.location;
      if (loc) {
        const c = { lat: loc.lat(), lng: loc.lng() };
        onChange({ address: place.formattedAddress ?? value.address, coordinates: c });
        setPanTarget({ ...c, zoom: 17, nonce: Date.now() });
      }
    } catch {
      /* ignore — suggestion couldn't be resolved to a place */
    } finally {
      tokenRef.current = null; // end the autocomplete session after a pick
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPanTarget({ ...c, zoom: 17, nonce: Date.now() });
        resolveAndEmit(c);
      },
      () => {
        /* permission denied / unavailable — silently ignore */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      {/* Search box */}
      <div ref={boxRef} className="relative">
        <div className="flex items-center gap-2 w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus-within:bg-white focus-within:border-[#18A67D]">
          <Search className="w-4 h-4 text-[#64748B] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length && setOpenResults(true)}
            placeholder="Search for a place, street or landmark…"
            className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-[#172033] outline-none"
          />
          {searching ? (
            <Loader2 className="w-4 h-4 text-[#18A67D] animate-spin shrink-0" />
          ) : query ? (
            <button type="button" onClick={() => setQuery('')} className="shrink-0 text-[#94A3B8] hover:text-[#172033]">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {openResults && suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 w-full max-h-64 overflow-auto bg-white border border-[#E2E8F0] rounded-xl shadow-lg">
            {suggestions.map((s, i) => {
              const text = s.placePrediction?.text?.text ?? '';
              return (
                <li key={s.placePrediction?.placeId ?? i}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-[#F1F5F9] transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#18A67D] mt-0.5 shrink-0" />
                    <span className="text-xs text-[#172033] leading-snug">{text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-[#CBD5E1]`}>
        <Map
          defaultCenter={center}
          defaultZoom={initialZoom}
          mapId={GOOGLE_MAPS_MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="w-full h-full"
          onClick={(e) => {
            const ll = e.detail.latLng;
            if (ll) resolveAndEmit({ lat: ll.lat, lng: ll.lng });
          }}
        >
          <PanTo target={panTarget} />
          {hasPin && (
            <AdvancedMarker
              position={value.coordinates!}
              draggable
              onDragEnd={(e) => {
                const ll = e.latLng;
                if (ll) resolveAndEmit({ lat: ll.lat(), lng: ll.lng() });
              }}
            >
              <Pin background="#18A67D" borderColor="#0F2A43" glyphColor="#ffffff" />
            </AdvancedMarker>
          )}
        </Map>

        {/* Use-my-location button */}
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my current location"
          className="absolute z-[1000] bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-white border border-[#CBD5E1] rounded-lg shadow text-xs font-semibold text-[#0F2A43]"
        >
          <LocateFixed className="w-4 h-4 text-[#18A67D]" />
          My location
        </button>

        {!hasPin && (
          <div className="pointer-events-none absolute z-[900] inset-x-0 top-3 flex justify-center">
            <span className="px-3 py-1 rounded-full bg-[#0F2A43]/85 text-white text-[11px] font-medium">
              Tap the map or search to drop a pin
            </span>
          </div>
        )}
      </div>

      {/* Address text (editable; auto-filled from the pin) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#172033] uppercase">
          Full Address {resolving && <span className="text-[#18A67D] normal-case font-medium">· locating…</span>}
        </label>
        <textarea
          value={value.address ?? ''}
          onChange={(e) => onChange({ address: e.target.value, coordinates: value.coordinates })}
          rows={2}
          placeholder="House / building no., street, area — auto-filled from the map, edit as needed"
          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none resize-none"
        />
        {value.coordinates && (
          <p className="text-[11px] text-[#64748B]">
            Pin: {value.coordinates.lat.toFixed(5)}, {value.coordinates.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}

/** Imperatively pan/zoom the map when a search result or "my location" is chosen. */
function PanTo({ target }: { target: PanTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(target.zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, target?.nonce]);
  return null;
}

/** Map-less fallback when no Google key is configured: just an editable address. */
function AddressOnlyFallback({ value, onChange }: LocationPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-[#172033] uppercase">Full Address</label>
      <textarea
        value={value.address ?? ''}
        onChange={(e) => onChange({ address: e.target.value, coordinates: value.coordinates })}
        rows={2}
        placeholder="House / building no., street, area, locality"
        className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#172033] focus:bg-white focus:border-[#18A67D] outline-none resize-none"
      />
      <p className="text-[11px] text-[#64748B]">
        Map picker unavailable (no Maps key configured) — the address above is still saved.
      </p>
    </div>
  );
}
