'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, ArrowUpRight, Home, IndianRupee, Percent } from 'lucide-react';
import { CityInfo } from '@/lib/types';
import type { LocalityInsight } from '@/lib/localityInsights';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface LocalityTrendsSectionProps {
  selectedCity: CityInfo;
  onSelectLocality: (locality: string) => void;
  onOpenAiValuation: () => void;
}

export function LocalityTrendsSection({
  selectedCity,
  onSelectLocality,
  onOpenAiValuation,
}: LocalityTrendsSectionProps) {
  const [insights, setInsights] = useState<LocalityInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/localities/insights?city=${encodeURIComponent(selectedCity.name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setInsights(Array.isArray(data.insights) ? data.insights : []);
      })
      .catch(() => {
        if (!cancelled) setInsights([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity.name]);

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
              Price Trends &amp; Rental Yields in {selectedCity.name}
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Live medians from verified owner-direct listings — not broker estimates.
            </p>
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <SpaceAvailable
            title="Not enough data yet"
            message={`We surface locality price trends & rental yields once enough owner-direct listings go live in ${selectedCity.name}.`}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((it) => (
              <LocalityInsightCard key={it.locality} insight={it} onSelect={() => onSelectLocality(it.locality)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LocalityInsightCard({ insight, onSelect }: { insight: LocalityInsight; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group text-left bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:border-[#18A67D]/50 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[#0F2A43] truncate group-hover:text-[#0E7C5D]">{insight.locality}</h3>
          <p className="text-[11px] text-[#64748B] font-semibold">
            {formatIndianNumber(insight.totalListings)} listings
            {insight.forSale > 0 && insight.forRent > 0
              ? ` · ${insight.forSale} sale / ${insight.forRent} rent`
              : insight.forSale > 0
                ? ' · for sale'
                : insight.forRent > 0
                  ? ' · for rent'
                  : ''}
          </p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#18A67D] shrink-0" />
      </div>

      <div className="space-y-1.5 text-sm">
        {insight.salePricePerSqFt != null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#64748B] text-xs">
              <IndianRupee className="w-3.5 h-3.5 text-[#18A67D]" /> Price / sq.ft.
            </span>
            <span className="font-bold text-[#0F2A43]">₹{formatIndianNumber(insight.salePricePerSqFt)}</span>
          </div>
        )}
        {insight.medianRent != null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#64748B] text-xs">
              <Home className="w-3.5 h-3.5 text-[#18A67D]" /> Median rent
            </span>
            <span className="font-bold text-[#0F2A43]">{formatIndianCurrency(insight.medianRent)}/mo</span>
          </div>
        )}
        {insight.rentalYieldPct != null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#64748B] text-xs">
              <Percent className="w-3.5 h-3.5 text-[#18A67D]" /> Rental yield
            </span>
            <span className="font-bold text-[#0E7C5D]">{insight.rentalYieldPct}% / yr</span>
          </div>
        )}
      </div>

      {insight.bhkMix.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-[#F1F5F9]">
          {insight.bhkMix.map((b) => (
            <span
              key={b}
              className="text-[10px] font-bold text-[#0F2A43] bg-[#F1F5F9] rounded px-1.5 py-0.5"
            >
              {b} BHK
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
