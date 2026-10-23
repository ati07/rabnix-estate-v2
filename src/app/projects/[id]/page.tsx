'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Heart, 
  Share2,
  Mail, 
  Calendar, 
  Layers, 
  Sparkles, 
  ArrowLeft, 
  Check,
  Info,
  Award,
  AlertCircle,
  FileText,
  Clock,
  Compass,
  Home,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Users
} from 'lucide-react';
import { FeaturedProjectItem } from '@/lib/homeSectionsData';
import { useAuth } from '@/lib/authContext';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  // Live project from the API. No static fallback: null while loading, and a
  // "not found" state when the API has no such project.
  const [project, setProject] = useState<FeaturedProjectItem | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success && d.project) setProject(d.project);
        else setLoadFailed(true);
      })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [projectId]);

  // Active gallery image
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(0);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryPhone, setInquiryPhone] = useState(user?.phone || '');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryMessage, setInquiryMessage] = useState(
    `Hi, I am interested in ${project?.name || 'this project'}. Please share the official RERA brochure, current price list, and arrange a site visit.`
  );
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        {loadFailed ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center max-w-md space-y-4 shadow-lg">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-[#0F2A43]">Project Not Found</h2>
            <p className="text-sm text-[#64748B]">
              The requested residential or commercial project could not be found.
            </p>
            <Link
              href="/properties"
              className="inline-block px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl"
            >
              Explore Active Properties
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
            <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
            <span>Loading project...</span>
          </div>
        )}
      </div>
    );
  }

  const galleryList = project.galleryImages && project.galleryImages.length > 0 
    ? project.galleryImages 
    : [project.image];

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryPhone.trim() || !inquiryName.trim()) return;

    setIsSubmittingInquiry(true);
    setTimeout(() => {
      setIsSubmittingInquiry(false);
      setIsInquirySubmitted(true);
    }, 600);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Breadcrumbs Bar */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-[#64748B] overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#0F2A43] font-semibold hover:text-[#18A67D] transition-colors mr-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <span>/</span>
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span>/</span>
            <span className="hover:text-[#18A67D]">Projects</span>
            <span>/</span>
            <span className="text-[#0F2A43] font-bold truncate max-w-[200px]">{project.name}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="p-2 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-[#64748B] hover:text-[#0F2A43] transition-colors relative cursor-pointer"
              title="Share Project"
            >
              {isCopied ? <Check className="w-4 h-4 text-[#18A67D]" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsShortlisted(!isShortlisted)}
              className={`p-2 border rounded-xl transition-colors cursor-pointer ${
                isShortlisted 
                  ? 'border-red-200 bg-red-50 text-red-500' 
                  : 'border-[#E2E8F0] text-[#64748B] hover:text-red-500 hover:bg-red-50'
              }`}
              title="Save Project"
            >
              <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Project Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {project.reraNumber ? (
                  <span className="px-2.5 py-1 bg-emerald-50 text-[#18A67D] font-bold text-xs rounded-md border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    RERA Registered: {project.reraNumber}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 font-bold text-xs rounded-md border border-slate-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    RERA details awaited
                  </span>
                )}
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-md border border-blue-100">
                  {project.status}
                </span>
                {project.tag && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold text-xs rounded-md border border-amber-100">
                    {project.tag}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43] tracking-tight">
                {project.name}
              </h1>
              <div className="flex flex-wrap items-center text-sm text-[#64748B] gap-y-1 gap-x-4">
                <div className="flex items-center text-slate-700 font-medium">
                  <Building2 className="w-4 h-4 text-[#18A67D] mr-1.5 shrink-0" />
                  By {project.builderName}
                </div>
                <div className="flex items-center text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                  {project.locality}, {project.city}
                </div>
              </div>
            </div>

            {/* Price block */}
            <div className="lg:text-right bg-slate-50 p-4 rounded-xl border border-[#E2E8F0]/70 lg:bg-transparent lg:p-0 lg:border-none">
              <div className="text-xs text-[#64748B] font-medium">Starting Price</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43]">
                {project.priceFormatted}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {project.pricePerSqFt ? `${project.pricePerSqFt} • ` : ''}{project.bhkConfig}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery + Quick Spec Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visual Carousel / Gallery */}
          <div className="lg:col-span-8 space-y-3">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 border border-[#E2E8F0] shadow-xs">
              <Image
                src={galleryList[activeImageIndex] || project.image}
                alt={project.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
                  Official Project Masterplan & Photos
                </span>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 text-white text-xs font-medium rounded-full">
                {activeImageIndex + 1} / {galleryList.length} Photos
              </div>
            </div>

            {/* Thumbnail Row */}
            {galleryList.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 sm:w-24 aspect-[4/3] rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-[#18A67D] scale-95 ring-2 ring-[#18A67D]/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Specifications Snapshot */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-[#0F2A43] text-base border-b border-[#F1F5F9] pb-3 flex items-center justify-between">
                <span>Project Snapshot</span>
                {project.reraNumber && (
                  <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">RERA Approved</span>
                )}
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Possession Status
                  </span>
                  <span className="font-bold text-[#0F2A43]">{project.possessionDate || project.status}</span>
                </div>

                {project.launchDate && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-[#64748B] flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      Launched
                    </span>
                    <span className="font-bold text-[#0F2A43]">{project.launchDate}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-400" />
                    Configurations
                  </span>
                  <span className="font-bold text-[#0F2A43]">{project.bhkConfig}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Project Size
                  </span>
                  <span className="font-bold text-[#0F2A43]">
                    {project.totalAreaAcres || '—'}{project.totalUnits ? ` • ${project.totalUnits} Units` : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    Open Space
                  </span>
                  <span className="font-bold text-[#18A67D]">{project.openSpacePercent || '—'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-[#64748B] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    Marketed By
                  </span>
                  <span className="font-bold text-[#0F2A43]">{project.marketedBy}</span>
                </div>
              </div>
            </div>

            {/* Quick Action CTA inside snapshot */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
              <a
                href="#inquiry-section"
                className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-center font-bold text-xs rounded-xl shadow-xs transition-colors block"
              >
                Request Site Visit & Price Sheet
              </a>
            </div>
          </div>
        </div>

        {/* Content Layout (Left: Details, Right: Sticky Inquiry) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Details Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Overview / Description */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#18A67D]" />
                About {project.name}
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                {project.description || `${project.name} is a premier residential landmark located strategically in ${project.locality}, ${project.city}. Built with world-class engineering standards by ${project.builderName}, this development provides luxurious community living with curated wellness amenities.`}
              </p>

              {/* Highlights Bullet List */}
              {project.highlights && project.highlights.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">Project Key Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {project.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#0F2A43] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <CheckCircle className="w-4 h-4 text-[#18A67D] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Floor Plans & Unit Layouts */}
            {project.floorPlans && project.floorPlans.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                  <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#18A67D]" />
                    Floor Plans & Master Configurations
                  </h2>
                  <span className="text-xs text-[#64748B]">
                    {project.floorPlans.length} Available Layouts
                  </span>
                </div>

                {/* Plan Selector Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {project.floorPlans.map((plan, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedFloorPlan(idx)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                        selectedFloorPlan === idx
                          ? 'bg-[#0F2A43] text-white shadow-xs'
                          : 'bg-slate-100 text-[#475569] hover:bg-slate-200'
                      }`}
                    >
                      {plan.bhk} ({plan.superBuiltUpAreaSqFt} sq.ft)
                    </button>
                  ))}
                </div>

                {/* Selected Plan Details */}
                {project.floorPlans[selectedFloorPlan] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-[#E2E8F0]">
                      <Image
                        src={project.floorPlans[selectedFloorPlan].image}
                        alt={project.floorPlans[selectedFloorPlan].type}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-1 rounded">
                        Architectural Layout
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                          {project.floorPlans[selectedFloorPlan].type}
                        </div>
                        <div className="text-xl font-bold text-[#0F2A43] mt-0.5">
                          {project.floorPlans[selectedFloorPlan].price}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Carpet Area</span>
                          <span className="font-bold text-slate-800 text-sm">
                            {project.floorPlans[selectedFloorPlan].carpetAreaSqFt} sq.ft
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block mb-0.5">Super Built-Up</span>
                          <span className="font-bold text-slate-800 text-sm">
                            {project.floorPlans[selectedFloorPlan].superBuiltUpAreaSqFt} sq.ft
                          </span>
                        </div>
                      </div>

                      <a
                        href="#inquiry-section"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#18A67D] hover:underline"
                      >
                        Request Complete PDF Floor Plan & Specifications
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Amenities Grid */}
            {project.amenities && project.amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#18A67D]" />
                  World-Class Amenities & Features
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {project.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-100 text-xs font-medium text-[#0F2A43] flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#18A67D] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Neighborhood Distance */}
            {project.nearbyLandmarks && project.nearbyLandmarks.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#18A67D]" />
                  Locality & Strategic Connectivity
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Situated at {project.address || `${project.locality}, ${project.city}`}. Proximity highlights:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {project.nearbyLandmarks.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#18A67D]" />
                        <span className="font-semibold text-[#0F2A43]">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Builder Background & Credibility */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 relative overflow-hidden border border-slate-200 flex items-center justify-center">
                    {project.builderLogo ? (
                      <Image
                        src={project.builderLogo}
                        alt={project.builderName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-lg font-extrabold text-[#0F2A43]">
                        {(project.builderName || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F2A43] text-base">{project.builderName}</h3>
                    {project.builderExperience && (
                      <p className="text-xs text-[#64748B]">{project.builderExperience}</p>
                    )}
                  </div>
                </div>

                {project.builderId && (
                  <Link
                    href={`/builders/${project.builderId}`}
                    className="px-3 py-1.5 border border-[#18A67D] text-[#18A67D] hover:bg-[#18A67D] hover:text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                  >
                    Builder Profile
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {project.builderDeliveredProjects ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Track Record</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {project.builderDeliveredProjects}+ Projects
                    </span>
                  </div>
                ) : null}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-400 block text-[11px] mb-0.5">RERA Status</span>
                  {project.reraNumber ? (
                    <span className="font-bold text-emerald-600 text-sm">Registered</span>
                  ) : (
                    <span className="font-bold text-slate-500 text-sm">Details Awaited</span>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Possession</span>
                  <span className="font-bold text-slate-800 text-sm">{project.possessionDate || project.status}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar: Inquiry Form */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Inquiry Form */}
            <div id="inquiry-section" className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4 sticky top-20">
              <div className="border-b border-[#F1F5F9] pb-3">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  Direct Builder / Channel Desk
                </span>
                <h3 className="text-base font-bold text-[#0F2A43] mt-1.5">
                  Interested in {project.name}?
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Get official brochures, floor plans, and schedule a personalized site tour.
                </p>
              </div>

              {isInquirySubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#18A67D] mx-auto" />
                  <div className="text-sm font-bold text-emerald-900">Inquiry Received!</div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Thank you, {inquiryName}. The project team for <strong>{project.name}</strong> will reach out to you at <strong>{inquiryPhone}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setIsInquirySubmitted(false)}
                    className="text-xs text-emerald-700 font-bold underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#18A67D] bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (with WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#18A67D] bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#18A67D] bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Message / Requirements</label>
                    <textarea
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#18A67D] bg-slate-50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingInquiry ? (
                      <span>Submitting details...</span>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Free Site Visit Inquiry</span>
                      </>
                    )}
                  </button>

                  <div className="text-[11px] text-[#94A3B8] text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Your privacy is protected. No spam calls.</span>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
