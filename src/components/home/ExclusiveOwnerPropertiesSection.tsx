'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Camera, CheckCircle } from 'lucide-react';
import { Property } from '@/lib/types';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface ExclusiveOwnerPropertiesSectionProps {
  cityName?: string;
  properties: Property[];
  onSelectProperty?: (property: Property) => void;
}

export function ExclusiveOwnerPropertiesSection({
  cityName = 'Lucknow',
  properties,
  onSelectProperty
}: ExclusiveOwnerPropertiesSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClickProperty = (prop: Property) => {
    if (onSelectProperty) {
      onSelectProperty(prop);
    } else {
      router.push(`/properties/${prop.id}`);
    }
  };

  // Strictly direct-owner listings in the active city. No other-city mixing and
  // no non-owner fallback — the owner badges must stay truthful. Empty → a
  // "Space available" placeholder (see below).
  const ownerProperties = React.useMemo(
    () =>
      properties.filter(
        (p) => p.isExclusiveOwner && p.city.toLowerCase() === cityName.toLowerCase()
      ),
    [properties, cityName]
  );

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight">
            Exclusive Owner Properties in {cityName}
          </h2>
          {/* Yellow accent underline */}
          <div className="w-12 h-1 bg-[#F59E0B] rounded-full mt-1.5" />
        </div>

        <button
          onClick={() => router.push(`/properties?city=${encodeURIComponent(cityName)}&owner=true`)}
          className="text-xs sm:text-sm font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>See all Properties</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {ownerProperties.length === 0 ? (
        <SpaceAvailable
          title="Space available"
          message={`Verified owner-direct listings in ${cityName} will appear here once posted.`}
        />
      ) : (
      /* Carousel Container */
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Previous Owner Properties"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {ownerProperties.map((prop) => {
            const photoCount = prop.images?.length || 4;
            return (
              <div
                key={prop.id}
                onClick={() => handleClickProperty(prop)}
                className="w-[240px] sm:w-[270px] flex-shrink-0 snap-start bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md hover:border-[#CBD5E1] transition-all duration-300 cursor-pointer flex flex-col group/card"
              >
                {/* Photo with count badge */}
                <div className="relative h-36 sm:h-40 w-full bg-[#E2E8F0] overflow-hidden">
                  <Image
                    src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                    alt={prop.title}
                    fill
                    sizes="(max-width: 640px) 240px, 270px"
                    className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Photo count pill */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{photoCount}</span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 bg-[#0F2A43]/90 text-[#22C39A] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Owner</span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <div className="text-xs text-[#64748B] font-medium">
                      {prop.bhk ? `${prop.bhk} BHK ${prop.category || 'Flat'}` : prop.category}
                    </div>

                    <div className="text-sm sm:text-base font-bold text-[#172033] mt-0.5 flex items-center gap-1.5">
                      <span>{prop.priceFormatted}</span>
                      <span className="text-[#94A3B8] font-normal">|</span>
                      <span className="text-xs sm:text-sm font-semibold text-[#64748B]">
                        {prop.carpetAreaSqFt ? `${prop.carpetAreaSqFt} sqft` : 'sqft'}
                      </span>
                    </div>

                    <div className="text-xs text-[#64748B] truncate mt-1">
                      {prop.subLocality || prop.locality}, {prop.city}
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-[#0E7C5D] mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span>{prop.constructionStatus || 'Ready to Move'}</span>
                    <span className="text-[10px] text-[#0E7C5D] font-bold">Owner Direct</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Next Owner Properties"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      )}
    </section>
  );
}
