'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkPlus, Bell, BellOff, X, Check } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import type { PropertyFilterState } from '@/lib/propertyFilters';

/**
 * Saved searches for the /properties catalog. Lets a signed-in user store the
 * current filter set and reapply it in one click; each saved search shows a
 * "N new" badge of matching listings posted since they last looked, and can
 * drive new-listing email alerts (toggled with the bell). Guests see a prompt
 * to sign in.
 *
 * Self-contained: owns its own fetch/state against /api/saved-searches so the
 * catalog page only has to pass the current filters + an apply callback.
 */

interface SavedSearchDTO {
  id: string;
  name: string;
  filters: PropertyFilterState;
  activeFilterCount: number;
  alertsEnabled: boolean;
  newCount: number;
  lastNotifiedAt: string | null;
  createdAt: string;
}

interface Props {
  currentFilters: PropertyFilterState;
  activeFilterCount: number;
  onApply: (filters: PropertyFilterState) => void;
}

/** A human default name derived from the active filters. */
function defaultName(f: PropertyFilterState): string {
  const parts: string[] = [];
  if (f.bhk.length) parts.push(`${[...f.bhk].sort((a, b) => a - b).join('/')} BHK`);
  if (f.category && f.category !== 'All') parts.push(f.category);
  else if (f.listingType && f.listingType !== 'all') parts.push(f.listingType);
  parts.push(`in ${f.city && f.city !== 'All' ? f.city : 'all cities'}`);
  const name = parts.join(' ').trim();
  return name.length > 1 ? name.charAt(0).toUpperCase() + name.slice(1) : 'My search';
}

export function SavedSearchesBar({ currentFilters, activeFilterCount, onApply }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearchDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [naming, setNaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setSearches([]); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/saved-searches', { credentials: 'same-origin' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.savedSearches)) setSearches(data.savedSearches);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const startSaving = () => {
    if (!user) { router.push('/auth'); return; }
    setError(null);
    setDraftName(defaultName(currentFilters));
    setNaming(true);
  };

  const save = async () => {
    const name = draftName.trim();
    if (!name) { setError('Give your search a name.'); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, filters: currentFilters }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.savedSearch) {
        setSearches((prev) => [data.savedSearch, ...prev]);
        setNaming(false);
        setDraftName('');
      } else {
        setError(data.error || 'Could not save search.');
      }
    } finally {
      setBusy(false);
    }
  };

  const applySearch = (s: SavedSearchDTO) => {
    onApply(s.filters);
    // Clear its "new" badge — mark matches as seen on the server.
    if (s.newCount > 0) {
      fetch(`/api/saved-searches?id=${encodeURIComponent(s.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ markSeen: true }),
      }).catch(() => {});
      setSearches((prev) => prev.map((x) => (x.id === s.id ? { ...x, newCount: 0 } : x)));
    }
  };

  const toggleAlerts = async (s: SavedSearchDTO) => {
    const next = !s.alertsEnabled;
    setSearches((prev) => prev.map((x) => (x.id === s.id ? { ...x, alertsEnabled: next } : x)));
    await fetch(`/api/saved-searches?id=${encodeURIComponent(s.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ alertsEnabled: next }),
    }).catch(() => {});
  };

  const remove = async (s: SavedSearchDTO) => {
    setSearches((prev) => prev.filter((x) => x.id !== s.id));
    await fetch(`/api/saved-searches?id=${encodeURIComponent(s.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }).catch(() => {});
  };

  const canSave = activeFilterCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs px-3.5 py-3 space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#0F2A43] uppercase tracking-wide">
          <Bookmark className="w-3.5 h-3.5 text-[#18A67D]" />
          Saved searches
        </div>

        {!naming ? (
          <button
            type="button"
            onClick={startSaving}
            disabled={!!user && !canSave}
            title={user && !canSave ? 'Set at least one filter to save a search' : 'Save the current filters'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAF7F2] text-[#0E7C5D] text-xs font-bold border border-[#C9E9DD] hover:bg-[#D7F0E7] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            {user ? 'Save this search' : 'Sign in to save & get alerts'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setNaming(false); }}
              maxLength={80}
              placeholder="Name this search"
              className="px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#0F2A43] outline-none focus:border-[#18A67D] w-48"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18A67D] text-white text-xs font-bold hover:bg-[#0E7C5D] disabled:opacity-60 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => setNaming(false)}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F2A43] cursor-pointer"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
      </div>

      {user && searches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {searches.map((s) => (
            <span
              key={s.id}
              className="group inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full pl-1 pr-1.5 py-0.5 text-xs"
            >
              <button
                type="button"
                onClick={() => applySearch(s)}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 font-bold text-[#0F2A43] hover:text-[#0E7C5D] cursor-pointer"
                title="Apply this search"
              >
                {s.name}
                {s.newCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#18A67D] text-white text-[10px] font-bold">
                    {s.newCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toggleAlerts(s)}
                className={`p-1 rounded-full cursor-pointer ${s.alertsEnabled ? 'text-[#18A67D] hover:bg-[#EAF7F2]' : 'text-[#94A3B8] hover:bg-slate-100'}`}
                title={s.alertsEnabled ? 'Email alerts on — click to mute' : 'Email alerts off — click to enable'}
                aria-label={s.alertsEnabled ? 'Mute email alerts' : 'Enable email alerts'}
              >
                {s.alertsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => remove(s)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Delete saved search"
                aria-label="Delete saved search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {user && !loading && searches.length === 0 && !naming && (
        <p className="text-[11px] text-[#64748B]">
          Save a filter set to get an email when matching owner-direct listings go live.
        </p>
      )}
    </div>
  );
}
