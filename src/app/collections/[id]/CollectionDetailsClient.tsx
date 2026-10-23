'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Crown, 
  IndianRupee, 
  Home, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  Heart, 
  Phone, 
  ChevronRight, 
  Building2, 
  Check, 
  SlidersHorizontal,
  ArrowUpDown,
  X,
  HelpCircle,
  Clock,
  Send
} from 'lucide-react';
import { CuratedCollection, collectionPriceRange } from '@/lib/collectionsData';
import { CITIES_DATA } from '@/lib/realEstateData';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import { SpaceAvailable } from '@/components/SpaceAvailable';
import type { Property } from '@/lib/types';

const ICON_MAP: Record<string, any> = {
  CheckCircle2,
  ShieldCheck,
  Crown,
  IndianRupee,
  Home,
  Briefcase
};

export default function CollectionDetailsClient({
  id,
  initialCollection,
  initialProperties,
}: {
  id: string;
  initialCollection: CuratedCollection | null;
  initialProperties: Property[] | null;
}) {
  const collectionId = id;
  const router = useRouter();

  // Seeded from the server so the first paint and crawler HTML carry the
  // collection and its matched listings; the API refresh below keeps them live.
  const [collection, setCollection] = useState<CuratedCollection | null>(initialCollection);
  const [loadFailed, setLoadFailed] = useState(false);
  const [liveProperties, setLiveProperties] = useState<Property[] | null>(initialProperties);
  const [otherCollections, setOtherCollections] = useState<CuratedCollection[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.collections)) setOtherCollections(d.collections); })
      .catch(() => { /* leave empty */ });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    fetch(`/api/collections/${collectionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success && d.collection) {
          setCollection(d.collection);
          if (Array.isArray(d.properties)) setLiveProperties(d.properties);
        } else {
          setLoadFailed(true);
        }
      })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [collectionId]);

  const { properties: ctxProperties, isShortlisted, toggleShortlist } = useProperties();
  const { user } = useAuth();

  // Prefer the API's live-matched listings; fall back to the shared context set.
  const properties = liveProperties ?? ctxProperties;

  // Local filter states
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedBhk, setSelectedBhk] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000000);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'area_desc'>('recommended');
  
  // Quick Inquiry Form State
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryPhone, setInquiryPhone] = useState(user?.phone || '');
  const [inquiryCity, setInquiryCity] = useState(collection?.recommendedCities[0] || 'Bangalore');
  const [isInquirySent, setIsInquirySent] = useState(false);

  // Toggle BHK
  const handleToggleBhk = (bhk: number) => {
    if (selectedBhk.includes(bhk)) {
      setSelectedBhk(selectedBhk.filter((b) => b !== bhk));
    } else {
      setSelectedBhk([...selectedBhk, bhk]);
    }
  };

  // Filter properties matching collection criteria
  const matchingProperties = useMemo(() => {
    if (!collection) return [];
    return properties.filter((p) => {
      // 1. Apply Collection-specific constraints
      if (collection.filters.isOwnerOnly && p.postedBy.type !== 'Owner' && !p.isExclusiveOwner) {
        return false;
      }
      if (collection.filters.constructionStatus && p.constructionStatus !== collection.filters.constructionStatus) {
        return false;
      }
      if (collection.filters.minPrice && p.price < collection.filters.minPrice) {
        return false;
      }
      if (collection.filters.maxPrice && p.price > collection.filters.maxPrice) {
        return false;
      }
      if (collection.filters.category && p.category.toLowerCase() !== collection.filters.category.toLowerCase()) {
        return false;
      }
      if (collection.filters.listingType && p.listingType !== collection.filters.listingType) {
        return false;
      }

      // 2. Apply User Interactive Filters
      if (selectedCity !== 'All' && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedBhk.length > 0 && p.bhk && !selectedBhk.includes(p.bhk)) {
        return false;
      }
      if (p.price < minPrice || p.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return (b.carpetAreaSqFt || 0) - (a.carpetAreaSqFt || 0);
      return 0;
    });
  }, [properties, collection, selectedCity, selectedBhk, minPrice, maxPrice, sortBy]);

  // Real price band for the currently matched listings (null when none).
  const priceRange = useMemo(() => collectionPriceRange(matchingProperties), [matchingProperties]);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryPhone.trim()) return;
    setIsInquirySent(true);
    setTimeout(() => {
      setIsInquirySent(false);
      setInquiryPhone('');
    }, 4000);
  };

  // Loading / not-found states — no static fallback.
  if (!collection) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        {loadFailed ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center max-w-md space-y-4 shadow-lg">
            <SlidersHorizontal className="w-10 h-10 text-[#CBD5E1] mx-auto" />
            <h2 className="text-xl font-bold text-[#0F2A43]">Collection Not Found</h2>
            <p className="text-sm text-[#64748B]">
              This curated collection isn&apos;t available. Browse all collections instead.
            </p>
            <Link
              href="/collections"
              className="inline-block px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl"
            >
              All Collections
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
            <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
            <span>Loading collection...</span>
          </div>
        )}
      </div>
    );
  }

  const Icon = ICON_MAP[collection.iconName] || Sparkles;

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
              href="/collections"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              All Collections
            </Link>
            <Link
              href="/builders"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Top Builders
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

      {/* Hero Showcase Banner */}
      <div className="relative bg-[#0F2A43] text-white py-12 px-4 sm:px-8 overflow-hidden">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0 z-0">
          <Image
            src={collection.heroImage}
            alt={collection.title}
            fill
            referrerPolicy="no-referrer"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2A43] via-[#0F2A43]/90 to-[#0F2A43]/70" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/collections" className="hover:text-white transition-colors">Collections</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#22C39A] font-bold">{collection.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${collection.tagColor} text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{collection.tag}</span>
                </span>
                <span className="bg-white/15 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                  {collection.badge}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {collection.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                {collection.overview}
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3 shrink-0 lg:w-80">
              {priceRange && (
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <span className="text-xs text-slate-300 font-medium">Price Range:</span>
                  <span className="text-sm font-extrabold text-white">{priceRange}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Available Units:</span>
                <span className="text-xs font-bold text-amber-400">{matchingProperties.length} Properties</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Body Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 space-y-10">
        
        {/* Key Highlights Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collection.keyHighlights.map((hl, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-2"
            >
              <div className="w-7 h-7 rounded-lg bg-[#E7F6F1] flex items-center justify-center text-[#18A67D] font-bold text-xs">
                0{idx + 1}
              </div>
              <h3 className="text-sm font-bold text-[#0F2A43] leading-snug">{hl.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{hl.description}</p>
            </div>
          ))}
        </section>

        {/* Filter and Property Listings Stream */}
        <section className="space-y-6">
          
          {/* Header & Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#0F2A43] tracking-tight">
                  Available Properties in {collection.title}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Showing {matchingProperties.length} verified listings meeting this portfolio&apos;s standards
                </p>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <ArrowUpDown className="w-4 h-4 text-[#64748B]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F2A43] outline-none cursor-pointer"
                >
                  <option value="recommended">Recommended & Verified</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="area_desc">Largest Carpet Area</option>
                </select>
              </div>
            </div>

            {/* Quick Interactive Filters */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F1F5F9]">
              
              {/* City Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0F2A43]">City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F2A43] outline-none cursor-pointer"
                >
                  <option value="All">All Cities</option>
                  {CITIES_DATA.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BHK Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0F2A43]">BHK:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((b) => {
                    const isSelected = selectedBhk.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() => handleToggleBhk(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F2A43] text-white'
                            : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {b} BHK
                      </button>
                    );
                  })}
                </div>
              </div>

              {(selectedCity !== 'All' || selectedBhk.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedCity('All');
                    setSelectedBhk([]);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-auto cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Properties Grid */}
          {matchingProperties.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E2E8F0] space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full flex items-center justify-center mx-auto text-[#94A3B8]">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-[#0F2A43]">No properties found for active filters</h3>
                <p className="text-xs text-[#64748B]">
                  Try changing your city or BHK selection to view more available properties in this curated collection.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCity('All');
                  setSelectedBhk([]);
                }}
                className="px-5 py-2.5 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingProperties.map((prop) => {
                const shortlisted = isShortlisted(prop.id);

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                        <Image
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'}
                          alt={prop.title}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-[#0F2A43]/90 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                              {prop.category}
                            </span>
                            {prop.isVerified && (
                              <span className="bg-[#18A67D] text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => toggleShortlist(prop.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-xs ${
                              shortlisted
                                ? 'bg-rose-500 text-white'
                                : 'bg-black/40 text-white hover:bg-black/60'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${shortlisted ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                          {prop.bhk ? `${prop.bhk} BHK • ` : ''}{prop.carpetAreaSqFt} sq.ft
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <div>
                          <div className="flex items-baseline justify-between">
                            <div className="text-xl font-black text-[#0E7C5D]">
                              {prop.priceFormatted}
                            </div>
                            <span className="text-[11px] text-[#64748B] font-semibold">
                              {prop.constructionStatus}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-[#0F2A43] truncate mt-0.5" title={prop.title}>
                            {prop.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
                            <span className="truncate">{prop.locality}, {prop.city}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 py-2 border-y border-[#F1F5F9] text-center text-[11px]">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Furnishing</span>
                            <span className="font-bold text-[#0F2A43] truncate block">{prop.furnishing}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Facing</span>
                            <span className="font-bold text-[#0F2A43] truncate block">{prop.facing || 'East'}</span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Posted By</span>
                            <span className="font-bold text-[#0E7C5D] truncate block">{prop.postedBy.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 pt-0 flex items-center gap-2">
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
                  </div>
                );
              })}
            </div>
          )}

        </section>

        {/* Dedicated Inquiry Box & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-[#E2E8F0]">
          
          {/* Quick Inquiry / Concierge Desk */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BayBayt Concierge</span>
              </div>
              <h3 className="text-base font-extrabold text-[#0F2A43]">
                Need Help Shortlisting in {collection.title}?
              </h3>
              <p className="text-xs text-[#64748B]">
                Our dedicated portfolio manager will send you a tailored PDF report of newly verified listings.
              </p>
            </div>

            {isInquirySent ? (
              <div className="p-4 bg-[#E7F6F1] border border-[#18A67D] rounded-xl text-center space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-[#18A67D] mx-auto" />
                <h4 className="text-xs font-bold text-[#0E7C5D]">Inquiry Received!</h4>
                <p className="text-[11px] text-[#0E7C5D]">
                  Our portfolio advisor will contact you within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Preferred City</label>
                  <select
                    value={inquiryCity}
                    onChange={(e) => setInquiryCity(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-bold text-[#0F2A43] outline-none cursor-pointer"
                  >
                    {CITIES_DATA.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Curated Shortlist</span>
                </button>
              </form>
            )}
          </div>

          {/* FAQs Accordion */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-[#0F2A43] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#18A67D]" />
                <span>Frequently Asked Questions</span>
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Everything you need to know about buying or renting in this collection
              </p>
            </div>

            <div className="space-y-3">
              {collection.faqs.map((faq, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-[#E2E8F0] space-y-1.5 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F2A43]">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Other Collections Pill Links */}
            {otherCollections.filter((c) => c.id !== collection.id).length > 0 && (
              <div className="pt-4 space-y-2">
                <span className="text-xs font-bold text-[#0F2A43] block">
                  Explore Other Curated Portfolios:
                </span>
                <div className="flex flex-wrap gap-2">
                  {otherCollections.filter((c) => c.id !== collection.id).map((other) => (
                    <Link
                      key={other.id}
                      href={`/collections/${other.id}`}
                      className="px-3 py-1.5 bg-white hover:bg-[#E7F6F1] text-[#0F2A43] hover:text-[#0E7C5D] border border-[#E2E8F0] hover:border-[#18A67D] rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      {other.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. {collection.title}.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/collections" className="hover:text-[#18A67D]">All Collections</Link>
            <span className="text-slate-300">•</span>
            <Link href="/builders" className="hover:text-[#18A67D]">Top Builders</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
