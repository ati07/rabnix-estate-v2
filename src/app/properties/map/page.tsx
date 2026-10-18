'use client';

/**
 * /properties/map — Phase 2 interactive discovery view.
 *
 * A split layout: results list on the left, live Google map on the right. It
 * reuses the SAME filter logic as the /properties catalog (src/lib/propertyFilters)
 * and the SAME client data source (useProperties), so the two pages stay in sync
 * and no second fetch is needed. The map shows price-pill markers for listings
 * that have real coordinates; panning/zooming narrows the list to the markers in
 * view, and clicking a card or marker selects the other.
 *
 * Listings without saved coordinates can't be placed on the map — rather than
 * invent a pin, we keep them out of the map list and surface a count + a link to
 * the full catalog, so the data gap is honest and visible.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { List, MapIcon, MapPin, ShieldCheck, Loader2, SearchX, Target, X } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useProperties } from '@/lib/propertyContext';
import {
  parseFiltersFromParams,
  matchesFilters,
  sortProperties,
} from '@/lib/propertyFilters';
import {
  normalizeCoordinates,
  withinBounds,
  haversineMeters,
  formatDistance,
  cityCenter,
  type MapBounds,
  type LatLngLiteral,
} from '@/lib/maps/config';
import PropertyDiscoveryMap, { type PropertyMarker } from '@/components/map/PropertyDiscoveryMap';
import type { Property } from '@/lib/types';

/** A marker optionally annotated with its straight-line distance from the radius
 *  center (present only in radius-search mode). */
type DisplayMarker = PropertyMarker & { distanceMeters?: number };

/** Radius presets offered in the UI, in metres. */
const RADIUS_PRESETS_M = [1000, 2000, 5000, 10000];
const DEFAULT_RADIUS_M = 3000;

function toMarker(p: Property): PropertyMarker | null {
  const loc = normalizeCoordinates(p.coordinates);
  if (!loc) return null;
  return {
    id: p.id,
    title: p.title,
    priceFormatted: p.priceFormatted,
    locality: p.locality,
    city: p.city,
    image: p.images?.[0],
    location: loc,
  };
}

/** Midpoint of a viewport, used to seed the radius center from "search this area". */
function boundsCenter(b: MapBounds): LatLngLiteral {
  return { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 };
}

