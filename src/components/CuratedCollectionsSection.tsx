'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, CheckCircle2, Crown, Sparkles, IndianRupee } from 'lucide-react';
import { SearchFilters } from '@/lib/types';
import { CuratedCollection } from '@/lib/collectionsData';
import { SpaceAvailable } from '@/components/SpaceAvailable';
import { GridSkeleton } from '@/components/home/SectionSkeleton';

interface CuratedCollectionsProps {
  cityName: string;
  onApplyPreset?: (filters: Partial<SearchFilters>) => void;
}

export function CuratedCollectionsSection({ cityName, onApplyPreset }: CuratedCollectionsProps) {
  // Live collections from the DB. No static fallback — an empty result renders a
  // "Space available" placeholder.
  const [allCollections, setAllCollections] = useState<CuratedCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.success && Array.isArray(d.collections)) {
          setAllCollections(d.collections);
        }
      })
      .catch(() => { /* leave empty → Space available */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const collections = allCollections.slice(0, 4);

  return (
    <section className="w-full bg-[#F8FAFC] py-12 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked by BayBayt</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
              Curated Property Collections
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/collections"
              className="text-xs font-bold text-[#18A67D] hover:text-[#0E7C5D] flex items-center gap-1 group/link"
            >
              <span>Explore All Portfolios ({allCollections.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Collections Grid */}
        {loading ? (
          <GridSkeleton count={4} />
        ) : collections.length === 0 ? (
          <SpaceAvailable
            title="Space available"
            message="Curated property collections will appear here once published."
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((item) => {
            return (
              <Link
                key={item.id}
                href={`/collections/${item.id}`}
                className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Visual Image Header */}
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={item.heroImage}
                      alt={item.title}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A43]/90 via-[#0F2A43]/30 to-transparent" />
                    
                    {/* Floating Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`${item.tagColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm`}>
                        <span>{item.tag}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-[#0F2A43] group-hover:text-[#18A67D] transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#18A67D]">
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        )}

      </div>
    </section>
  );
}
