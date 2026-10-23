'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Award,
  ShieldCheck,
  MapPin,
  Search,
  ArrowRight,
  ChevronRight,
  Users,
  Phone,
  Sparkles,
} from 'lucide-react';
import { PreferredAgentItem } from '@/lib/homeSectionsData';
import { CITIES_DATA } from '@/lib/realEstateData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

function AgentsDirectoryContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || 'All';

  const [selectedCity, setSelectedCity] = useState<string>(initialCity);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live agents from the API. No static fallback — an empty result renders a
  // "Space available" placeholder.
  const [agents, setAgents] = useState<PreferredAgentItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.agents)) setAgents(d.agents); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((a) => {
      if (selectedCity !== 'All' && a.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const areas = (a.areasServed || []).join(' ');
        const specs = (a.specializations || []).join(' ');
        const haystack = `${a.name} ${a.agencyName} ${a.city} ${areas} ${specs}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [agents, selectedCity, searchQuery]);

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
            <span className="text-[#22C39A] font-bold">BayBayt Preferred Agents</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#18A67D]/20 text-[#22C39A] px-3 py-1 rounded-full text-xs font-bold border border-[#18A67D]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Agent Directory</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                BayBayt Preferred Agents
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect directly with RERA-verified property experts. Every preferred agent is vetted for track record, responsiveness, and transparent dealing.
              </p>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Agents</span>
                <span className="text-lg font-black text-white">{agents.length}+ Verified</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">RERA Verified</span>
                <span className="text-lg font-black text-amber-400">100% Vetted</span>
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
                placeholder="Search by agent name, agency, or area served..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none focus:bg-[#0F2A43] focus:border-[#22C39A]"
              />
            </div>

            <div className="w-full sm:w-52 relative">
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

      {/* Main Agents Showcase */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#0F2A43] tracking-tight">
              Preferred Agents {selectedCity !== 'All' ? `in ${selectedCity}` : 'Across India'}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select an agent to view their profile, active listings, and contact details
            </p>
          </div>
          <span className="text-xs font-bold text-[#0F2A43] bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0] shadow-2xs">
            {filteredAgents.length} Agents Found
          </span>
        </div>

        {filteredAgents.length === 0 ? (
          <SpaceAvailable
            title="Space available"
            message="No preferred agents are listed yet. Verified agents will appear here as they are onboarded."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Header band */}
                <div className="bg-[#E7F6F1] p-4 flex items-center justify-between border-b border-[#D1F0E6]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-xs relative flex-shrink-0 bg-white">
                      <Image
                        src={agent.avatar}
                        alt={agent.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-[#0E7C5D] uppercase tracking-wider">
                        {agent.badge || 'BayBayt Preferred'}
                      </div>
                      <h3 className="text-sm font-bold text-[#0F2A43] truncate group-hover:text-[#18A67D] transition-colors">
                        {agent.name}
                      </h3>
                      <span className="text-[11px] text-[#64748B] truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {agent.city}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded border border-[#E2E8F0] overflow-hidden flex-shrink-0 relative bg-white p-0.5">
                      <Image
                        src={agent.agencyLogo}
                        alt={agent.agencyName}
                        fill
                        sizes="32px"
                        className="object-cover rounded-xs"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-[#172033] truncate">{agent.agencyName}</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-bold block">Since</span>
                      <span className="font-extrabold text-[#0F2A43] text-[11px]">{agent.operatingSince}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-bold block">Buyers</span>
                      <span className="font-extrabold text-[#18A67D] text-[11px]">{agent.buyersServed}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#94A3B8] font-bold block">For Sale</span>
                      <span className="font-extrabold text-[#0F2A43] text-[11px]">{agent.propertiesForSaleCount}</span>
                    </div>
                  </div>

                  {agent.reraId && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> RERA {agent.reraId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <span className="w-full py-2.5 bg-[#0F2A43] group-hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    <span>View Profile &amp; Contact</span>
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
          <span>&copy; {new Date().getFullYear()} BayBayt. Preferred Agents Directory.</span>
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

export default function AgentsDirectoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
          <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
          <span>Loading Agents Directory...</span>
        </div>
      </div>
    }>
      <AgentsDirectoryContent />
    </Suspense>
  );
}
