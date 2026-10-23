'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, ShieldCheck, Building2, ExternalLink, ArrowRight } from 'lucide-react';
import { Builder } from '@/lib/buildersData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface TopBuildersProps {
  cityName: string;
}

export function TopBuildersSection({ cityName }: TopBuildersProps) {
  // Live builders from the DB. No static fallback — an empty result renders a
  // "Space available" placeholder.
  const [allBuilders, setAllBuilders] = useState<Builder[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/builders')
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.success && Array.isArray(d.builders)) {
          setAllBuilders(d.builders);
        }
      })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, []);

  const builders = allBuilders.slice(0, 4);

  return (
    <section className="w-full bg-white py-12 border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Developer Spotlight</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight mt-1">
              Top Reputed Builders & Projects in {cityName}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/builders"
              className="text-xs font-bold text-[#18A67D] hover:text-[#0E7C5D] flex items-center gap-1 group/link"
            >
              <span>Explore All Builders ({allBuilders.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Builder Cards */}
        {builders.length === 0 ? (
          <SpaceAvailable
            title="Space available"
            message={`Reputed builders in ${cityName} will appear here once listed.`}
          />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {builders.map((b) => (
            <Link
              key={b.id}
              href={`/builders/${b.id}`}
              className="bg-[#F8FAFC] hover:bg-white rounded-2xl p-4 border border-[#E2E8F0] hover:border-[#18A67D] hover:shadow-xl transition-all space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#E2E8F0] bg-white shadow-2xs">
                    <Image
                      src={b.logo}
                      alt={b.name}
                      fill
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <span className="bg-[#E7F6F1] text-[#0E7C5D] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{b.badge}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[#0F2A43] group-hover:text-[#18A67D] transition-colors">{b.name}</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2 leading-relaxed">{b.tagline}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-xl border border-[#E2E8F0]">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-semibold">Track Record</span>
                    <span className="font-extrabold text-[#0F2A43]">{b.experienceYears} Yrs</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-semibold">Delivered</span>
                    <span className="font-extrabold text-[#18A67D]">{b.projectsDeliveredCount}+ Projs</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end text-xs font-semibold text-[#0F2A43]">
                <span className="text-[#18A67D] font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Projects ({b.projects.length}) <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        )}

      </div>
    </section>
  );
}
