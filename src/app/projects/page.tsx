'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  MapPin,
  Search,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
  CalendarClock,
} from 'lucide-react';
import { FeaturedProjectItem } from '@/lib/homeSectionsData';
import { CITIES_DATA } from '@/lib/realEstateData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

const STATUS_FILTERS: Array<'All' | FeaturedProjectItem['status']> = [
  'All',
  'Ready to Move',
  'Under Construction',
  'New Launch',
];

function ProjectsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || 'All';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | FeaturedProjectItem['status']>('All');

  // Live projects from the API. No static fallback — an empty result renders a
  // "Space available" placeholder.
  const [projects, setProjects] = useState<FeaturedProjectItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.projects)) setProjects(d.projects); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedCity !== 'All' && p.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (statusFilter !== 'All' && p.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${p.name} ${p.builderName} ${p.locality} ${p.city} ${p.bhkConfig} ${p.tag ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [projects, selectedCity, searchQuery, statusFilter]);

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
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#18A67D_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#22C39A] font-bold">New & Featured Projects</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#18A67D]/20 text-[#22C39A] px-3 py-1 rounded-full text-xs font-bold border border-[#18A67D]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RERA-Approved Project Directory</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                New &amp; Featured Projects
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Explore verified townships, luxury high-rises, and immediate-possession homes from India&apos;s most trusted developers.
              </p>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Projects</span>
                <span className="text-lg font-black text-white">{projects.length}+ Listed</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ready to Move</span>
                <span className="text-lg font-black text-[#22C39A]">
                  {projects.filter((p) => p.status === 'Ready to Move').length}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">RERA Clearance</span>
                <span className="text-lg font-black text-amber-400">100% Certified</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, builder, or locality..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none focus:bg-[#0F2A43] focus:border-[#22C39A]"
              />
            </div>

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

          {/* Status pills */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((s) => {
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#18A67D] text-white border-[#18A67D]'
                      : 'bg-white/10 text-slate-200 border-white/20 hover:border-[#22C39A]'
                  }`}
                >
                  {s === 'All' ? 'All Projects' : s}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Main Projects Showcase */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2A43] tracking-tight">
              Projects {selectedCity !== 'All' ? `in ${selectedCity}` : 'Across India'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select a project to view configurations, floor plans, and possession timelines
            </p>
          </div>
          <span className="text-xs font-bold text-[#0F2A43] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
            {filteredProjects.length} Projects Found
          </span>
        </div>

        {filteredProjects.length === 0 ? (
          <SpaceAvailable
            title="Space available"
            message="No projects are listed yet. New & featured projects will appear here as developers publish them."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43]/90 via-[#0F2A43]/20 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm ${
                        project.status === 'Ready to Move'
                          ? 'bg-[#18A67D] text-white'
                          : project.status === 'New Launch'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {project.status}
                      </span>
                      {project.tag && (
                        <span className="bg-black/60 backdrop-blur-xs text-[#22C39A] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {project.tag}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base font-extrabold truncate group-hover:text-[#22C39A] transition-colors leading-tight">
                        {project.name}
                      </h3>
                      <span className="text-[11px] text-slate-200 font-medium truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {project.locality}, {project.city}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white shrink-0">
                        <Image
                          src={project.builderLogo}
                          alt={project.builderName}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#64748B] truncate">
                        by {project.builderName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-xs">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Config
                        </span>
                        <span className="font-extrabold text-[#0F2A43] text-[11px] truncate block">{project.bhkConfig}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" /> Possession
                        </span>
                        <span className="font-extrabold text-[#18A67D] text-[11px] truncate block">
                          {project.possessionDate || project.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Starting Price</span>
                        <span className="font-black text-[#0F2A43] text-sm">{project.priceFormatted}</span>
                      </div>
                      {project.reraNumber && (
                        <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> RERA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <span className="w-full py-3 bg-[#0F2A43] group-hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2">
                    <span>View Project Details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. New &amp; Featured Projects Directory.</span>
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

export default function ProjectsDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
          <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
          <span>Loading Projects Directory...</span>
        </div>
      </div>
    }>
      <ProjectsDirectoryContent />
    </Suspense>
  );
}
