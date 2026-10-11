'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  Check, 
  CheckSquare, 
  Square,
  Sparkles,
  ShieldCheck,
  Building,
  Home,
  Briefcase,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  Ruler,
  X
} from 'lucide-react';
import { CityInfo, CommercialListingType, ListingType, PropertyCategory, SearchFilters } from '@/lib/types';
import { CITY_SEARCH_LOCALITIES } from '@/lib/realEstateData';

const MIN_SIZE_SQFT = 80;

const CATEGORY_DISPLAY_LABELS: Partial<Record<PropertyCategory, string>> = {
  'Commercial Office': 'Office',
  'Retail Shop': 'Shop',
  'Warehouse': 'Warehouse',
  'Commercial Land': 'Land',
};

interface HeroSearchProps {
  selectedCity: CityInfo;
  currentListingType: ListingType;
  onListingTypeChange: (type: ListingType) => void;
  filters: SearchFilters;
  onFilterChange: (newFilters: Partial<SearchFilters>) => void;
  onExecuteSearch: () => void;
  matchingCount: number;
  onOpenPostProperty: () => void;
}

const PROPERTY_TYPES_BY_LISTING: Record<ListingType, PropertyCategory[]> = {
  buy: ['Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Residential Plot'],
  rent: ['Apartment', 'Villa', 'Builder Floor', 'Studio'],
  pg: ['PG / Co-Living', 'Studio'],
  plot: ['Residential Plot'],
  commercial: ['Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land']
};

