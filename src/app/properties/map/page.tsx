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

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { List, MapIcon, MapPin, ShieldCheck, Loader2, SearchX } from 'lucide-react';
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
  type MapBounds,
} from '@/lib/maps/config';
import PropertyDiscoveryMap, { type PropertyMarker } from '@/components/map/PropertyDiscoveryMap';
import type { Property } from '@/lib/types';

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

  // The list tracks the viewport: when bounds are set, show only in-view markers.
  const visibleMarkers = useMemo(() => {
    if (!bounds) return markers;
    return markers.filter((m) => withinBounds(m.location, bounds));
  }, [markers, bounds]);

  const fallbackCity = filters.city !== 'All' ? filters.city : undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo />
          <div className="hidden sm:block h-5 w-px bg-[#E2E8F0]" />
          <p className="hidden sm:block text-xs text-[#64748B] truncate">
            <span className="font-bold text-[#0F2A43]">{markers.length}</span> on map
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
  unmappedCount,
  queryString,
}: {
  isLoading: boolean;
  markers: PropertyMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  bounded: boolean;
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
        {markers.length} {bounded ? 'in this area' : 'with map location'}
      </p>

      {markers.length === 0 ? (
        <div className="grid place-items-center text-center py-16 px-6 space-y-3">
          <SearchX className="w-9 h-9 text-[#CBD5E1]" />
          <p className="text-sm font-bold text-[#0F2A43]">
            {bounded ? 'No listings in this part of the map' : 'No mappable listings here'}
          </p>
          <p className="text-xs text-[#64748B] max-w-xs">
            {bounded
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
  marker: PropertyMarker;
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
