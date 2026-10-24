'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Property, PropertyCategory, ListingType } from '@/lib/types';

interface ExploreCategoriesSectionProps {
  cityName: string;
  properties: Property[];
  onSelectCategory?: (category: PropertyCategory, listingType?: ListingType) => void;
}

interface CategoryCardItem {
  id: string;
  title: string;
  category: PropertyCategory;
  listingType: ListingType;
  subtitle: string;
  unit: string; // noun for the live count, e.g. "Properties" / "Plots" / "Beds"
  imageUrl: string;
  tag: string;
}

export function ExploreCategoriesSection({ cityName, properties, onSelectCategory }: ExploreCategoriesSectionProps) {
  const categories: CategoryCardItem[] = [
    {
      id: 'cat-apt',
      title: 'Residential Apartments',
      category: 'Apartment',
      listingType: 'buy',
      subtitle: 'Modern gated communities & high-rises',
      unit: 'Properties',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      tag: 'Most Popular'
    },
    {
      id: 'cat-villa',
      title: 'Independent Villas & Houses',
      category: 'Villa',
      listingType: 'buy',
      subtitle: 'Luxury private living with personal lawns',
      unit: 'Properties',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      tag: 'Luxury Collection'
    },
    {
      id: 'cat-plot',
      title: 'Residential Plots & Land',
      category: 'Residential Plot',
      listingType: 'plot',
      subtitle: 'RERA-approved gated layouts & farm lands',
      unit: 'Plots',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      tag: 'High Appreciation'
    },
    {
      id: 'cat-comm',
      title: 'Commercial Office & Retail',
      category: 'Commercial Office',
      listingType: 'commercial',
      subtitle: 'Grade-A tech parks, SCOs & retail shops',
      unit: 'Spaces',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      tag: 'High Yield'
    },
    {
      id: 'cat-pg',
      title: 'PG & Co-Living Spaces',
      category: 'PG / Co-Living',
      listingType: 'pg',
      subtitle: 'Fully furnished rooms with meals & WiFi',
      unit: 'Beds',
      imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      tag: 'Zero Deposit'
    }
  ];

  // Live inventory count per card for the active city. Keyed exactly the way the
  // /properties destination filters (city + listingType + category) so the badge
  // matches what the user lands on. Zero → the badge is hidden (no fake numbers).
  const countsById = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of categories) {
      map[item.id] = properties.filter(
        (p) =>
          p.city.toLowerCase() === cityName.toLowerCase() &&
          p.listingType === item.listingType &&
          p.category.toLowerCase() === item.category.toLowerCase()
      ).length;
    }
    return map;
    // categories is rebuilt each render but is a stable literal; cityName/properties drive it.
  }, [properties, cityName]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="w-full bg-white py-12 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Real Estate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
              Explore Properties by Category in {cityName}
            </h2>
          </div>
          <div className="text-xs font-semibold text-[#64748B]">
            Curated listings verified with legal titles & direct owner options
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((item) => {
            const queryParams = new URLSearchParams({
              city: cityName,
              category: item.category,
              listingType: item.listingType
            }).toString();
            const href = `/properties?${queryParams}`;

            return (
              <Link
                key={item.id}
                href={href}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(item.category, item.listingType);
                  }
                }}
                className="group relative bg-[#F8FAFC] hover:bg-white rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col no-underline"
              >
                {/* Image Container */}
                <div className="relative h-36 w-full overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    referrerPolicy="no-referrer"
                    // Grid is 5-up on lg, 2-up on sm, 1-up on mobile. Declaring
                    // the real rendered width lets Next serve a small variant
                    // instead of a full-viewport image (saves ~240 KiB).
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43]/80 via-[#0F2A43]/20 to-transparent" />
                  
                  {/* Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-[#0F2A43]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm backdrop-blur-xs">
                      {item.tag}
                    </span>
                  </div>

                  {/* Live property count for this category in the active city.
                      Hidden entirely when the city has none — no fabricated numbers. */}
                  {countsById[item.id] > 0 && (
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                      <span className="text-xs font-bold">
                        {countsById[item.id].toLocaleString('en-IN')} {item.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F2A43] group-hover:text-[#18A67D] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#18A67D]">
                    <span>Explore Now</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
