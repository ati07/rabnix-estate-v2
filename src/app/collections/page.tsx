'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Crown, 
  IndianRupee, 
  Home, 
  Briefcase, 
  MapPin, 
  TrendingUp, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  Building2,
  PhoneCall,
  Check
} from 'lucide-react';
import { CURATED_COLLECTIONS, CuratedCollection, matchesCollectionFilters, collectionPriceRange } from '@/lib/collectionsData';
import { CITIES_DATA } from '@/lib/realEstateData';
import { useProperties } from '@/lib/propertyContext';

const ICON_MAP: Record<string, any> = {
  CheckCircle2,
  ShieldCheck,
  Crown,
  IndianRupee,
  Home,
  Briefcase
};

function CollectionsHubContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || 'All';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { properties } = useProperties();

  // Live collections from the API; seed with static data for first paint + offline.
  const [collections, setCollections] = useState<CuratedCollection[]>(CURATED_COLLECTIONS);
  useEffect(() => {
    let active = true;
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.collections)) setCollections(d.collections); })
      .catch(() => { /* keep static fallback */ });
    return () => { active = false; };
  }, []);

  // All distinct tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    collections.forEach((c) => tags.add(c.tag));
    return ['All', ...Array.from(tags)];
  }, [collections]);

  // Filter collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // City filter
      if (selectedCity !== 'All' && !c.recommendedCities.includes(selectedCity)) {
        return false;
      }
      // Tag filter
      if (selectedTag !== 'All' && c.tag !== selectedTag) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSubtitle = c.subtitle.toLowerCase().includes(q);
        const matchOverview = c.overview.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchOverview) {
          return false;
        }
      }
      return true;
    });
  }, [collections, selectedCity, selectedTag, searchQuery]);

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
              href="/properties"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              All Properties
            </Link>
            <Link
              href="/builders"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Top Builders & Projects
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

      {/* Hero Banner */}
      <div className="relative bg-[#0F2A43] text-white py-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#18A67D_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#22C39A] font-bold">Curated Property Collections</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#18A67D]/20 text-[#22C39A] px-3 py-1 rounded-full text-xs font-bold border border-[#18A67D]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Handpicked & Verified Portfolios</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Curated Property Collections
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explore specialized collections handpicked by BayBayt real estate analysts. From direct owner homes to ready-to-move OC residences, signature penthouses, and high-yield commercial assets.
              </p>
            </div>

            {/* Quick Stats Box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Collections</span>
                <span className="text-lg font-black text-white">{collections.length} Portfolios</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Listings</span>
                <span className="text-lg font-black text-[#22C39A]">{properties.length} Verified</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Owner Direct</span>
                <span className="text-lg font-black text-amber-400">Verified Homes</span>
              </div>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            {/* City Selector */}
            <div className="w-full sm:w-64 relative">
              <MapPin className="w-4 h-4 text-[#22C39A] absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:bg-[#0F2A43] focus:border-[#22C39A]"
              >
                <option value="All" className="bg-[#0F2A43] text-white">All Indian Cities</option>
                {CITIES_DATA.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#0F2A43] text-white">
                    {c.name} ({c.state})
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar text-xs">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#18A67D] text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Collections Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 space-y-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2A43] tracking-tight">
              Featured Collections {selectedCity !== 'All' ? `in ${selectedCity}` : 'Across India'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select any collection to view detailed specifications, price intelligence, and matching properties
            </p>
          </div>
          <span className="text-xs font-bold text-[#0F2A43] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
            {filteredCollections.length} Collections Found
          </span>
        </div>

        {/* Big Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollections.map((col) => {
            const Icon = ICON_MAP[col.iconName] || Sparkles;
            // Live inventory for this collection (approved listings matching its
            // filter) — replaces the old fabricated count / price strings.
            const matched = properties.filter((p) => matchesCollectionFilters(p, col.filters));
            const priceRange = collectionPriceRange(matched);

            return (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Hero Cover Image */}
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image
                      src={col.heroImage}
                      alt={col.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43] via-[#0F2A43]/40 to-transparent" />
                    
                    {/* Badges on Top */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className={`${col.tagColor} text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{col.tag}</span>
                      </span>

                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {col.badge}
                      </span>
                    </div>

                    {/* Bottom overlay text */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-lg font-bold group-hover:text-[#22C39A] transition-colors leading-tight">
                        {col.title}
                      </h3>
                      {matched.length > 0 && (
                        <span className="text-[11px] text-slate-300 font-medium">
                          {matched.length} {matched.length === 1 ? 'Property' : 'Properties'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {col.subtitle}
                    </p>

                    {/* Live price bracket from matching listings (hidden when none) */}
                    {priceRange && (
                      <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-xs">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Price Bracket</span>
                          <span className="font-extrabold text-[#0F2A43] text-xs">{priceRange}</span>
                        </div>
                      </div>
                    )}

                    {/* Highlights bullet previews */}
                    <div className="space-y-1.5 pt-1">
                      {col.keyHighlights.slice(0, 2).map((h, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-[#0F2A43]">
                          <Check className="w-3.5 h-3.5 text-[#18A67D] shrink-0 mt-0.5" />
                          <span className="text-[11px] font-semibold line-clamp-1">{h.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recommended Cities */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#F1F5F9] text-[11px]">
                      <span className="text-[#94A3B8] font-bold">Top Cities:</span>
                      {col.recommendedCities.slice(0, 3).map((city) => (
                        <span key={city} className="bg-slate-100 text-[#475569] px-2 py-0.5 rounded font-semibold text-[10px]">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/collections/${col.id}`}
                    className="w-full py-3 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group/btn"
                  >
                    <span>{col.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

        {/* Why Curated Section */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-xl font-black text-[#0F2A43] tracking-tight">
              Why Browse BayBayt Curated Collections?
            </h3>
            <p className="text-xs text-[#64748B]">
              Every collection undergoes stringent data verification, title check, and price benchmark modeling
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E7F6F1] flex items-center justify-center text-[#18A67D]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">100% Legal Title Validation</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                All projects in curated collections are verified against state RERA databases, encumbrance certificates, and sanctioned municipal plans.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">Data-Driven Valuation</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Backed by real-time registration data to ensure property valuations are aligned with accurate locality micro-market rates.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">Direct Connection</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Direct contact lines to verified individual owners and official developer sales desks with zero spam.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. Curated Collections Directory.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">Properties</Link>
            <span className="text-slate-300">•</span>
            <Link href="/builders" className="hover:text-[#18A67D]">Top Builders</Link>
            <span className="text-slate-300">•</span>
            <Link href="/post-property" className="hover:text-[#18A67D]">Post Property</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function CollectionsHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
          <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
          <span>Loading Curated Collections...</span>
        </div>
      </div>
    }>
      <CollectionsHubContent />
    </Suspense>
  );
}
