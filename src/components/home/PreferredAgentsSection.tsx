'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Award, ShieldCheck, PhoneCall } from 'lucide-react';
import { PreferredAgentItem } from '@/lib/homeSectionsData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface PreferredAgentsSectionProps {
  cityName?: string;
  onContactAgent?: (agent: PreferredAgentItem) => void;
}

export function PreferredAgentsSection({
  cityName = 'Lucknow',
  onContactAgent
}: PreferredAgentsSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live preferred agents from the API. No static fallback — an empty result
  // renders a "Space available" placeholder.
  const [allAgents, setAllAgents] = useState<PreferredAgentItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.agents)) setAllAgents(d.agents); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, []);

  // Filter agents by city or fallback to show full team
  const agents = React.useMemo(() => {
    const citySpecific = allAgents.filter(
      (a) => a.city.toLowerCase() === cityName.toLowerCase()
    );
    if (citySpecific.length >= 3) return citySpecific;

    const others = allAgents.filter(
      (a) => a.city.toLowerCase() !== cityName.toLowerCase()
    );
    return [...citySpecific, ...others];
  }, [allAgents, cityName]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleSelectAgent = (agent: PreferredAgentItem) => {
    if (onContactAgent) {
      onContactAgent(agent);
    } else {
      router.push(`/agents/${agent.id}`);
    }
  };

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight">
            BayBayt Preferred Agents in {cityName}
          </h2>
          {/* Teal accent underline as in reference image */}
          <div className="w-12 h-1 bg-[#18A67D] rounded-full mt-1.5" />
        </div>

        <button
          onClick={() => router.push(`/agents?city=${encodeURIComponent(cityName)}`)}
          className="text-xs sm:text-sm font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>See all</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {agents.length === 0 ? (
        <SpaceAvailable
          title="Space available"
          message={`Preferred agents in ${cityName} will appear here once onboarded.`}
        />
      ) : (
      /* Carousel Container */
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Previous Agents"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => handleSelectAgent(agent)}
              className="w-[260px] sm:w-[285px] flex-shrink-0 snap-start bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md hover:border-[#18A67D]/40 transition-all duration-300 cursor-pointer flex flex-col group/card"
            >
              {/* Top Header Band (Teal Tinted) */}
              <div className="bg-[#E7F6F1] p-3.5 flex items-center justify-between border-b border-[#D1F0E6]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white shadow-xs relative flex-shrink-0 bg-white">
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-[#0E7C5D] uppercase tracking-wider flex items-center gap-1">
                      <span>BayBayt Preferred</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F2A43] truncate group-hover/card:text-[#18A67D] transition-colors">
                      {agent.name}
                    </h3>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-[#0F2A43] text-[#22C39A] flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              {/* Middle Agency Info */}
              <div className="p-3.5 space-y-3 bg-white flex-1 flex flex-col justify-between">
                <div>
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
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#172033] truncate">
                        {agent.agencyName}
                      </h4>
                    </div>
                  </div>

                  {/* Two Stats Columns */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
                    <div>
                      <div className="text-[#94A3B8] text-[10px]">Operating Since</div>
                      <div className="font-semibold text-[#172033] mt-0.5">{agent.operatingSince}</div>
                    </div>
                    <div className="border-l border-[#F1F5F9] pl-2">
                      <div className="text-[#94A3B8] text-[10px]">Buyers Served</div>
                      <div className="font-semibold text-[#172033] mt-0.5">{agent.buyersServed}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Big Properties Count */}
                <div className="pt-2.5 border-t border-[#F1F5F9] flex items-baseline justify-between">
                  <div>
                    <span className="text-lg sm:text-xl font-extrabold text-[#0F2A43]">
                      {agent.propertiesForSaleCount}
                    </span>
                    <span className="text-xs text-[#64748B] font-medium ml-1.5">
                      Properties for Sale
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[#18A67D] group-hover/card:translate-x-0.5 transition-transform">
                    View →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Next Agents"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      )}
    </section>
  );
}
