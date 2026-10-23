'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * Small inline "ask Genie" button for field-level assists (write description,
 * estimate price, …). Owns its own busy/error state and surfaces failures
 * inline so a flaky AI call never blocks the form.
 */
export function GenieAssistButton({
  label,
  busyLabel = 'Thinking…',
  onRun,
  className = '',
}: {
  label: string;
  busyLabel?: string;
  onRun: () => Promise<void>;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await onRun();
    } catch (e: any) {
      setError(e?.message || 'Genie could not help right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors disabled:opacity-60 ${
          busy
            ? 'bg-[#E7F6F1] border-[#18A67D]/40 text-[#0E7C5D]'
            : 'bg-[#E7F6F1] border-[#18A67D]/40 text-[#0E7C5D] hover:bg-[#18A67D] hover:text-white'
        } ${className}`}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {busy ? busyLabel : label}
      </button>
      {error && <span className="text-[11px] font-medium text-rose-600">{error}</span>}
    </span>
  );
}
