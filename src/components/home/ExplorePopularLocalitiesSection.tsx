'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ExternalLink, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PopularLocalityCardItem } from '@/lib/homeSectionsData';
import { SpaceAvailable } from '@/components/SpaceAvailable';
import { CarouselSkeleton } from '@/components/home/SectionSkeleton';

interface ExplorePopularLocalitiesSectionProps {
  cityName?: string;
  popularLocalities?: string[];
  onSelectLocality?: (localityName: string) => void;
}

export function ExplorePopularLocalitiesSection({
  cityName = 'Lucknow',
  popularLocalities = [],
  onSelectLocality
}: ExplorePopularLocalitiesSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live localities (admin-curated tiles with approved inventory) from the API.
  // No static fallback — an empty result renders a "Space available" placeholder.
  const [localities, setLocalities] = useState<PopularLocalityCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/localities?city=${encodeURIComponent(cityName)}`)
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.localities)) setLocalities(d.localities); })
      .catch(() => { /* leave empty → Space available */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cityName, popularLocalities]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleLocalityClick = (localityName: string) => {
    if (onSelectLocality) {
      onSelectLocality(localityName);
    } else {
      router.push(`/properties?city=${encodeURIComponent(cityName)}&locality=${encodeURIComponent(localityName)}`);
    }
  };

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
      {/* Container with Left Teaser Block and Right Slider */}
      <div className="relative group flex flex-col md:flex-row items-stretch gap-4 sm:gap-5">
        
        {/* Left Distinct Teaser Block */}
        <div className="w-full md:w-56 lg:w-64 flex-shrink-0 bg-[#E7F6F1] rounded-2xl p-6 flex flex-col justify-center border border-[#D1F0E6] shadow-xs">
          <span className="font-serif italic text-2xl sm:text-3xl text-[#0E7C5D]">
            Explore
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
            Popular Localities in {cityName}
          </h2>
          <div className="w-12 h-1 bg-[#18A67D] rounded-full mt-3" />
        </div>

        {/* Right Localities Carousel Track */}
        {loading ? (
          <div className="flex-1 min-w-0">
            <CarouselSkeleton count={3} cardWidth="w-[230px] sm:w-[260px]" />
          </div>
        ) : localities.length === 0 ? (
          <div className="flex-1 min-w-0">
            <SpaceAvailable
              title="Space available"
              message={`Popular localities in ${cityName} will appear here once listings go live.`}
              className="h-full"
            />
          </div>
        ) : (
        <div className="flex-1 relative min-w-0">
          {/* Scroll Arrows */}
          <button
            onClick={() => handleScroll('left')}
            aria-label="Previous Localities"
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleScroll('right')}
            aria-label="Next Localities"
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory h-full items-stretch"
          >
            {localities.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleLocalityClick(loc.name)}
                className="w-[230px] sm:w-[260px] flex-shrink-0 snap-start bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col justify-between hover:shadow-md hover:border-[#CBD5E1] transition-all duration-300 cursor-pointer group/card"
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#0F2A43] group-hover/card:text-[#18A67D] transition-colors truncate">
                      {loc.name}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0 mt-0.5 group-hover/card:text-[#18A67D] transition-colors" />
                  </div>

                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    {loc.priceRangeSqFt}
                  </p>

                  {/* Circular Image Thumbnail */}
                  <div className="mt-3 flex justify-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs relative bg-[#E2E8F0]">
                      <Image
                        src={loc.thumbnail}
                        alt={loc.name}
                        fill
                        sizes="56px"
                        className="object-cover group-hover/card:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Pill CTA */}
                <div className="mt-4 pt-2">
                  <div className="bg-[#E7F6F1] hover:bg-[#D1F0E6] text-[#0E7C5D] text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-between transition-colors">
                    <span className="truncate">{loc.propertiesCount} Properties for Sale</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 ml-1 group-hover/card:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>
    </section>
  );
}
