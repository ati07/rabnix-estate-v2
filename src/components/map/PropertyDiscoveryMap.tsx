'use client';

/**
 * PropertyDiscoveryMap — Phase 2 interactive discovery map.
 *
 * Renders clustered, price-labelled markers for the supplied listings, a preview
 * popup on marker click, two-way selection sync with the results list, and emits
 * the visible bounds (debounced) so the parent can keep the list in step with the
 * viewport. Uses Advanced Markers + @googlemaps/markerclusterer.
 *
 * Gated on a configured browser key (GOOGLE_MAP_KEY); when the key is missing it
 * renders a graceful notice instead of a blank map.
 */

import { useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  InfoWindow,
  useMap,
  useMapsLibrary,
  type MapEvent,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPinned } from 'lucide-react';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_MAP_ID,
  isMapsEnabled,
  cityCenter,
  type LatLngLiteral,
  type MapBounds,
} from '@/lib/maps/config';

export interface PropertyMarker {
  id: string;
  title: string;
  priceFormatted: string;
  locality: string;
  city: string;
  image?: string;
  location: LatLngLiteral;
}

interface DiscoveryMapProps {
  markers: PropertyMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBoundsChange: (bounds: MapBounds | null) => void;
  fallbackCity?: string;
}

export default function PropertyDiscoveryMap(props: DiscoveryMapProps) {
  if (!isMapsEnabled) {
    return (
      <div className="h-full w-full grid place-items-center bg-[#F1F5F9] text-center p-6">
        <div className="space-y-2 max-w-xs">
          <MapPinned className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <p className="text-sm font-bold text-[#0F2A43]">Map not configured</p>
          <p className="text-xs text-[#64748B]">
            Set <code className="text-[11px]">GOOGLE_MAP_KEY</code> to enable the
            interactive map. The list on the left still works.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <MapShell {...props} />
    </APIProvider>
  );
}

function MapShell({ markers, selectedId, onSelect, onBoundsChange, fallbackCity }: DiscoveryMapProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitBounds = (ev: MapEvent) => {
    const b = ev.map.getBounds();
    if (!b) return;
    const ne = b.getNorthEast();
    const sw = b.getSouthWest();
    const next: MapBounds = { north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng() };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onBoundsChange(next), 250);
  };

  const selected = markers.find((m) => m.id === selectedId) || null;

  return (
    <Map
      defaultCenter={cityCenter(fallbackCity)}
      defaultZoom={11}
      mapId={GOOGLE_MAPS_MAP_ID}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapTypeControl={false}
      streetViewControl={false}
      fullscreenControl
      className="w-full h-full"
      onIdle={emitBounds}
    >
      <ClusteredMarkers markers={markers} selectedId={selectedId} onSelect={onSelect} />
      <FitBounds markers={markers} fallbackCity={fallbackCity} />
      <PanToSelected selected={selected} />
      {selected && (
        <InfoWindow
          position={selected.location}
          onCloseClick={() => onSelect(null)}
          pixelOffset={[0, -36]}
          maxWidth={260}
        >
          <PreviewCard marker={selected} />
        </InfoWindow>
      )}
    </Map>
  );
}

/* --------------------------- clustered markers --------------------------- */

function ClusteredMarkers({
  markers,
  selectedId,
  onSelect,
}: {
  markers: PropertyMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  const markerLib = useMapsLibrary('marker');
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const elements = useRef<Record<string, HTMLElement>>({});

  // (Re)build markers + clusterer whenever the data or map changes.
  useEffect(() => {
    if (!map || !markerLib) return;

    const advanced: google.maps.marker.AdvancedMarkerElement[] = [];
    elements.current = {};

    for (const m of markers) {
      const el = buildPricePill(m.priceFormatted);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect(m.id);
      });
      elements.current[m.id] = el;

      const marker = new markerLib.AdvancedMarkerElement({
        position: m.location,
        content: el,
        title: m.title,
      });
      advanced.push(marker);
    }

    const clusterer = new MarkerClusterer({ map, markers: advanced });
    clustererRef.current = clusterer;

    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
      clustererRef.current = null;
      elements.current = {};
    };
  }, [map, markerLib, markers, onSelect]);

  // Reflect selection as a visual highlight without rebuilding the markers.
  useEffect(() => {
    for (const [id, el] of Object.entries(elements.current)) {
      applyPillStyle(el, id === selectedId);
    }
  }, [selectedId, markers]);

  return null;
}

function buildPricePill(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.textContent = label;
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  applyPillStyle(el, false);
  return el;
}

function applyPillStyle(el: HTMLElement, selected: boolean) {
  el.style.cssText = [
    'padding:3px 8px',
    'border-radius:9999px',
    'font-size:11px',
    'font-weight:800',
    'white-space:nowrap',
    'cursor:pointer',
    'box-shadow:0 1px 3px rgba(0,0,0,0.3)',
    'transform:translateY(-6px)',
    selected ? 'background:#0F2A43' : 'background:#ffffff',
    selected ? 'color:#ffffff' : 'color:#0F2A43',
    selected ? 'border:1.5px solid #0F2A43' : 'border:1.5px solid #18A67D',
    selected ? 'z-index:10' : 'z-index:1',
  ].join(';');
}

/* ------------------------------- fit bounds ------------------------------ */

function FitBounds({ markers, fallbackCity }: { markers: PropertyMarker[]; fallbackCity?: string }) {
  const map = useMap();
  // Signature changes only when the underlying data set changes (not on pan/zoom),
  // so we auto-fit on filter changes but never fight the user mid-pan.
  const signature = markers.map((m) => m.id).join(',');

  useEffect(() => {
    if (!map) return;
    if (markers.length === 0) {
      map.setCenter(cityCenter(fallbackCity));
      map.setZoom(fallbackCity ? 11 : 5);
      return;
    }
    if (markers.length === 1) {
      map.setCenter(markers[0].location);
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend(m.location));
    map.fitBounds(bounds, 64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature, fallbackCity]);

  return null;
}

/* ----------------------------- pan to selected --------------------------- */

function PanToSelected({ selected }: { selected: PropertyMarker | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && selected) map.panTo(selected.location);
  }, [map, selected]);
  return null;
}

/* ------------------------------ preview card ----------------------------- */

function PreviewCard({ marker }: { marker: PropertyMarker }) {
  return (
    <a href={`/properties/${marker.id}`} className="block w-[232px] no-underline">
      {marker.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={marker.image}
          alt={marker.title}
          className="w-full h-28 object-cover rounded-md mb-2"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="text-sm font-black text-[#0E7C5D] leading-tight">{marker.priceFormatted}</div>
      <div className="text-xs font-bold text-[#0F2A43] line-clamp-2 mt-0.5">{marker.title}</div>
      <div className="text-[11px] text-[#64748B] mt-0.5">
        {marker.locality}, {marker.city}
      </div>
      <span className="mt-1.5 inline-block text-[11px] font-bold text-[#18A67D]">View details →</span>
    </a>
  );
}
