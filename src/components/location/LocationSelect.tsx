'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Check, MapPin, Search } from 'lucide-react';
import {
  getCountryNames,
  getStates,
  getCities,
  findCityInState,
  normalizeCityName,
} from '@/lib/locationData';

export interface LocationValue {
  country: string;
  state: string;
  city: string;
}

interface LocationSelectProps {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  className?: string;
}

/**
 * Cascading Country → State → City picker. All three are searchable comboboxes.
 * City additionally lets the user add a city that isn't listed — validated
 * against the existing cities of that state (case-insensitive) so we never
 * create a near-duplicate; a match reuses the canonical spelling. Cities that
 * already appear on approved listings for the selected state are fetched from
 * the server and merged into the suggestions.
 */
export function LocationSelect({ value, onChange, className }: LocationSelectProps) {
  const countries = getCountryNames();
  const states = getStates(value.country);

  // Cities already posted (approved) for the selected state — surfaced as extra
  // suggestions so user-added cities reappear instead of needing re-adding.
  const [postedCities, setPostedCities] = useState<string[]>([]);
  useEffect(() => {
    if (!value.state) {
      setPostedCities([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/cities/distinct?state=${encodeURIComponent(value.state)}`, {
      credentials: 'same-origin',
    })
      .then((r) => (r.ok ? r.json() : { cities: [] }))
      .then((data) => {
        if (cancelled) return;
        const names = Array.isArray(data?.cities)
          ? data.cities.map((c: { name: string }) => c.name).filter(Boolean)
          : [];
        setPostedCities(names);
      })
      .catch(() => {
        if (!cancelled) setPostedCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [value.state]);

  const handleCountry = (country: string) => {
    // Reset the downstream fields — a new country has its own states/cities.
    onChange({ country, state: '', city: '' });
  };

  const handleState = (state: string) => {
    onChange({ ...value, state, city: '' });
  };

  const handleCity = (city: string) => {
    onChange({ ...value, city });
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className ?? ''}`}>
      {/* Country */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#172033] uppercase">Country *</label>
        <SearchableSelect
          options={countries}
          value={value.country}
          onChange={handleCountry}
          placeholder="Select country…"
        />
      </div>

      {/* State */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#172033] uppercase">State *</label>
        <SearchableSelect
          options={states}
          value={value.state}
          onChange={handleState}
          placeholder="Select state…"
          disabled={states.length === 0}
          disabledText="No states available"
        />
      </div>

      {/* City (searchable + add) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#172033] uppercase">City *</label>
        <CityCombobox
          country={value.country}
          state={value.state}
          value={value.city}
          onChange={handleCity}
          extraCities={postedCities}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledText?: string;
}

/** A plain searchable dropdown (no free-text add). Used for Country & State. */
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  disabled = false,
  disabledText,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed ? options.filter((o) => o.toLowerCase().includes(trimmed)) : options;

  const select = (opt: string) => {
    onChange(opt);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-left focus:bg-white focus:border-[#18A67D] outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${value ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
          {disabled ? disabledText || placeholder : value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F1F5F9]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length >= 1) {
                  e.preventDefault();
                  select(filtered[0]);
                }
              }}
              placeholder="Search…"
              className="w-full text-xs sm:text-sm text-[#172033] bg-transparent outline-none placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => select(opt)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm text-[#172033] hover:bg-[#F1F5F9] text-left cursor-pointer"
              >
                <span className="truncate">{opt}</span>
                {value.toLowerCase() === opt.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-[#94A3B8]">No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface CityComboboxProps {
  country: string;
  state: string;
  value: string;
  onChange: (city: string) => void;
  extraCities?: string[];
}

function CityCombobox({ country, state, value, onChange, extraCities = [] }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const disabled = !state;

  // Popular cities for the state, merged with any DB-supplied extras (deduped).
  const cities = useMemo(() => {
    const base = getCities(country, state);
    const seen = new Set(base.map((c) => c.toLowerCase()));
    const merged = [...base];
    for (const extra of extraCities) {
      const key = extra.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(extra.trim());
      }
    }
    return merged.sort((a, b) => a.localeCompare(b));
  }, [country, state, extraCities]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const trimmed = query.trim();
  const filtered = trimmed
    ? cities.filter((c) => c.toLowerCase().includes(trimmed.toLowerCase()))
    : cities;
  const exactInList = cities.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length >= 2 && !exactInList;

  const select = (city: string) => {
    onChange(city);
    setQuery('');
    setOpen(false);
  };

  const addTyped = () => {
    // Validation: if the typed city already exists in this state (any casing),
    // reuse the canonical entry instead of creating a duplicate.
    const existing =
      findCityInState(country, state, trimmed) ||
      cities.find((c) => c.toLowerCase() === trimmed.toLowerCase()) ||
      null;
    select(existing ?? normalizeCityName(trimmed));
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-left focus:bg-white focus:border-[#18A67D] outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`flex items-center gap-1.5 truncate ${value ? 'text-[#172033]' : 'text-[#94A3B8]'}`}>
          <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
          {value || (disabled ? 'Select a state first' : 'Select or add city…')}
        </span>
        <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F1F5F9]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (canAdd) addTyped();
                  else if (filtered.length === 1) select(filtered[0]);
                }
              }}
              placeholder="Search city…"
              className="w-full text-xs sm:text-sm text-[#172033] bg-transparent outline-none placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => select(c)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm text-[#172033] hover:bg-[#F1F5F9] text-left cursor-pointer"
              >
                <span className="truncate">{c}</span>
                {value.toLowerCase() === c.toLowerCase() && (
                  <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
                )}
              </button>
            ))}

            {filtered.length === 0 && !canAdd && (
              <div className="px-3 py-3 text-xs text-[#94A3B8]">
                Type at least 2 characters to add a new city.
              </div>
            )}

            {canAdd && (
              <button
                type="button"
                onClick={addTyped}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-[#0E7C5D] hover:bg-[#E7F6F1] text-left border-t border-[#F1F5F9] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Add &ldquo;{normalizeCityName(trimmed)}&rdquo; to {state}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
