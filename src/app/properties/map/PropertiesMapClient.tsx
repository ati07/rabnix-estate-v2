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
import { List, MapIcon, MapPin, ShieldCheck, Loader2, SearchX, Target, X, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useProperties } from '@/lib/propertyContext';
import { CITIES_DATA } from '@/lib/realEstateData';
import {
  parseFiltersFromParams,
  filtersToParams,
  matchesFilters,
  sortProperties,
  countActiveFilters,
  MIN_SIZE_SQFT,
  type PropertyFilterState,
  type SortKey,
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

/** Upper price cap that means "no max" (matches parseFiltersFromParams). */
const MAX_PRICE_CAP = 100000000;

const LISTING_TYPE_OPTIONS: { id: PropertyFilterState['listingType']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'buy', label: 'Buy' },
  { id: 'rent', label: 'Rent' },
  { id: 'pg', label: 'PG' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'plot', label: 'Plots' },
];

const RESIDENTIAL_CATEGORIES = ['All', 'Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Studio', 'Residential Plot', 'PG / Co-Living'];
const COMMERCIAL_CATEGORIES = ['All', 'Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land'];
const BHK_OPTIONS = [1, 2, 3, 4, 5];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price_asc', label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
  { id: 'area_desc', label: 'Area: Largest' },
  { id: 'newest', label: 'Newest' },
];

const DEFAULT_FILTERS: PropertyFilterState = parseFiltersFromParams(new URLSearchParams());

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

  // Filters are the source of truth in local state (seeded once from the URL so a
  // shared link opens with the same filters), and are mirrored back to the URL.
  // Changing any control here re-filters the list AND the map markers live.
  const [filters, setFilters] = useState<PropertyFilterState>(() => parseFiltersFromParams(sp));
  const updateFilters = (patch: Partial<PropertyFilterState>) => setFilters((f) => ({ ...f, ...patch }));
  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const queryString = useMemo(() => filtersToParams(filters).toString(), [filters]);

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

  // Keep the URL in step with BOTH the filters and the radius circle, so the link
  // is shareable and reopens the exact same view. Written via replaceState to
  // avoid piling up history entries / re-render churn.
  useEffect(() => {
    const params = filtersToParams(filters);
    if (radiusCenter) {
      params.set('lat', radiusCenter.lat.toFixed(6));
      params.set('lng', radiusCenter.lng.toFixed(6));
      params.set('radius', String(radiusMeters));
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters, radiusCenter, radiusMeters]);

  // Turn radius search on, centering on the current viewport (or the city).
  const enableRadius = () => {
    const center = bounds ? boundsCenter(bounds) : cityCenter(fallbackCity);
    setRadiusCenter(center);
    if (!RADIUS_PRESETS_M.includes(radiusMeters)) setRadiusMeters(DEFAULT_RADIUS_M);
  };
  const clearRadius = () => setRadiusCenter(null);

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] flex flex-col">
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

      {/* Interactive filter + search bar — drives both the list and the map */}
      <MapFilterBar
        filters={filters}
        activeCount={activeCount}
        resultCount={filtered.length}
        onChange={updateFilters}
        onReset={resetFilters}
      />

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

function MapFilterBar({
  filters,
  activeCount,
  resultCount,
  onChange,
  onReset,
}: {
  filters: PropertyFilterState;
  activeCount: number;
  resultCount: number;
  onChange: (patch: Partial<PropertyFilterState>) => void;
  onReset: () => void;
}) {
  const isCommercial = filters.listingType === 'commercial';
  const categories = isCommercial ? COMMERCIAL_CATEGORIES : RESIDENTIAL_CATEGORIES;

  // Switching listing type can invalidate category/bhk — reset those so we never
  // keep, say, a residential BHK while showing commercial listings.
  const changeListingType = (id: PropertyFilterState['listingType']) =>
    onChange({ listingType: id, category: 'All', bhk: [] });

  const selectCls =
    'px-2.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] outline-none cursor-pointer focus:border-[#18A67D] focus:bg-white';

  return (
    <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 shrink-0">
      <div className="flex flex-wrap items-center gap-2">
        {/* Keyword / locality search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={filters.searchQuery}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search locality, project, keyword…"
            className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] placeholder:text-[#94A3B8] outline-none focus:border-[#18A67D] focus:bg-white"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ searchQuery: '' })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F2A43] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* City */}
        <select
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value })}
          className={selectCls}
          aria-label="City"
        >
          <option value="All">All Cities</option>
          {CITIES_DATA.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Listing type (segmented) */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-0.5">
          {LISTING_TYPE_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => changeListingType(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filters.listingType === t.id ? 'bg-[#0F2A43] text-white' : 'text-[#64748B] hover:text-[#0F2A43]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Commercial deal type */}
        {isCommercial && (
          <select
            value={filters.commercialDealType}
            onChange={(e) => onChange({ commercialDealType: e.target.value as PropertyFilterState['commercialDealType'] })}
            className={selectCls}
            aria-label="Commercial deal type"
          >
            <option value="all">Sale & Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        )}

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={selectCls}
          aria-label="Property type"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Types' : c}</option>
          ))}
        </select>

        {/* BHK chips (residential only) */}
        {!isCommercial && (
          <div className="flex items-center gap-1">
            {BHK_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => onChange({ bhk: filters.bhk.includes(n) ? [] : [n] })}
                className={`w-9 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filters.bhk.includes(n) ? 'bg-[#18A67D] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
              >
                {n}
              </button>
            ))}
            <span className="text-[11px] text-[#94A3B8] font-semibold">BHK</span>
          </div>
        )}

        {/* Price range */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={filters.minPrice || ''}
            onChange={(e) => onChange({ minPrice: Number(e.target.value) || 0 })}
            placeholder="Min ₹"
            className="w-24 px-2.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] placeholder:text-[#94A3B8] outline-none focus:border-[#18A67D] focus:bg-white"
          />
          <span className="text-[#CBD5E1]">–</span>
          <input
            type="number"
            min={0}
            value={filters.maxPrice < MAX_PRICE_CAP ? filters.maxPrice : ''}
            onChange={(e) => onChange({ maxPrice: Number(e.target.value) || MAX_PRICE_CAP })}
            placeholder="Max ₹"
            className="w-24 px-2.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] placeholder:text-[#94A3B8] outline-none focus:border-[#18A67D] focus:bg-white"
          />
        </div>

        {/* Verified / Owner toggles */}
        <button
          onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly })}
          className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            filters.verifiedOnly ? 'bg-[#18A67D] text-white border-[#18A67D]' : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#18A67D]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Verified
        </button>
        <button
          onClick={() => onChange({ ownerOnly: !filters.ownerOnly })}
          className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            filters.ownerOnly ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#0F2A43]'
          }`}
        >
          Owner
        </button>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value as SortKey })}
          className={`${selectCls} ml-auto`}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Result count + reset */}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B] px-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#18A67D]" />
          {resultCount} match{resultCount === 1 ? '' : 'es'}
          {activeCount > 0 && (
            <span className="ml-1 w-4 h-4 rounded-full bg-[#18A67D] text-white text-[10px] flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
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
