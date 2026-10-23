'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, CheckCircle2 } from 'lucide-react';
import { extractListingFromText } from '@/lib/genie/listingAssist';
import type { GenieListingDraft } from '@/lib/genie/listingDraft';

/**
 * Option 1 — "Describe your property" box. The owner types (or pastes) a few
 * lines about their property; Genie extracts the structured fields and we apply
 * them to the live form via onApply. Only mentioned fields are returned, so this
 * never clobbers choices the user already made. Reusable on /post-property and
 * the dashboard upload form.
 */
export function ListingGenieBox({
  onApply,
  className = '',
}: {
  onApply: (draft: Partial<GenieListingDraft>) => void;
  className?: string;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filledCount, setFilledCount] = useState<number | null>(null);

  const run = async () => {
    const value = text.trim();
    if (!value || busy) return;
    setError(null);
    setFilledCount(null);
    setBusy(true);
    try {
      const draft = await extractListingFromText(value);
      const keys = Object.keys(draft);
      if (keys.length === 0) {
        setError("I couldn't pick out any details — try mentioning the purpose, type, city, locality and price.");
        return;
      }
      onApply(draft);
      setFilledCount(keys.length);
    } catch (e: any) {
      setError(e?.message || 'Genie could not read that. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-[#18A67D]/30 bg-gradient-to-br from-[#E7F6F1] to-white p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#18A67D] text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#0F2A43]">Fill it fast with Genie</p>
          <p className="text-[11px] text-[#64748B]">
            Describe your property in a line or two — Genie fills the form. You can edit everything after.
          </p>
        </div>
      </div>

      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy}
        placeholder="e.g. Selling my 3 BHK semi-furnished apartment in Baner, Pune — 1450 sq.ft, ready to move, ₹1.35 crore"
        className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm outline-none focus:border-[#18A67D] resize-none"
      />

      <div className="flex items-center gap-3 mt-2.5">
        <button
          type="button"
          onClick={run}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18A67D] text-white text-xs font-bold hover:bg-[#0E7C5D] transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {busy ? 'Reading…' : 'Fill with Genie'}
        </button>

        {filledCount != null && !error && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0E7C5D]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Filled {filledCount} field{filledCount === 1 ? '' : 's'} — please review below.
          </span>
        )}
        {error && <span className="text-[11px] font-medium text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
