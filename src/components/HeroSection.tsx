'use client';

import React from 'react';
import { 
  Search, 
  MapPin, 
  Home, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ListingType, FilterState } from '@/types';
import { INDIAN_CITIES } from '@/data/mockProperties';

interface HeroSectionProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onSearchSubmit: () => void;
  onOpenValuation: () => void;
}

export function HeroSection({
  filters,
  onFilterChange,
  onSearchSubmit,
  onOpenValuation
}: HeroSectionProps) {
  const listingTabs: { id: ListingType; label: string; badge?: string }[] = [
    { id: 'buy', label: 'Buy' },
    { id: 'rent', label: 'Rent' },
    { id: 'commercial', label: 'Commercial' },
    { id: 'pg', label: 'PG / Co-Living' },
    { id: 'new_projects', label: 'New Projects', badge: 'NEW' },
  ];

  return (
    <section className="relative bg-gradient-to-b from-[#0F2A43] to-[#163b5c] text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Subtle Geometric Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#18A67D_1px,transparent_1px)] [background-size:20px_20px]" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Top Eyebrow & AI Highlight */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-[#22C39A] text-xs font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#22C39A]" />
            <span>AI Real Estate Engine 2026</span>
          </div>
          <button
            type="button"
            onClick={onOpenValuation}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-200 hover:text-[#22C39A] transition-colors underline cursor-pointer"
          >
            Estimate property value in 30 seconds &rarr;
          </button>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Find Your Dream Property in <span className="text-[#22C39A]">India</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Search 100% RERA verified flats, luxury villas, builder floors, and direct owner listings across top Indian metros.
          </p>
        </div>

        {/* Tabbed Search Box Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 text-[#0F2A43] max-w-5xl mx-auto border border-white/20">
          
          {/* Top Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 border-b border-slate-100 no-scrollbar">
            {listingTabs.map((tab) => {
              const isSelected = filters.listingType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange({ listingType: tab.id })}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F2A43] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F2A43] hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] bg-[#18A67D] text-white font-extrabold px-1.5 py-0.2 rounded-md">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Inputs Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 pt-3 sm:pt-4">
            
            {/* City Dropdown */}
            <div className="lg:col-span-3 relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#18A67D] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={filters.city}
                  onChange={(e) => onFilterChange({ city: e.target.value })}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#0F2A43] focus:outline-none focus:border-[#18A67D] focus:ring-1 focus:ring-[#18A67D] appearance-none cursor-pointer"
                >
                  {INDIAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Keyword / Locality Search Input */}
            <div className="lg:col-span-5 relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                Locality, Landmark or Project
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Whitefield, Bandra, HITEC City, Kharadi..."
                  value={filters.searchQuery}
                  onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSearchSubmit();
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] placeholder-slate-400 focus:outline-none focus:border-[#18A67D] focus:ring-1 focus:ring-[#18A67D]"
                />
              </div>
            </div>

            {/* BHK / Bedroom Selector */}
            <div className="lg:col-span-2 relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
                BHK Type
              </label>
              <div className="relative">
                <select
                  value={filters.bhk}
                  onChange={(e) => onFilterChange({ bhk: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0F2A43] focus:outline-none focus:border-[#18A67D] focus:ring-1 focus:ring-[#18A67D] appearance-none cursor-pointer"
                >
                  <option value="all">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4+">4+ BHK / Villa</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search CTA Button */}
            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                onClick={onSearchSubmit}
                className="w-full py-2.5 px-4 bg-[#18A67D] hover:bg-[#158f6c] active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>

          </div>

          {/* Quick Toggle Checkboxes (Direct Owner & Verified) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.directOwnerOnly}
                  onChange={(e) => onFilterChange({ directOwnerOnly: e.target.checked })}
                  className="w-4 h-4 text-[#18A67D] rounded border-slate-300 focus:ring-[#18A67D] accent-[#18A67D]"
                />
                <span className="font-bold text-[#0F2A43] flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#18A67D]" />
                  Direct Owner Only
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => onFilterChange({ verifiedOnly: e.target.checked })}
                  className="w-4 h-4 text-[#18A67D] rounded border-slate-300 focus:ring-[#18A67D] accent-[#18A67D]"
                />
                <span className="font-bold text-[#0F2A43] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#18A67D]" />
                  100% RERA & Physically Verified
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={onOpenValuation}
              className="text-xs font-bold text-[#0E7C5D] hover:text-[#18A67D] flex items-center gap-1 cursor-pointer bg-[#E7F6F1] px-2.5 py-1 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Try BayBayt AI Property Valuer</span>
            </button>
          </div>

        </div>

        {/* Trust Badges Counter Below Hero */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-8 max-w-4xl mx-auto text-center">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xl sm:text-2xl font-black text-[#22C39A]">50,000+</div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium">Verified Active Listings</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xl sm:text-2xl font-black text-[#22C39A]">60%+</div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium">Direct Owner Flats</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xl sm:text-2xl font-black text-[#22C39A]">98.4%</div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium">AI Valuation Accuracy</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-xl sm:text-2xl font-black text-[#22C39A]">8+ Metros</div>
            <div className="text-[11px] sm:text-xs text-slate-300 font-medium">Pan-India Coverage</div>
          </div>
        </div>

      </div>
    </section>
  );
}
