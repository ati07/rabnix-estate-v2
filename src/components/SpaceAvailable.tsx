import { LayoutGrid } from 'lucide-react';

interface SpaceAvailableProps {
  /** Headline shown inside the placeholder box. */
  title?: string;
  /** Optional secondary line under the title. */
  message?: string;
  /** Extra classes for the outer box (e.g. min-height / width in carousels). */
  className?: string;
}

/**
 * Vacant-slot placeholder rendered wherever a section or page has no real,
 * approved data to show. Replaces the old static demo/mock fallbacks so the
 * live site never displays fabricated listings — an empty slot reads as
 * "inventory available", not "broken page".
 */
export function SpaceAvailable({
  title = 'Space available',
  message = 'This slot is open for new listings.',
  className = '',
}: SpaceAvailableProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-2 rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-6 py-10 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] shadow-2xs">
        <LayoutGrid className="w-5 h-5" />
      </div>
      <div className="text-sm sm:text-base font-bold text-[#475569]">{title}</div>
      {message && <div className="text-xs text-[#94A3B8] max-w-xs">{message}</div>}
    </div>
  );
}
