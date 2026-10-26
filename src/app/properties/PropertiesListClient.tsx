'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { propertyImageAlt } from '@/lib/seoText';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  Phone, 
  ArrowUpDown, 
  X, 
  ArrowRight, 
  Tag, 
  Home,
  Briefcase,
  Trees,
  BedDouble,
  Store,
  Warehouse,
  Ruler,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronRight
} from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import { useGenie } from '@/lib/genieContext';
import { ListingType, CommercialListingType } from '@/lib/types';
import type { PropertyFilterState } from '@/lib/propertyFilters';
import { SavedSearchesBar } from '@/components/SavedSearchesBar';
import { CITIES_DATA } from '@/lib/realEstateData';

const ALL_CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: 'All Categories', value: 'All', icon: Tag },
  { label: 'Apartments', value: 'Apartment', icon: Building2 },
  { label: 'Villas & Houses', value: 'Villa', icon: Home },
  { label: 'Plots & Land', value: 'Residential Plot', icon: Trees },
  { label: 'PG & Co-Living', value: 'PG / Co-Living', icon: BedDouble }
];

// Commercial listings use a dedicated set of property types.
const COMMERCIAL_CATEGORIES: { label: string; value: string; icon: any }[] = [
  { label: 'All Types', value: 'All', icon: Tag },
  { label: 'Office', value: 'Commercial Office', icon: Briefcase },
  { label: 'Shop', value: 'Retail Shop', icon: Store },
  { label: 'Warehouse', value: 'Warehouse', icon: Warehouse },
  { label: 'Land', value: 'Commercial Land', icon: Trees },
];

// Minimum commercial size (sq.ft) the catalog filter allows.
const MIN_SIZE_SQFT = 80;

const LISTING_TYPES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Listings' },
  { id: 'buy', label: 'Buy' },
  { id: 'rent', label: 'Rent' },
  { id: 'pg', label: 'PG / Co-Living' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'plot', label: 'Plots' }
];

function PropertiesCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { properties, isShortlisted, toggleShortlist } = useProperties();
  const { user: _user } = useAuth();
  const { openGenie } = useGenie();

  // Derive initial values from URL Search Parameters
  const initialCity = useMemo(() => {
    const cityParam = searchParams.get('city');
    if (!cityParam) return 'All';
    const matchedCity = CITIES_DATA.find(
      (c) => c.name.toLowerCase() === cityParam.toLowerCase() || c.code.toLowerCase() === cityParam.toLowerCase()
    );
    return matchedCity ? matchedCity.name : cityParam.toLowerCase() === 'all' ? 'All' : cityParam;
  }, [searchParams]);

  const initialCategory = useMemo(() => searchParams.get('category') || 'All', [searchParams]);
  
  const initialListingType = useMemo(() => {
    const typeParam = searchParams.get('listingType') || searchParams.get('type');
    if (typeParam && ['buy', 'rent', 'pg', 'commercial', 'plot'].includes(typeParam)) {
      return typeParam as ListingType;
    }
    return 'all';
  }, [searchParams]);

  const initialSearchQuery = useMemo(() => searchParams.get('q') || searchParams.get('locality') || searchParams.get('search') || '', [searchParams]);

  const initialBhk = useMemo(() => {
    const bhkParam = searchParams.get('bhk');
    if (bhkParam) {
      const bhkNum = parseInt(bhkParam, 10);
      if (!isNaN(bhkNum)) return [bhkNum];
    }
    return [];
  }, [searchParams]);

  const initialCommercialType = useMemo(() => {
    const t = searchParams.get('commercialType');
    if (t === 'rent' || t === 'sale') return t as CommercialListingType;
    return 'all' as const;
  }, [searchParams]);

  const initialMinSize = useMemo(() => {
    const n = parseInt(searchParams.get('minSize') || '', 10);
    return !isNaN(n) && n >= MIN_SIZE_SQFT ? n : MIN_SIZE_SQFT;
  }, [searchParams]);
  const initialMaxSize = useMemo(() => {
    const n = parseInt(searchParams.get('maxSize') || '', 10);
    return !isNaN(n) && n > 0 ? n : 0;
  }, [searchParams]);

  const initialVerified = useMemo(() => searchParams.get('verified') === 'true' || searchParams.get('isVerified') === 'true', [searchParams]);
  const initialOwner = useMemo(() => searchParams.get('owner') === 'true' || searchParams.get('isOwner') === 'true', [searchParams]);
  const initialRera = useMemo(() => searchParams.get('rera') === 'true' || searchParams.get('reraApproved') === 'true', [searchParams]);
  const initialSort = useMemo(() => {
    const s = searchParams.get('sort');
    if (s === 'newest') return 'newest';
    if (s && ['recommended', 'price_asc', 'price_desc', 'area_desc', 'newest'].includes(s)) return s as any;
    return 'recommended';
  }, [searchParams]);

  // Local filter states (initialized from URL params)
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [listingType, setListingType] = useState<ListingType | 'all'>(initialListingType);
  const [commercialDealType, setCommercialDealType] = useState<CommercialListingType | 'all'>(initialCommercialType);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBhk, setSelectedBhk] = useState<number[]>(initialBhk);
  const [minSize, setMinSize] = useState<number>(initialMinSize);
  const [maxSize, setMaxSize] = useState<number>(initialMaxSize); // 0 = no upper cap
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000000);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerified);
  const [ownerOnly, setOwnerOnly] = useState<boolean>(initialOwner);
  const [reraOnly, setReraOnly] = useState<boolean>(initialRera);
  const [furnishing, setFurnishing] = useState<string>('All');
  const [constructionStatus, setConstructionStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest'>(initialSort);
  
  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeCity = selectedCity;
  const activeCategory = selectedCategory;
  const activeListingType = listingType;
  const activeSearchQuery = searchQuery;
  const activeBhk = selectedBhk;
  const isCommercial = activeListingType === 'commercial';
  const sizeActive = isCommercial && (minSize > MIN_SIZE_SQFT || maxSize > 0);

  // Switching listing type keeps the selected category valid for that type.
  const handleListingTypeChange = (next: string) => {
    setListingType(next as any);
    const commercialValues = COMMERCIAL_CATEGORIES.map((c) => c.value);
    if (next === 'commercial') {
      if (!commercialValues.includes(selectedCategory)) setSelectedCategory('All');
    } else {
      if (commercialValues.includes(selectedCategory) && selectedCategory !== 'All') setSelectedCategory('All');
      setCommercialDealType('all');
    }
  };

  // Toggle BHK
  const handleToggleBhk = (bhkVal: number) => {
    if (activeBhk.includes(bhkVal)) {
      setSelectedBhk(activeBhk.filter((b) => b !== bhkVal));
    } else {
      setSelectedBhk([...activeBhk, bhkVal]);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCity('All');
    setSearchQuery('');
    setListingType('all');
    setCommercialDealType('all');
    setSelectedCategory('All');
    setSelectedBhk([]);
    setMinSize(MIN_SIZE_SQFT);
    setMaxSize(0);
    setMinPrice(0);
    setMaxPrice(100000000);
    setVerifiedOnly(false);
    setOwnerOnly(false);
    setReraOnly(false);
    setFurnishing('All');
    setConstructionStatus('All');
    setSortBy('recommended');
    router.replace('/properties');
  };

  // Build a query string from the CURRENT in-page filters so the map view opens
  // with exactly what the user is looking at (the catalog keeps filters in local
  // state, not the URL). Param names match parseFiltersFromParams in propertyFilters.
  const mapHref = useMemo(() => {
    const q = new URLSearchParams();
    if (selectedCity !== 'All') q.set('city', selectedCity);
    if (listingType !== 'all') q.set('listingType', listingType);
    if (isCommercial && commercialDealType !== 'all') q.set('commercialType', commercialDealType);
    if (selectedCategory !== 'All') q.set('category', selectedCategory);
    if (!isCommercial && selectedBhk.length === 1) q.set('bhk', String(selectedBhk[0]));
    if (isCommercial && minSize > MIN_SIZE_SQFT) q.set('minSize', String(minSize));
    if (isCommercial && maxSize > 0) q.set('maxSize', String(maxSize));
    if (minPrice > 0) q.set('minPrice', String(minPrice));
    if (maxPrice < 100000000) q.set('maxPrice', String(maxPrice));
    if (verifiedOnly) q.set('verified', 'true');
    if (ownerOnly) q.set('owner', 'true');
    if (reraOnly) q.set('rera', 'true');
    if (furnishing !== 'All') q.set('furnishing', furnishing);
    if (constructionStatus !== 'All') q.set('construction', constructionStatus);
    if (searchQuery.trim()) q.set('q', searchQuery.trim());
    if (sortBy !== 'recommended') q.set('sort', sortBy);
    const s = q.toString();
    return `/properties/map${s ? `?${s}` : ''}`;
  }, [selectedCity, listingType, isCommercial, commercialDealType, selectedCategory, selectedBhk, minSize, maxSize, minPrice, maxPrice, verifiedOnly, ownerOnly, reraOnly, furnishing, constructionStatus, searchQuery, sortBy]);

  // Filter and Sort Logic
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // City filter
        if (activeCity !== 'All' && p.city.toLowerCase() !== activeCity.toLowerCase()) {
          return false;
        }
        // Listing Type filter
        if (activeListingType !== 'all' && p.listingType !== activeListingType) {
          return false;
        }
        // Commercial deal type (rent / sale)
        if (isCommercial && commercialDealType !== 'all' && p.commercialListingType !== commercialDealType) {
          return false;
        }
        // Category filter
        if (activeCategory !== 'All' && p.category.toLowerCase() !== activeCategory.toLowerCase()) {
          return false;
        }
        // Commercial size (sq.ft) filter
        if (isCommercial) {
          const size = p.carpetAreaSqFt || 0;
          if (size < minSize) return false;
          if (maxSize > 0 && size > maxSize) return false;
        }
        // BHK filter (residential only; hidden for commercial)
        if (!isCommercial && activeBhk.length > 0 && p.bhk && !activeBhk.includes(p.bhk)) {
          return false;
        }
        // Price filter
        if (p.price < minPrice || p.price > maxPrice) {
          return false;
        }
        // Verified Only
        if (verifiedOnly && !p.isVerified) {
          return false;
        }
        // Owner Only (Direct Owner Postings)
        if (ownerOnly && !(p.postedBy.type === 'Owner' || p.isExclusiveOwner)) {
          return false;
        }
        // RERA Only
        if (reraOnly && !p.reraApproved) {
          return false;
        }
        // Furnishing
        if (furnishing !== 'All' && p.furnishing !== furnishing) {
          return false;
        }
        // Construction Status
        if (constructionStatus !== 'All' && p.constructionStatus !== constructionStatus) {
          return false;
        }

        // Search Query (Locality, Sublocality, Title, Builder, Agent, Tagline, Description)
        if (activeSearchQuery && activeSearchQuery.trim()) {
          const q = activeSearchQuery.toLowerCase().trim();
          const words = q.split(/\s+/).filter(Boolean);
          
          const title = (p.title || '').toLowerCase();
          const locality = (p.locality || '').toLowerCase();
          const subLocality = (p.subLocality || '').toLowerCase();
          const city = (p.city || '').toLowerCase();
          const category = (p.category || '').toLowerCase();
          const tagline = (p.tagline || '').toLowerCase();
          const description = (p.description || '').toLowerCase();
          const builder = (p.postedBy.companyName || '').toLowerCase();
          const agentName = (p.postedBy.name || '').toLowerCase();
          
          const fullText = `${title} ${locality} ${subLocality} ${city} ${category} ${tagline} ${description} ${builder} ${agentName}`;
          
          const directMatch = fullText.includes(q);
          const wordsMatch = words.every((w) => fullText.includes(w));
          
          if (!directMatch && !wordsMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'area_desc') return (b.carpetAreaSqFt || 0) - (a.carpetAreaSqFt || 0);
        if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
        // Recommended: Featured first, then verified, then owner
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return 0;
      });
  }, [
    properties,
    activeCity,
    activeListingType,
    isCommercial,
    commercialDealType,
    activeCategory,
    activeBhk,
    minSize,
    maxSize,
    minPrice,
    maxPrice,
    verifiedOnly,
    ownerOnly,
    reraOnly,
    furnishing,
    constructionStatus,
    activeSearchQuery,
    sortBy
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCity !== 'All') count++;
    if (activeCategory !== 'All') count++;
    if (activeListingType !== 'all') count++;
    if (isCommercial && commercialDealType !== 'all') count++;
    if (sizeActive) count++;
    if (!isCommercial && activeBhk.length > 0) count += activeBhk.length;
    if (verifiedOnly) count++;
    if (ownerOnly) count++;
    if (reraOnly) count++;
    if (furnishing !== 'All') count++;
    if (constructionStatus !== 'All') count++;
    if (minPrice > 0 || maxPrice < 100000000) count++;
    if (activeSearchQuery.trim()) count++;
    return count;
  }, [
    activeCity,
    activeCategory,
    activeListingType,
    isCommercial,
    commercialDealType,
    sizeActive,
    activeBhk,
    verifiedOnly,
    ownerOnly,
    reraOnly,
    furnishing,
    constructionStatus,
    minPrice,
    maxPrice,
    activeSearchQuery
  ]);

  // Current filter state as a PropertyFilterState, for saving as a search.
  const currentFilters: PropertyFilterState = useMemo(() => ({
    city: selectedCity,
    listingType,
    commercialDealType,
    category: selectedCategory,
    bhk: selectedBhk,
    minSize,
    maxSize,
    minPrice,
    maxPrice,
    verifiedOnly,
    ownerOnly,
    reraOnly,
    furnishing,
    constructionStatus,
    searchQuery,
    sortBy,
  }), [selectedCity, listingType, commercialDealType, selectedCategory, selectedBhk, minSize, maxSize, minPrice, maxPrice, verifiedOnly, ownerOnly, reraOnly, furnishing, constructionStatus, searchQuery, sortBy]);

  // Apply a saved search back onto the live filter controls.
  const applyFilters = (f: PropertyFilterState) => {
    setSelectedCity(f.city);
    setListingType(f.listingType);
    setCommercialDealType(f.commercialDealType);
    setSelectedCategory(f.category);
    setSelectedBhk(f.bhk);
    setMinSize(f.minSize);
    setMaxSize(f.maxSize);
    setMinPrice(f.minPrice);
    setMaxPrice(f.maxPrice);
    setVerifiedOnly(f.verifiedOnly);
    setOwnerOnly(f.ownerOnly);
    setReraOnly(f.reraOnly);
    setFurnishing(f.furnishing);
    setConstructionStatus(f.constructionStatus);
    setSearchQuery(f.searchQuery);
    setSortBy(f.sortBy);
  };

  // Sidebar Filter Form Component
  const FilterSidebarContent = (
    <div className="space-y-6">
      {/* Header with Title and Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#18A67D]" />
          <h2 className="text-sm font-extrabold text-[#0F2A43] uppercase tracking-wide">Filters</h2>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#18A67D] text-white text-[11px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          Target City
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-[#18A67D] absolute left-3 top-3 pointer-events-none" />
          <select
            value={activeCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] outline-none cursor-pointer focus:border-[#18A67D] focus:bg-white"
          >
            <option value="All">All Cities</option>
            {CITIES_DATA.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listing Purpose / Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          Listing Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {LISTING_TYPES.map((type) => {
            const isSelected = activeListingType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleListingTypeChange(type.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F2A43] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commercial Deal Type (Rent / Sale) — only for commercial listings */}
      {isCommercial && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
            Rent or Sale
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { id: 'all', label: 'All' },
              { id: 'sale', label: 'Sale' },
              { id: 'rent', label: 'Rent' },
            ] as { id: CommercialListingType | 'all'; label: string }[]).map((d) => {
              const isSelected = commercialDealType === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setCommercialDealType(d.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#18A67D] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Property Category */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          {isCommercial ? 'Commercial Type' : 'Property Category'}
        </label>
        <div className="space-y-1">
          {(isCommercial ? COMMERCIAL_CATEGORIES : ALL_CATEGORIES).map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#18A67D]' : 'text-[#64748B]'}`} />
                  <span>{cat.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#18A67D]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size (commercial) or Bedrooms (residential) */}
      {isCommercial ? (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-[#18A67D]" />
            Size (sq.ft)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                min={MIN_SIZE_SQFT}
                value={minSize}
                onChange={(e) => setMinSize(Math.max(MIN_SIZE_SQFT, Number(e.target.value) || MIN_SIZE_SQFT))}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] outline-none focus:border-[#18A67D] focus:bg-white"
                placeholder={`Min ${MIN_SIZE_SQFT}`}
              />
            </div>
            <span className="text-xs font-bold text-[#64748B]">to</span>
            <div className="flex-1 relative">
              <input
                type="number"
                min={minSize}
                value={maxSize || ''}
                onChange={(e) => setMaxSize(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] outline-none focus:border-[#18A67D] focus:bg-white"
                placeholder="Max (any)"
              />
            </div>
          </div>
          <p className="text-[10px] text-[#64748B]">Commercial spaces start from {MIN_SIZE_SQFT} sq.ft.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
            Bedrooms (BHK)
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((bhk) => {
              const isSelected = activeBhk.includes(bhk);
              return (
                <button
                  key={bhk}
                  type="button"
                  onClick={() => handleToggleBhk(bhk)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F2A43] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {bhk} {bhk === 5 ? '5+' : 'BHK'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified & Owner Direct Toggles */}
      <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          Verification & Owner Direct
        </label>
        
        {/* Verified Only */}
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#18A67D]" />
            <span className="text-xs font-bold text-[#0F2A43]">Verified Properties</span>
          </div>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="w-4 h-4 accent-[#18A67D] rounded cursor-pointer"
          />
        </label>

        {/* Direct Owner Postings */}
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-[#0F2A43] block leading-tight">Owner Direct</span>
              <span className="text-[10px] text-[#64748B]">Direct Owner Postings</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={ownerOnly}
            onChange={(e) => setOwnerOnly(e.target.checked)}
            className="w-4 h-4 accent-[#18A67D] rounded cursor-pointer"
          />
        </label>

        {/* RERA Registered */}
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F2A43]" />
            <span className="text-xs font-bold text-[#0F2A43]">RERA Registered</span>
          </div>
          <input
            type="checkbox"
            checked={reraOnly}
            onChange={(e) => setReraOnly(e.target.checked)}
            className="w-4 h-4 accent-[#18A67D] rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Furnishing Status */}
      <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          Furnishing
        </label>
        <select
          value={furnishing}
          onChange={(e) => setFurnishing(e.target.value)}
          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none cursor-pointer"
        >
          <option value="All">All Furnishing Types</option>
          <option value="Furnished">Fully Furnished</option>
          <option value="Semi-Furnished">Semi-Furnished</option>
          <option value="Unfurnished">Unfurnished</option>
        </select>
      </div>

      {/* Construction Status */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider block">
          Possession Status
        </label>
        <select
          value={constructionStatus}
          onChange={(e) => setConstructionStatus(e.target.value)}
          className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Ready to Move">Ready to Move</option>
          <option value="Under Construction">Under Construction</option>
          <option value="New Launch">New Launch</option>
        </select>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <BrandLogo variant="onLight" className="h-8 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              My Dashboard
            </Link>
            <Link
              href="/post-property"
              className="px-3.5 py-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              + Post Property Free
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumbs & Catalog Title Banner */}
      <div className="bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
            <Link href="/" className="hover:text-[#0F2A43] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
            <Link href="/properties" className="hover:text-[#0F2A43] transition-colors">Properties</Link>
            {activeCity !== 'All' && (
              <>
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                <span className="text-[#0F2A43] font-bold">{activeCity}</span>
              </>
            )}
            {activeCategory !== 'All' && (
              <>
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                <span className="text-[#18A67D] font-bold">{activeCategory}</span>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F2A43] tracking-tight">
                {activeCategory !== 'All' ? activeCategory : 'Properties'}
                {activeCity !== 'All' && <span> in {activeCity}</span>}
                <span className="text-sm font-bold text-[#64748B] ml-2 font-normal">
                  ({filteredProperties.length} verified listings)
                </span>
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Verified legal titles, price valuations, RERA compliance & direct owner listings
              </p>
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0F2A43] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#18A67D]" />
                <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout (Left Filter Sidebar + Right Properties Area) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ========================================================= */}
          {/* LEFT SIDEBAR FILTER (Sticky Desktop)                      */}
          {/* ========================================================= */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            {FilterSidebarContent}
          </aside>

          {/* ========================================================= */}
          {/* MOBILE FILTER MODAL / DRAWER                              */}
          {/* ========================================================= */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
              <div className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 flex flex-col justify-between shadow-2xl ml-auto animate-in slide-in-from-right">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
                    <h3 className="text-sm font-extrabold text-[#0F2A43]">Filters & Preferences</h3>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#0F2A43] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {FilterSidebarContent}
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] mt-6">
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Apply Filters ({filteredProperties.length} Listings)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* RIGHT MAIN CONTENT AREA                                    */}
          {/* ========================================================= */}
          <main className="flex-1 min-w-0 w-full space-y-4">
            
            {/* Search & Sort Controls Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center gap-3">
              
              {/* Search Locality / Landmark */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
                <input
                  type="text"
                  value={activeSearchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by locality, project name, landmark, or builder..."
                  className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                />
                {activeSearchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#0F2A43] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <ArrowUpDown className="w-4 h-4 text-[#64748B] shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none cursor-pointer"
                >
                  <option value="recommended">Recommended & Verified</option>
                  <option value="newest">Newest & Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="area_desc">Largest Carpet Area</option>
                </select>
              </div>

              {/* Map view toggle */}
              <Link
                href={mapHref}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-colors"
                title="View matching listings on a map"
              >
                <MapPin className="w-4 h-4" />
                <span>Map view</span>
              </Link>

            </div>

            {/* Saved searches (save current filters, reapply, new-match badges, alerts) */}
            <SavedSearchesBar
              currentFilters={currentFilters}
              activeFilterCount={activeFiltersCount}
              onApply={applyFilters}
            />

            {/* Active Filter Badges */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs py-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase mr-1">Active:</span>
                
                {activeCity !== 'All' && (
                  <span className="bg-white border border-[#CBD5E1] text-[#0F2A43] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <MapPin className="w-3 h-3 text-[#18A67D]" />
                    {activeCity}
                    <button onClick={() => setSelectedCity('All')} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {activeCategory !== 'All' && (
                  <span className="bg-[#E7F6F1] border border-[#18A67D] text-[#0E7C5D] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <Tag className="w-3 h-3" />
                    {activeCategory}
                    <button onClick={() => setSelectedCategory('All')} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {activeListingType !== 'all' && (
                  <span className="bg-[#0F2A43] text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <span className="capitalize">{activeListingType}</span>
                    <button onClick={() => setListingType('all')} className="hover:text-rose-300 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {isCommercial && commercialDealType !== 'all' && (
                  <span className="bg-[#E7F6F1] border border-[#18A67D] text-[#0E7C5D] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <span className="capitalize">For {commercialDealType}</span>
                    <button onClick={() => setCommercialDealType('all')} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {sizeActive && (
                  <span className="bg-slate-100 border border-slate-300 text-[#0F2A43] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <Ruler className="w-3 h-3 text-[#18A67D]" />
                    {minSize}{maxSize > 0 ? `–${maxSize}` : '+'} sq.ft
                    <button onClick={() => { setMinSize(MIN_SIZE_SQFT); setMaxSize(0); }} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {!isCommercial && activeBhk.map((b) => (
                  <span key={b} className="bg-slate-100 border border-slate-300 text-[#0F2A43] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <span>{b} BHK</span>
                    <button onClick={() => handleToggleBhk(b)} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                ))}

                {verifiedOnly && (
                  <span className="bg-[#E7F6F1] border border-[#18A67D] text-[#0E7C5D] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Only
                    <button onClick={() => setVerifiedOnly(false)} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {ownerOnly && (
                  <span className="bg-amber-50 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    Owner Direct
                    <button onClick={() => setOwnerOnly(false)} className="hover:text-rose-600 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                {reraOnly && (
                  <span className="bg-slate-800 text-white px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-2xs">
                    RERA Registered
                    <button onClick={() => setReraOnly(false)} className="hover:text-rose-300 ml-0.5 cursor-pointer">×</button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 font-bold hover:underline ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Properties Grid */}
            {filteredProperties.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0] space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full flex items-center justify-center mx-auto text-[#94A3B8]">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-lg font-bold text-[#0F2A43]">No matching properties found</h3>
                  <p className="text-xs text-[#64748B]">
                    We couldn&apos;t find listings matching your filters ({activeCategory !== 'All' ? activeCategory : ''} in {activeCity}). Try expanding your criteria or resetting filters.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filters & Show All
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredProperties.map((prop) => {
                  const shortlisted = isShortlisted(prop.id);

                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Carousel / Banner */}
                        <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                          <Image
                            src={prop.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'}
                            alt={propertyImageAlt(prop)}
                            fill
                            referrerPolicy="no-referrer"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-[#0F2A43]/90 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                                {prop.category}
                              </span>
                              {prop.isVerified && (
                                <span className="bg-[#18A67D] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              )}
                              {prop.postedBy.type === 'Owner' && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                                  Owner Direct
                                </span>
                              )}
                            </div>

                            {/* Shortlist Heart Button */}
                            <button
                              onClick={() => toggleShortlist(prop.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-xs ${
                                shortlisted
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-black/40 text-white hover:bg-black/60'
                              }`}
                              title={shortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                            >
                              <Heart className={`w-4 h-4 ${shortlisted ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Bottom Image Strip */}
                          <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                            {prop.bhk ? `${prop.bhk} BHK • ` : ''}{prop.carpetAreaSqFt} sq.ft
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-3">
                          
                          {/* Price & Location */}
                          <div>
                            <div className="flex items-baseline justify-between">
                              <div className="text-xl font-black text-[#0E7C5D]">
                                {prop.priceFormatted}
                              </div>
                              {prop.carpetAreaSqFt && (
                                <span className="text-[11px] text-[#64748B] font-semibold">
                                  ₹{Math.round(prop.price / prop.carpetAreaSqFt).toLocaleString('en-IN')}/sq.ft
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-[#0F2A43] truncate mt-0.5" title={prop.title}>
                              {prop.title}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
                              <span className="truncate">{prop.locality}, {prop.city}</span>
                            </div>
                          </div>

                          {/* Spec Badges */}
                          <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-[#F1F5F9] text-center text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-[#94A3B8] block text-[10px]">Furnishing</span>
                              <span className="font-bold text-[#0F2A43] truncate block">{prop.furnishing}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[#94A3B8] block text-[10px]">Status</span>
                              <span className="font-bold text-[#0F2A43] truncate block">{prop.constructionStatus}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[#94A3B8] block text-[10px]">Posted By</span>
                              <span className="font-bold text-[#0E7C5D] truncate block">{prop.postedBy.type}</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="p-5 pt-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/properties/${prop.id}`}
                            className="flex-1 py-2.5 bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/properties/${prop.id}`}
                            className="p-2.5 bg-[#E7F6F1] hover:bg-[#d0f0e6] text-[#0E7C5D] rounded-xl border border-[#18A67D]/20 transition-colors"
                            title="Contact Seller"
                          >
                            <Phone className="w-4 h-4" />
                          </Link>
                        </div>
                        {/* Ask Genie — opens the chat drawer with this listing as context. */}
                        <button
                          type="button"
                          onClick={() => openGenie(prop)}
                          className="w-full py-2.5 bg-[#EAF7F2] hover:bg-[#D7F0E7] text-[#0F2A43] text-xs font-bold rounded-xl border border-[#C9E9DD] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#18A67D]" />
                          <span>Ask Genie about this property</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B] mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. Verified Catalog.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/post-property" className="hover:text-[#18A67D]">Post Property</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">Dashboard</Link>
            <span className="text-slate-300">•</span>
            <Link href="/admin" className="hover:text-[#18A67D]">Admin Verification</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

function PropertiesCatalogInner() {
  const searchParams = useSearchParams();
  return <PropertiesCatalogContent key={searchParams.toString()} />;
}

export default function PropertiesCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
          <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
          <span>Loading verified properties catalog...</span>
        </div>
      </div>
    }>
      <PropertiesCatalogInner />
    </Suspense>
  );
}