function MapPageContent() {
  const sp = useSearchParams();
  const { properties, isLoading } = useProperties();

  const filters = useMemo(() => parseFiltersFromParams(sp), [sp]);
  const queryString = sp.toString();

  // Full filtered + sorted set (mirrors the catalog page exactly).
  const filtered = useMemo(
    () => sortProperties(properties.filter((p) => matchesFilters(p, filters)), filters.sortBy),
    [properties, filters],
  );

  // Split into mappable (valid coordinates) and the rest.
  const { markers, unmappedCount } = useMemo(() => {
    const ms: PropertyMarker[] = [];
    let unmapped = 0;
    for (const p of filtered) {
      const m = toMarker(p);
      if (m) ms.push(m);
      else unmapped++;
    }
    return { markers: ms, unmappedCount: unmapped };
  }, [filtered]);

  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');

  // Radius ("area distance") search. Seeded once from the URL so a shared link
  // re-opens the same circle; thereafter it is driven by the on-map controls and
  // written back to the URL one-way (see the effect below).
  const [radiusCenter, setRadiusCenter] = useState<LatLngLiteral | null>(() => {
    const c = normalizeCoordinates({ lat: Number(sp.get('lat')), lng: Number(sp.get('lng')) });
    return c;
  });
  const [radiusMeters, setRadiusMeters] = useState<number>(() => {
    const r = parseInt(sp.get('radius') || '', 10);
    return Number.isFinite(r) && r > 0 ? r : DEFAULT_RADIUS_M;
  });
  const radiusActive = !!radiusCenter;

  const fallbackCity = filters.city !== 'All' ? filters.city : undefined;

  // The list reflects either the radius circle (distance-sorted) or, when radius
  // search is off, the current map viewport.
  const visibleMarkers = useMemo<DisplayMarker[]>(() => {
    if (radiusCenter) {
      return markers
        .map((m) => ({ ...m, distanceMeters: Math.round(haversineMeters(radiusCenter, m.location)) }))
        .filter((m) => m.distanceMeters! <= radiusMeters)
        .sort((a, b) => a.distanceMeters! - b.distanceMeters!);
    }
    if (!bounds) return markers;
    return markers.filter((m) => withinBounds(m.location, bounds));
  }, [markers, bounds, radiusCenter, radiusMeters]);

  // Keep the URL in step with the radius circle (shareable, no re-render churn).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (radiusCenter) {
      params.set('lat', radiusCenter.lat.toFixed(6));
      params.set('lng', radiusCenter.lng.toFixed(6));
      params.set('radius', String(radiusMeters));
    } else {
      params.delete('lat');
      params.delete('lng');
      params.delete('radius');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [radiusCenter, radiusMeters]);

  // Turn radius search on, centering on the current viewport (or the city).
  const enableRadius = () => {
    const center = bounds ? boundsCenter(bounds) : cityCenter(fallbackCity);
    setRadiusCenter(center);
    if (!RADIUS_PRESETS_M.includes(radiusMeters)) setRadiusMeters(DEFAULT_RADIUS_M);
  };
  const clearRadius = () => setRadiusCenter(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 group select-none" aria-label="BayBayt home">
            <BrandLogo />
          </Link>
          <div className="hidden sm:block h-5 w-px bg-[#E2E8F0]" />
          <p className="hidden sm:block text-xs text-[#64748B] truncate">
            <span className="font-bold text-[#0F2A43]">
              {radiusActive ? visibleMarkers.length : markers.length}
            </span>{' '}
            {radiusActive ? `within ${formatDistance(radiusMeters)}` : 'on map'}
            {unmappedCount > 0 && <span> · {unmappedCount} without a pin</span>}
          </p>
        </div>
        <Link
          href={`/properties${queryString ? `?${queryString}` : ''}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-colors"
        >
          <List className="w-4 h-4" />
          <span>List view</span>
        </Link>
      </header>

      {/* Radius ("area distance") search controls */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2 shrink-0">
        {!radiusActive ? (
          <button
            onClick={enableRadius}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#18A67D] text-[#0E7C5D] bg-[#18A67D]/5 hover:bg-[#18A67D]/10 text-xs font-bold transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4" /> Search within a radius
          </button>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
              <Target className="w-4 h-4 text-[#18A67D]" /> Within
            </span>
            <div className="flex items-center gap-1">
              {RADIUS_PRESETS_M.map((m) => (
                <button
                  key={m}
                  onClick={() => setRadiusMeters(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    radiusMeters === m ? 'bg-[#0F2A43] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {m >= 1000 ? `${m / 1000} km` : `${m} m`}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline text-[11px] text-[#94A3B8]">
              Tap the map or drag the pin to move the center.
            </span>
            <button
              onClick={clearRadius}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#64748B] hover:text-[#0F2A43] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </>
        )}
      </div>

      {/* Mobile list/map toggle */}
      <div className="lg:hidden flex items-center gap-1 p-2 bg-white border-b border-[#E2E8F0] shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mobileView === 'list' ? 'bg-[#0F2A43] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
          }`}
        >
          <List className="w-4 h-4" /> List ({visibleMarkers.length})
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mobileView === 'map' ? 'bg-[#0F2A43] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
          }`}
        >
          <MapIcon className="w-4 h-4" /> Map
        </button>
      </div>

      {/* Split body */}
      <div className="flex-1 min-h-0 flex">
        {/* List panel */}
        <aside
          className={`w-full lg:w-[400px] xl:w-[440px] shrink-0 overflow-y-auto border-r border-[#E2E8F0] bg-[#F8FAFC] ${
            mobileView === 'list' ? 'block' : 'hidden'
          } lg:block`}
        >
          <ListPanel
            isLoading={isLoading}
            markers={visibleMarkers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            bounded={!!bounds}
            radiusActive={radiusActive}
            radiusMeters={radiusMeters}
            unmappedCount={unmappedCount}
            queryString={queryString}
          />
        </aside>

        {/* Map panel */}
        <div
          className={`flex-1 min-w-0 relative ${mobileView === 'map' ? 'block' : 'hidden'} lg:block`}
        >
          <PropertyDiscoveryMap
            markers={markers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onBoundsChange={setBounds}
            fallbackCity={fallbackCity}
            radiusCenter={radiusCenter}
            radiusMeters={radiusMeters}
            onCenterChange={setRadiusCenter}
          />
        </div>
      </div>
    </div>
  );
}

function ListPanel({
  isLoading,
  markers,
  selectedId,
  onSelect,
  bounded,
  radiusActive,
  radiusMeters,
  unmappedCount,
  queryString,
}: {
  isLoading: boolean;
  markers: DisplayMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  bounded: boolean;
  radiusActive: boolean;
  radiusMeters: number;
  unmappedCount: number;
  queryString: string;
}) {
  if (isLoading) {
    return (
      <div className="h-full grid place-items-center p-8 text-[#64748B]">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading listings…
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide px-1">
        {markers.length}{' '}
        {radiusActive ? `within ${formatDistance(radiusMeters)}` : bounded ? 'in this area' : 'with map location'}
      </p>

      {markers.length === 0 ? (
        <div className="grid place-items-center text-center py-16 px-6 space-y-3">
          <SearchX className="w-9 h-9 text-[#CBD5E1]" />
          <p className="text-sm font-bold text-[#0F2A43]">
            {radiusActive
              ? 'No listings inside this radius'
              : bounded
                ? 'No listings in this part of the map'
                : 'No mappable listings here'}
          </p>
          <p className="text-xs text-[#64748B] max-w-xs">
            {radiusActive
              ? 'Widen the radius, or drag the pin to a busier area.'
              : bounded
                ? 'Zoom out or pan to see more pins.'
                : 'None of the matching listings have a saved map location yet.'}
          </p>
          <Link
            href={`/properties${queryString ? `?${queryString}` : ''}`}
            className="text-xs font-bold text-[#18A67D] hover:underline"
          >
            Browse all results in list view →
          </Link>
        </div>
      ) : (
        markers.map((m) => (
          <ListCard
            key={m.id}
            marker={m}
            selected={m.id === selectedId}
            onSelect={() => onSelect(m.id)}
          />
        ))
      )}

      {unmappedCount > 0 && markers.length > 0 && (
        <div className="mt-2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-center">
          <p className="text-[11px] text-[#64748B]">
            <span className="font-bold text-[#0F2A43]">{unmappedCount}</span> more matching listing
            {unmappedCount === 1 ? '' : 's'} don&apos;t have a map location yet.
          </p>
          <Link
            href={`/properties${queryString ? `?${queryString}` : ''}`}
            className="text-[11px] font-bold text-[#18A67D] hover:underline"
          >
            See them in list view →
          </Link>
        </div>
      )}
    </div>
  );
}

function ListCard({
  marker,
  selected,
  onSelect,
}: {
  marker: DisplayMarker;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onMouseEnter={onSelect}
      onClick={onSelect}
      className={`flex gap-3 rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all ${
        selected
          ? 'border-[#18A67D] ring-2 ring-[#18A67D]/30 shadow-md'
          : 'border-[#E2E8F0] hover:shadow-sm'
      }`}
    >
      <div className="relative w-28 shrink-0 bg-slate-100">
        <Image
          src={
            marker.image ||
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
          }
          alt={marker.title}
          fill
          referrerPolicy="no-referrer"
          className="object-cover"
          sizes="112px"
        />
        {marker.distanceMeters !== undefined && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-[#0F2A43]/85 text-white text-[10px] font-bold">
            {formatDistance(marker.distanceMeters)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 py-2.5 pr-3 space-y-0.5">
        <div className="text-sm font-black text-[#0E7C5D]">{marker.priceFormatted}</div>
        <h3 className="text-xs font-bold text-[#0F2A43] truncate" title={marker.title}>
          {marker.title}
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
          <MapPin className="w-3 h-3 text-[#18A67D] shrink-0" />
          <span className="truncate">
            {marker.locality}, {marker.city}
          </span>
        </div>
        <Link
          href={`/properties/${marker.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18A67D] hover:underline pt-0.5"
        >
          <ShieldCheck className="w-3 h-3" /> View details →
        </Link>
      </div>
    </div>
  );
}

export default function PropertiesMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#F8FAFC] text-[#64748B]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