export function HeroSearch({
  selectedCity,
  currentListingType,
  onListingTypeChange,
  filters,
  onFilterChange,
  onExecuteSearch,
  matchingCount,
  onOpenPostProperty
}: HeroSearchProps) {
  const [localityQuery, setLocalityQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showBhkDropdown, setShowBhkDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false);
  // Locality suggestions are derived from LIVE inventory: the distinct localities
  // that appear on approved listings for the selected city (ranked by count).
  // These merge with — and rank above — the city's static locality set.
  const [dbLocalities, setDbLocalities] = useState<string[]>([]);

  useEffect(() => {
    const city = selectedCity?.name;
    if (!city || city === 'All Cities') { setDbLocalities([]); return; }
    let active = true;
    fetch(`/api/localities/distinct?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.success && Array.isArray(d.localities)) {
          setDbLocalities(d.localities.filter(Boolean));
        } else if (active) {
          setDbLocalities([]);
        }
      })
      .catch(() => { if (active) setDbLocalities([]); });
    return () => { active = false; };
  }, [selectedCity?.name]);

  // Suggestion source = live DB localities (approved listings) + the city's full
  // static locality list + popular tiles, merged and de-duplicated (DB first so
  // real-inventory areas rank above static ones). This gives a MagicBricks-style
  // "type any area and it shows up" autocomplete even for cities with little
  // live inventory.
  const localitySource = React.useMemo(() => {
    const staticList = CITY_SEARCH_LOCALITIES[selectedCity.name] ?? [];
    const seen = new Set<string>();
    const merged: string[] = [];
    for (const loc of [...dbLocalities, ...staticList, ...selectedCity.popularLocalities]) {
      const key = loc.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(loc);
    }
    return merged;
  }, [dbLocalities, selectedCity.name, selectedCity.popularLocalities]);

  const availableCategories = PROPERTY_TYPES_BY_LISTING[currentListingType] || [];

  const isCommercial = currentListingType === 'commercial';
  const commercialDealType: CommercialListingType | undefined = filters.commercialListingType;

  const handleLocalitySelect = (loc: string) => {
    let updated = [...(filters.localities || [])];
    if (updated.includes(loc)) {
      updated = updated.filter(l => l !== loc);
    } else {
      updated.push(loc);
    }
    onFilterChange({ localities: updated, locality: loc });
    setLocalityQuery(loc);
    setShowLocalitySuggestions(false);
  };

  const handleBhkToggle = (bhk: number) => {
    let updated = [...(filters.bhk || [])];
    if (updated.includes(bhk)) {
      updated = updated.filter(b => b !== bhk);
    } else {
      updated.push(bhk);
    }
    onFilterChange({ bhk: updated });
  };

  const handleCategoryToggle = (cat: PropertyCategory) => {
    let updated = [...(filters.categories || [])];
    if (updated.includes(cat)) {
      updated = updated.filter(c => c !== cat);
    } else {
      updated.push(cat);
    }
    onFilterChange({ categories: updated, category: updated.length === 1 ? updated[0] : undefined });
  };

  const budgetPresetsBuy = [
    { label: 'Any Budget', min: undefined, max: undefined },
    { label: 'Under ₹50 Lac', min: 0, max: 5000000 },
    { label: '₹50 Lac - ₹1 Cr', min: 5000000, max: 10000000 },
    { label: '₹1 Cr - ₹2 Cr', min: 10000000, max: 20000000 },
    { label: '₹2 Cr - ₹5 Cr', min: 20000000, max: 50000000 },
    { label: '₹5 Cr+', min: 50000000, max: 200000000 },
  ];

  const budgetPresetsRent = [
    { label: 'Any Budget', min: undefined, max: undefined },
    { label: 'Under ₹20,000', min: 0, max: 20000 },
    { label: '₹20,000 - ₹40,000', min: 20000, max: 40000 },
    { label: '₹40,000 - ₹75,000', min: 40000, max: 75000 },
    { label: '₹75,000 - ₹1.5 Lac', min: 75000, max: 150000 },
    { label: '₹1.5 Lac+', min: 150000, max: 500000 },
  ];

  const activeBudgetPresets = currentListingType === 'rent' || currentListingType === 'pg' || (isCommercial && commercialDealType === 'rent')
    ? budgetPresetsRent
    : budgetPresetsBuy;

  const getBudgetLabel = () => {
    if (!filters.maxPrice || filters.maxPrice >= 200000000) return 'Any Budget';
    if (filters.minPrice && filters.minPrice > 0) {
      const minL = filters.minPrice >= 10000000 ? `₹${filters.minPrice / 10000000} Cr` : `₹${filters.minPrice / 100000}L`;
      const maxL = filters.maxPrice >= 10000000 ? `₹${filters.maxPrice / 10000000} Cr` : `₹${filters.maxPrice / 100000}L`;
      return `${minL} - ${maxL}`;
    }
    return filters.maxPrice >= 10000000 ? `Under ₹${filters.maxPrice / 10000000} Cr` : `Under ₹${filters.maxPrice / 100000}L`;
  };

  const getBhkLabel = () => {
    if (!filters.bhk || filters.bhk.length === 0) return 'Bedrooms';
    if (filters.bhk.length === 1) return `${filters.bhk[0]} BHK`;
    return `${filters.bhk.join(', ')} BHK`;
  };

  const getSizeLabel = () => {
    const min = filters.minSizeSqFt;
    const max = filters.maxSizeSqFt;
    const hasMin = min !== undefined && min > MIN_SIZE_SQFT;
    const hasMax = max !== undefined && max > 0;
    if (!hasMin && !hasMax) return 'Any Size';
    const minVal = hasMin ? min : MIN_SIZE_SQFT;
    return hasMax ? `${minVal}–${max} sq.ft` : `${minVal}+ sq.ft`;
  };

  const getCategoryLabel = () => {
    if (filters.category) return CATEGORY_DISPLAY_LABELS[filters.category] ?? filters.category;
    if (filters.categories && filters.categories.length > 0) {
      return filters.categories.length === 1
        ? (CATEGORY_DISPLAY_LABELS[filters.categories[0]] ?? filters.categories[0])
        : `${filters.categories.length} Selected`;
    }
    return 'Property Type';
  };

  const trimmedQuery = localityQuery.trim().toLowerCase();
  const matchingLocalities = (
    trimmedQuery
      ? localitySource.filter((l) => l.toLowerCase().includes(trimmedQuery))
      : localitySource
  ).slice(0, 80);

  return (
    <section className="relative z-20 w-full bg-[#0F2A43] text-white border-b border-[#163b5c]">

      {/* Subtle Background Geometric Accent Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full border-[32px] border-white/20" />
        <div className="absolute left-1/3 -bottom-24 w-80 h-80 rounded-full border-[24px] border-[#18A67D]/30" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-10 space-y-6">
        
        {/* Top Tagline & Welcome */}
        <div className="text-center sm:text-left space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#163b5c] text-[#22C39A] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to BayBayt • {selectedCity.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Find Your Dream Home in <span className="text-[#22C39A]">{selectedCity.name}</span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Over {selectedCity.totalListingsCount.toLocaleString()}+ verified properties for buy, rent & investment with direct owner options.
          </p>
        </div>

        {/* Main Search Tabs & Form Container */}
        <div className="bg-white text-[#172033] rounded-2xl shadow-2xl border border-[#E2E8F0]">

          {/* Navigation Category Tabs */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 sm:px-6 overflow-x-auto scrollbar-none rounded-t-2xl">
            <div className="flex items-center gap-1 sm:gap-3 py-1">
              {[
                { id: 'buy', label: 'Buy', icon: Home },
                { id: 'rent', label: 'Rent', icon: Building },
                { id: 'pg', label: 'PG / Co-Living', icon: Users },
                { id: 'plot', label: 'Plots / Land', icon: ShieldCheck },
                { id: 'commercial', label: 'Commercial', icon: Briefcase }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentListingType === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`hero-tab-${tab.id}`}
                    onClick={() => onListingTypeChange(tab.id as ListingType)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-[#18A67D] text-[#0E7C5D] bg-white'
                        : 'border-transparent text-[#64748B] hover:text-[#0F2A43]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#18A67D]' : 'text-[#64748B]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Post Property Free CTA on Tab Bar */}
            <div className="hidden lg:flex items-center py-2">
              <button
                id="hero-post-free-btn"
                onClick={onOpenPostProperty}
                className="flex items-center gap-1.5 bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Post Property FREE</span>
                <span className="bg-[#18A67D] text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase">Owner Direct</span>
              </button>
            </div>
          </div>

          {/* Commercial Deal Type: Rent or Sale */}
          {isCommercial && (
            <div className="bg-white border-b border-[#E2E8F0] px-3 sm:px-4 pt-3 flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mr-1">Looking to:</span>
              {[
                { id: undefined, label: 'All' },
                { id: 'sale' as const, label: 'Sale' },
                { id: 'rent' as const, label: 'Rent' },
              ].map((opt) => {
                const isActive = commercialDealType === opt.id || (!commercialDealType && opt.id === undefined);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => onFilterChange({ commercialListingType: opt.id })}
                    className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#18A67D] text-white border-[#18A67D]'
                        : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-[#18A67D]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Inputs Bar */}
          <div className="p-3 sm:p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
              
              {/* 1. Location & Locality Search Input */}
              <div className="md:col-span-5 relative">
                <div className="flex items-center border border-[#CBD5E1] rounded-xl px-3 py-2.5 bg-white focus-within:border-[#18A67D] focus-within:ring-2 focus-within:ring-[#18A67D]/20 transition-all">
                  <MapPin className="w-4 h-4 text-[#18A67D] shrink-0 mr-2" />
                  <div className="flex-1 min-w-0">
                    <input
                      id="hero-location-input"
                      type="text"
                      value={localityQuery}
                      onChange={(e) => {
                        setLocalityQuery(e.target.value);
                        onFilterChange({ locality: e.target.value });
                        setShowLocalitySuggestions(true);
                      }}
                      onFocus={() => setShowLocalitySuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setShowLocalitySuggestions(false);
                          onExecuteSearch();
                        }
                      }}
                      placeholder={`Search localities in ${selectedCity.name} (e.g. ${localitySource.slice(0, 2).join(', ')})`}
                      className="w-full text-xs sm:text-sm font-medium text-[#172033] bg-transparent outline-none placeholder:text-[#64748B]"
                    />
                  </div>
                  {localityQuery && (
                    <button
                      onClick={() => {
                        setLocalityQuery('');
                        onFilterChange({ locality: '', localities: [] });
                      }}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Locality Autocomplete Dropdown */}
                {showLocalitySuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-2.5 z-40 space-y-1 animate-in fade-in">
                    <div className="text-[11px] font-bold text-[#64748B] px-2 py-1 uppercase tracking-wider flex justify-between items-center">
                      <span>{trimmedQuery ? `Localities in ${selectedCity.name}` : `Popular Localities in ${selectedCity.name}`}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLocalitySuggestions(false);
                        }}
                        className="text-slate-400 hover:text-slate-700 text-xs"
                      >
                        Close
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {matchingLocalities.map((loc) => {
                        const isSelected = (filters.localities || []).includes(loc) || filters.locality === loc;
                        return (
                          <div
                            key={loc}
                            onClick={() => handleLocalitySelect(loc)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-[#E7F6F1] text-[#0E7C5D]'
                                : 'hover:bg-[#F8FAFC] text-[#172033]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#18A67D]" />
                              <span>{loc}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#18A67D]" />}
                          </div>
                        );
                      })}

                      {/* No preset match — let the user search their typed text as-is. */}
                      {matchingLocalities.length === 0 && trimmedQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowLocalitySuggestions(false);
                            onExecuteSearch();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-xs font-semibold text-[#172033] hover:bg-[#F8FAFC] text-left"
                        >
                          <Search className="w-3.5 h-3.5 text-[#18A67D]" />
                          <span>Search “{localityQuery.trim()}” in {selectedCity.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Property Type Selector Dropdown */}
              <div className="md:col-span-2 relative">
                <div 
                  id="hero-prop-type-trigger"
                  onClick={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowBudgetDropdown(false);
                    setShowBhkDropdown(false);
                    setShowLocalitySuggestions(false);
                  }}
                  className="flex items-center justify-between border border-[#CBD5E1] rounded-xl px-3 py-2.5 bg-white hover:border-[#18A67D] cursor-pointer transition-colors"
                >
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-medium text-[#64748B] uppercase">Type</span>
                    <span className="text-xs sm:text-sm font-bold text-[#172033] truncate block">
                      {getCategoryLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0 ml-1" />
                </div>

                {/* Property Type Dropdown Popover */}
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-3 z-40 space-y-1 animate-in fade-in">
                    <div className="text-[11px] font-bold text-[#64748B] px-2 py-1 uppercase tracking-wider">
                      Select Categories
                    </div>
                    {availableCategories.map((cat) => {
                      const isSelected = (filters.categories || []).includes(cat) || filters.category === cat;
                      return (
                        <div
                          key={cat}
                          onClick={() => handleCategoryToggle(cat)}
                          className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-[#F8FAFC] rounded-lg cursor-pointer text-xs font-semibold text-[#172033]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#18A67D]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#64748B]" />
                          )}
                          <span>{CATEGORY_DISPLAY_LABELS[cat] ?? cat}</span>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center px-1">
                      <button
                        onClick={() => onFilterChange({ categories: [], category: undefined })}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowTypeDropdown(false)}
                        className="text-xs bg-[#0F2A43] hover:bg-[#163b5c] text-white px-3 py-1 rounded font-bold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Budget Filter Dropdown */}
              <div className="md:col-span-2 relative">
                <div 
                  id="hero-budget-trigger"
                  onClick={() => {
                    setShowBudgetDropdown(!showBudgetDropdown);
                    setShowTypeDropdown(false);
                    setShowBhkDropdown(false);
                    setShowLocalitySuggestions(false);
                  }}
                  className="flex items-center justify-between border border-[#CBD5E1] rounded-xl px-3 py-2.5 bg-white hover:border-[#18A67D] cursor-pointer transition-colors"
                >
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-medium text-[#64748B] uppercase">Budget</span>
                    <span className="text-xs sm:text-sm font-bold text-[#172033] truncate block">
                      {getBudgetLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0 ml-1" />
                </div>

                {/* Budget Presets Dropdown */}
                {showBudgetDropdown && (
                  <div className="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-2 z-40 space-y-1 animate-in fade-in">
                    <div className="text-[11px] font-bold text-[#64748B] px-2 py-1 uppercase tracking-wider">
                      Budget Range
                    </div>
                    {activeBudgetPresets.map((preset) => {
                      const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
                      return (
                        <div
                          key={preset.label}
                          onClick={() => {
                            onFilterChange({ minPrice: preset.min, maxPrice: preset.max });
                            setShowBudgetDropdown(false);
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[#E7F6F1] text-[#0E7C5D] font-bold'
                              : 'hover:bg-[#F8FAFC] text-[#172033]'
                          }`}
                        >
                          {preset.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. Bedrooms (BHK) Filter — or Size for Commercial */}
              {!isCommercial ? (
              <div className="md:col-span-2 relative">
                <div
                  id="hero-bhk-trigger"
                  onClick={() => {
                    setShowBhkDropdown(!showBhkDropdown);
                    setShowTypeDropdown(false);
                    setShowBudgetDropdown(false);
                    setShowLocalitySuggestions(false);
                  }}
                  className="flex items-center justify-between border border-[#CBD5E1] rounded-xl px-3 py-2.5 bg-white hover:border-[#18A67D] cursor-pointer transition-colors"
                >
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-medium text-[#64748B] uppercase">BHK</span>
                    <span className="text-xs sm:text-sm font-bold text-[#172033] truncate block">
                      {getBhkLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0 ml-1" />
                </div>

                {/* BHK Selector Popover */}
                {showBhkDropdown && (
                  <div className="absolute top-full left-0 md:-left-12 w-56 mt-2 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-3 z-40 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      Select Bedrooms
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[1, 2, 3, 4, 5].map((bhk) => {
                        const isSelected = (filters.bhk || []).includes(bhk);
                        return (
                          <button
                            key={bhk}
                            onClick={() => handleBhkToggle(bhk)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                              isSelected
                                ? 'bg-[#18A67D] text-white border-[#18A67D]'
                                : 'bg-[#F8FAFC] text-[#172033] border-[#E2E8F0] hover:border-[#CBD5E1]'
                            }`}
                          >
                            {bhk} BHK
                          </button>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                      <button
                        onClick={() => onFilterChange({ bhk: [] })}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowBhkDropdown(false)}
                        className="text-xs bg-[#0F2A43] text-white px-3 py-1 rounded font-bold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              ) : (
              <div className="md:col-span-2 relative">
                <div
                  id="hero-size-trigger"
                  onClick={() => {
                    setShowSizeDropdown(!showSizeDropdown);
                    setShowTypeDropdown(false);
                    setShowBudgetDropdown(false);
                    setShowBhkDropdown(false);
                    setShowLocalitySuggestions(false);
                  }}
                  className="flex items-center justify-between border border-[#CBD5E1] rounded-xl px-3 py-2.5 bg-white hover:border-[#18A67D] cursor-pointer transition-colors"
                >
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-medium text-[#64748B] uppercase">Size</span>
                    <span className="text-xs sm:text-sm font-bold text-[#172033] truncate block">
                      {getSizeLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0 ml-1" />
                </div>

                {/* Size (sq.ft) Popover */}
                {showSizeDropdown && (
                  <div className="absolute top-full left-0 md:-left-12 w-60 mt-2 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] p-3 z-40 space-y-2 animate-in fade-in">
                    <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#18A67D]" />
                      <span>Size (sq.ft) · min {MIN_SIZE_SQFT}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-[#64748B]">Min</label>
                        <input
                          type="number"
                          min={MIN_SIZE_SQFT}
                          value={filters.minSizeSqFt ?? MIN_SIZE_SQFT}
                          onChange={(e) => onFilterChange({ minSizeSqFt: Number(e.target.value) || MIN_SIZE_SQFT })}
                          className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 outline-none focus:border-[#18A67D] text-[#172033]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-[#64748B]">Max (0 = any)</label>
                        <input
                          type="number"
                          min={0}
                          value={filters.maxSizeSqFt ?? 0}
                          onChange={(e) => onFilterChange({ maxSizeSqFt: Number(e.target.value) || 0 })}
                          className="w-full text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-2 outline-none focus:border-[#18A67D] text-[#172033]"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                      <button
                        onClick={() => onFilterChange({ minSizeSqFt: MIN_SIZE_SQFT, maxSizeSqFt: 0 })}
                        className="text-xs text-[#64748B] hover:text-[#172033] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowSizeDropdown(false)}
                        className="text-xs bg-[#0F2A43] text-white px-3 py-1 rounded font-bold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* 5. Primary Search Button */}
              <div className="md:col-span-1.5">
                <button
                  id="hero-search-submit-btn"
                  onClick={onExecuteSearch}
                  className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>

            </div>
          </div>

          {/* Quick Filter Tag Chips Bar */}
          <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs rounded-b-2xl">
            <span className="text-[#64748B] font-semibold text-[11px]">Quick Filters:</span>
            
            <button
              onClick={() => onFilterChange({ isOwnerOnly: !filters.isOwnerOnly })}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-medium ${
                filters.isOwnerOnly
                  ? 'bg-[#18A67D] text-white border-[#18A67D]'
                  : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-[#18A67D]'
              }`}
            >
              ⭐ Owner Properties (Direct)
            </button>

            <button
              onClick={() => onFilterChange({ isVerifiedOnly: !filters.isVerifiedOnly })}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-medium ${
                filters.isVerifiedOnly
                  ? 'bg-[#0F2A43] text-white border-[#0F2A43]'
                  : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-[#0F2A43]'
              }`}
            >
              ✓ Verified Photos & Legal Check
            </button>

            <button
              onClick={() => onFilterChange({ constructionStatus: filters.constructionStatus === 'Ready to Move' ? undefined : 'Ready to Move' })}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-medium ${
                filters.constructionStatus === 'Ready to Move'
                  ? 'bg-[#0E7C5D] text-white border-[#0E7C5D]'
                  : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-[#0E7C5D]'
              }`}
            >
              Ready to Move
            </button>

            <button
              onClick={() => onFilterChange({ maxPrice: filters.maxPrice === 5000000 ? undefined : 5000000 })}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-medium ${
                filters.maxPrice === 5000000
                  ? 'bg-[#18A67D] text-white border-[#18A67D]'
                  : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-[#18A67D]'
              }`}
            >
              Under ₹50 Lac
            </button>

            <button
              onClick={() => onFilterChange({ isFeaturedOnly: !filters.isFeaturedOnly })}
              className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer text-[11px] font-medium ${
                filters.isFeaturedOnly
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-[#172033] border-[#CBD5E1] hover:border-amber-600'
              }`}
            >
              Luxury & Featured
            </button>
          </div>

        </div>

        {/* Value Proposition Trust Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {[
            { title: '100% Verified Listings', desc: 'RERA approved with physical verification' },
            { title: 'Direct Owner Connect', desc: 'Connect directly with owners on 10,000+ homes' },
            { title: 'BayBayt AI Valuation', desc: 'Real-time price & rental estimation' }
          ].map((badge, idx) => (
            <div key={idx} className="flex items-center gap-2.5 bg-[#163b5c]/60 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-[#22C39A] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white leading-tight">{badge.title}</div>
                <div className="text-[10px] text-slate-300 leading-tight mt-0.5">{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
