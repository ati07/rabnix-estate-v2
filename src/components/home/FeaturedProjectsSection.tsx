'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Building, MapPin, Sparkles } from 'lucide-react';
import { FeaturedProjectItem } from '@/lib/homeSectionsData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface FeaturedProjectsSectionProps {
  cityName?: string;
  onSelectProject?: (project: FeaturedProjectItem) => void;
}

export function FeaturedProjectsSection({
  cityName = 'Lucknow',
  onSelectProject
}: FeaturedProjectsSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live, city-scoped featured projects from the API (approved only). No static
  // demo fallback — an empty result renders a "Space available" placeholder.
  const [projects, setProjects] = useState<FeaturedProjectItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects?section=featured&city=${encodeURIComponent(cityName)}`)
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.projects)) setProjects(d.projects); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, [cityName]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 420;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleClickProject = (project: FeaturedProjectItem) => {
    if (onSelectProject) {
      onSelectProject(project);
    } else {
      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <section className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight">
            Featured Projects
          </h2>
          {/* Yellow accent underline as in reference image */}
          <div className="w-12 h-1 bg-[#F59E0B] rounded-full mt-1.5" />
        </div>

        <button
          onClick={() => router.push(`/projects?city=${encodeURIComponent(cityName)}`)}
          className="text-xs sm:text-sm font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span>See all Projects</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {projects.length === 0 ? (
        <SpaceAvailable
          title="Space available"
          message={`Featured projects in ${cityName} will appear here once listed.`}
        />
      ) : (
      /* Carousel Container */
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Previous Projects"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleClickProject(project)}
              className="w-[310px] sm:w-[460px] flex-shrink-0 snap-start bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col group/card"
            >
              {/* Project Hero Image */}
              <div className="relative h-48 sm:h-56 w-full bg-[#E2E8F0] overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 640px) 310px, 460px"
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                
                {project.tag && (
                  <div className="absolute top-3 left-3 bg-[#0F2A43]/85 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {project.tag}
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-[#0F2A43] text-[10px] font-bold px-2.5 py-1 rounded shadow-xs">
                  {project.status}
                </div>
              </div>

              {/* Card Bottom Details Bar */}
              <div className="p-4 flex items-center justify-between gap-3 bg-white">
                {/* Left: Builder Logo + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-lg border border-[#E2E8F0] overflow-hidden flex-shrink-0 bg-white p-0.5 relative shadow-xs">
                    <Image
                      src={project.builderLogo}
                      alt={project.builderName}
                      fill
                      sizes="44px"
                      className="object-cover rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#0F2A43] truncate group-hover/card:text-[#18A67D] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B] truncate">
                      by {project.builderName}
                    </p>
                    <p className="text-[11px] text-[#64748B] flex items-center gap-1 truncate mt-0.5">
                      <MapPin className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
                      <span className="truncate">{project.locality}</span>
                    </p>
                    <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                      Marketed by {project.marketedBy}
                    </p>
                  </div>
                </div>

                {/* Right: Configurations + Price */}
                <div className="text-right flex-shrink-0 pl-2">
                  <div className="text-xs sm:text-sm font-semibold text-[#172033]">
                    {project.bhkConfig}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#0F2A43] mt-0.5">
                    {project.priceFormatted}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Next Projects"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      )}
    </section>
  );
}
