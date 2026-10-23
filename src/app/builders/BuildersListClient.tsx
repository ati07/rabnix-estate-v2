'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { 
  Award, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Search, 
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Phone
} from 'lucide-react';
import { Builder, BuilderProject } from '@/lib/buildersData';
import { CITIES_DATA } from '@/lib/realEstateData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

function BuildersDirectoryContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || 'All';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minExperience, setMinExperience] = useState<number>(0);

  // Live builders from the API. No static fallback — an empty result renders a
  // "Space available" placeholder.
  const [builders, setBuilders] = useState<Builder[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/builders')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.builders)) setBuilders(d.builders); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, []);

  // Filter builders
  const filteredBuilders = useMemo(() => {
    return builders.filter((b) => {
      // City filter
      if (selectedCity !== 'All' && !b.citiesPresent.includes(selectedCity)) {
        return false;
      }
      // Experience filter
      if (b.experienceYears < minExperience) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchTagline = b.tagline.toLowerCase().includes(q);
        const matchSpecialties = b.specialties.some((s) => s.toLowerCase().includes(q));
        const matchProjects = b.projects.some(
          (p) => p.name.toLowerCase().includes(q) || p.locality.toLowerCase().includes(q)
        );
        if (!matchName && !matchTagline && !matchSpecialties && !matchProjects) {
          return false;
        }
      }
      return true;
    });
  }, [builders, selectedCity, searchQuery, minExperience]);

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
              href="/collections"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Curated Collections
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
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#18A67D_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#22C39A] font-bold">Top Reputed Builders & Projects</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#18A67D]/20 text-[#22C39A] px-3 py-1 rounded-full text-xs font-bold border border-[#18A67D]/30">
                <Award className="w-3.5 h-3.5" />
                <span>Developer Spotlight & RERA Directory</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Top Reputed Builders & Projects
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect directly with India&apos;s most established real estate developers. Explore verified RERA-approved townships, ongoing luxury high-rises, and immediate possession homes.
              </p>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Builders</span>
                <span className="text-lg font-black text-white">{builders.length}+ Verified</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivered Area</span>
                <span className="text-lg font-black text-[#22C39A]">650M+ Sq.Ft</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">RERA Clearance</span>
                <span className="text-lg font-black text-amber-400">100% Certified</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by builder name, flagship project, or locality..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none focus:bg-[#0F2A43] focus:border-[#22C39A]"
              />
            </div>

            {/* City Selector */}
            <div className="w-full sm:w-60 relative">
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

          </div>

        </div>
      </div>

      {/* Main Builders Showcase */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 space-y-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2A43] tracking-tight">
              Reputed Developers {selectedCity !== 'All' ? `Active in ${selectedCity}` : 'Across India'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select a builder to view their complete project catalog, possession timelines, and brochure downloads
            </p>
          </div>
          <span className="text-xs font-bold text-[#0F2A43] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
            {filteredBuilders.length} Builders Found
          </span>
        </div>

        {/* Builder Cards Grid */}
        {filteredBuilders.length === 0 ? (
          <SpaceAvailable
            title="Space available"
            message="No builders are listed yet. Verified developers will appear here as they are onboarded."
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBuilders.map((builder) => {
            return (
              <div
                key={builder.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={builder.bannerImage}
                      alt={builder.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43]/90 via-[#0F2A43]/30 to-transparent" />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-[#18A67D] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{builder.badge}</span>
                      </span>
                    </div>

                    {/* Logo & Name on Cover */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white bg-white shadow-md shrink-0">
                        <Image
                          src={builder.logo}
                          alt={builder.name}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                      <div className="text-white min-w-0">
                        <h3 className="text-base font-extrabold truncate group-hover:text-[#22C39A] transition-colors leading-tight">
                          {builder.name}
                        </h3>
                        <span className="text-[11px] text-slate-300 font-medium truncate block">
                          HQ: {builder.headquarters}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {builder.tagline}
                    </p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Experience</span>
                        <span className="font-extrabold text-[#0F2A43] text-xs">{builder.experienceYears} Yrs</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Delivered</span>
                        <span className="font-extrabold text-[#18A67D] text-xs">{builder.projectsDeliveredCount}+</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Ongoing</span>
                        <span className="font-extrabold text-[#0F2A43] text-xs">{builder.ongoingProjectsCount} Active</span>
                      </div>
                    </div>

                    {/* Flagship Projects Snippet */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-[#0F2A43] block">
                        Flagship Projects ({builder.projects.length}):
                      </span>
                      <div className="space-y-1">
                        {builder.projects.slice(0, 2).map((proj) => (
                          <div
                            key={proj.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-[#E2E8F0] text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-[#0F2A43] block truncate text-[11px]">{proj.name}</span>
                              <span className="text-[10px] text-[#64748B] block truncate">{proj.locality}, {proj.city}</span>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ${
                              proj.status === 'Ready to Move' ? 'bg-[#E7F6F1] text-[#0E7C5D]' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {proj.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Cities */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#F1F5F9] text-[11px]">
                      <span className="text-[#94A3B8] font-bold">Cities:</span>
                      {builder.citiesPresent.slice(0, 4).map((city) => (
                        <span key={city} className="bg-slate-100 text-[#475569] px-2 py-0.5 rounded font-semibold text-[10px]">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/builders/${builder.id}`}
                    className="w-full py-3 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 group/btn"
                  >
                    <span>View Projects & Profile ({builder.projects.length})</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
        )}

        {/* Builder Verification Guarantee */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="max-w-2xl space-y-1">
            <h3 className="text-xl font-black text-[#0F2A43] tracking-tight">
              BayBayt Builder Verification & Trust Protocol
            </h3>
            <p className="text-xs text-[#64748B]">
              Every developer featured on BayBayt adheres to the highest level of regulatory transparency
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#E7F6F1] flex items-center justify-center text-[#18A67D]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">100% State RERA Registration</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                We verify active RERA registration certificates, sanctioned architectural floor layouts, and escrow bank account disclosures.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">On-Time Possession Tracking</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Detailed audit of historical project delivery schedules, past possession track records, and construction stage audits.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">Direct Developer Sales Desk</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Official direct lines to authorized developer sales teams for verified pricing quotes, spot discounts, and site visit bookings.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. Top Reputed Builders Directory.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">Properties</Link>
            <span className="text-slate-300">•</span>
            <Link href="/collections" className="hover:text-[#18A67D]">Curated Collections</Link>
            <span className="text-slate-300">•</span>
            <Link href="/post-property" className="hover:text-[#18A67D]">Post Property</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function BuildersDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
          <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
          <span>Loading Builders Directory...</span>
        </div>
      </div>
    }>
      <BuildersDirectoryContent />
    </Suspense>
  );
}
