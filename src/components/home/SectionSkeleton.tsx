'use client';

import React from 'react';

/**
 * Shared loading placeholders for the home sections. They mirror the card shape
 * (image block + a few text lines) with a subtle pulse, so a section shows a
 * "loading" state while its data is in flight instead of briefly flashing the
 * empty "Space available" placeholder. Matches the existing skeleton style used
 * by LocalityTrendsSection (rounded, bg-[#F1F5F9], animate-pulse).
 */

function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#E2E8F0] bg-white ${className}`}>
      <div className="h-40 w-full bg-[#F1F5F9] animate-pulse" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 w-3/4 rounded bg-[#F1F5F9] animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-[#F1F5F9] animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-[#F1F5F9] animate-pulse" />
      </div>
    </div>
  );
}

/** Horizontal carousel loading row — matches the home card carousels. */
export function CarouselSkeleton({
  count = 4,
  cardWidth = 'w-[270px]',
}: {
  count?: number;
  cardWidth?: string;
}) {
  return (
    <div className="flex gap-5 overflow-hidden pb-4" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} className={`flex-shrink-0 ${cardWidth}`} />
      ))}
    </div>
  );
}

/** Grid loading block — matches the grid-based sections. */
export function GridSkeleton({
  count = 4,
  className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}
