'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { FeaturedProjectItem } from '@/lib/homeSectionsData';
import { SpaceAvailable } from '@/components/SpaceAvailable';

interface TopProjectsSectionProps {
  cityName?: string;
  onSelectProject?: (project: FeaturedProjectItem) => void;
}

export function TopProjectsSection({
  cityName = 'Lucknow',
  onSelectProject
}: TopProjectsSectionProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live, city-scoped top projects from the API (approved only). No static demo
  // fallback — an empty result renders a "Space available" placeholder.
  const [projects, setProjects] = useState<FeaturedProjectItem[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects?section=top&city=${encodeURIComponent(cityName)}`)
      .then((r) => r.json())
      .then((d) => { if (active && d?.success && Array.isArray(d.projects)) setProjects(d.projects); })
      .catch(() => { /* leave empty → Space available */ });
    return () => { active = false; };
  }, [cityName]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
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
      {/* Section Header with baybaytHomes badge */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight">
              Top Projects
            </h2>
            {/* baybaytHomes badge like magicHomes */}
            <span className="inline-flex items-center gap-1 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
              <span className="text-[#0F2A43]">baybayt</span>
              <span className="text-[#E11D48]">Homes</span>
            </span>
          </div>
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
          message={`Top projects in ${cityName} will appear here once listed.`}
        />
      ) : (
      /* Projects Slider */
      <div className="relative group">
        {projects.length > 2 && (
          <>
            <button
              onClick={() => handleScroll('left')}
              aria-label="Previous Top Projects"
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              aria-label="Next Top Projects"
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#172033] hover:bg-[#F8FAFC] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleClickProject(project)}
              className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md hover:border-[#CBD5E1] transition-all duration-300 cursor-pointer flex flex-col group/card"
            >
              {/* Cover Image */}
              <div className="relative h-44 w-full bg-[#E2E8F0] overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 640px) 280px, 320px"
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {project.tag && (
                  <div className="absolute top-2.5 left-2.5 bg-[#0F2A43]/85 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {project.tag}
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 bg-white/90 text-[#0F2A43] text-[10px] font-bold px-2 py-0.5 rounded">
                  {project.status}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col justify-between flex-1 bg-white space-y-2.5">
                <div>
                  <h3 className="text-base font-bold text-[#0F2A43] group-hover/card:text-[#18A67D] transition-colors truncate">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                    by {project.builderName}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">
                    {project.locality}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F1F5F9]">
                  <div className="text-xs font-semibold text-[#172033]">
                    {project.bhkConfig}
                  </div>
                  <div className="text-sm font-bold text-[#0F2A43] mt-0.5">
                    {project.priceFormatted}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-1 truncate">
                    Marketed by {project.marketedBy}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
