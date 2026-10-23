'use client';

import React from 'react';
import { TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';
import { CityInfo } from '@/lib/types';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface LocalityTrendsSectionProps {
  selectedCity: CityInfo;
  onSelectLocality: (locality: string) => void;
  onOpenAiValuation: () => void;
}

export function LocalityTrendsSection({
  selectedCity,
  onOpenAiValuation,
}: LocalityTrendsSectionProps) {
  return (
    <section className="bg-white py-10 px-4 sm:px-8 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#18A67D] uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>BayBayt Market Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-0.5">
              Price Trends & Rental Yields in {selectedCity.name}
            </h2>
          </div>

          <button
            onClick={onOpenAiValuation}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold text-[#18A67D] hover:text-[#0E7C5D] bg-[#E7F6F1] hover:bg-[#d5f0e7] border border-[#18A67D]/30 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Check Any Locality Valuation</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Trend cards appear here once live locality price intelligence is available. */}
        <SpaceAvailable
          title="Space available"
          message={`Locality price trends & rental yields for ${selectedCity.name} will appear here.`}
        />

      </div>
    </section>
  );
}
