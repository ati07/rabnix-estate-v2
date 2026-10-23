'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Calendar, 
  Layers, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Download, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Send, 
  FileText, 
  Heart,
  Home,
  Tag
} from 'lucide-react';
import { Builder, BuilderProject } from '@/lib/buildersData';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import { SpaceAvailable } from '@/components/SpaceAvailable';

export default function BuilderDetailsClient({ id, initialBuilder }: { id: string; initialBuilder: Builder | null }) {
  const builderId = id;
  const router = useRouter();

  // Seeded from the server (initialBuilder) so the first paint and the crawler
  // HTML already carry the profile; the API refresh below keeps it live.
  const [builder, setBuilder] = useState<Builder | null>(initialBuilder);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/builders/${builderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success && d.builder) setBuilder(d.builder);
        else setLoadFailed(true);
      })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [builderId]);

  const { properties, isShortlisted, toggleShortlist } = useProperties();
  const { user } = useAuth();

  // Project status tab filter
  const [activeProjectStatus, setActiveProjectStatus] = useState<string>('All');
  
  // Selected project for Site Visit / Brochure modal
  const [selectedProjectForVisit, setSelectedProjectForVisit] = useState<BuilderProject | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitName, setVisitName] = useState(user?.name || '');
  const [visitPhone, setVisitPhone] = useState(user?.phone || '');
  const [visitNotes, setVisitNotes] = useState('');
  const [isVisitBooked, setIsVisitBooked] = useState(false);

  // Brochure download simulation
  const [downloadingProjectId, setDownloadingProjectId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  // Filter projects by status
  const filteredProjects = useMemo(() => {
    if (!builder) return [];
    if (activeProjectStatus === 'All') return builder.projects;
    return builder.projects.filter((p) => p.status === activeProjectStatus);
  }, [builder, activeProjectStatus]);

  // Find active property listings on the platform belonging to this builder
  const linkedProperties = useMemo(() => {
    if (!builder) return [];
    const builderNameLower = builder.name.toLowerCase();
    return properties.filter((p) => {
      const matchCompany = p.postedBy.companyName?.toLowerCase().includes(builderNameLower);
      const matchTitle = p.title.toLowerCase().includes(builderNameLower);
      const matchDesc = p.description.toLowerCase().includes(builderNameLower);
      const matchPostedName = p.postedBy.name.toLowerCase().includes(builderNameLower);
      return matchCompany || matchTitle || matchDesc || matchPostedName;
    });
  }, [properties, builder]);

  const handleBookVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitPhone.trim()) return;
    setIsVisitBooked(true);
    setTimeout(() => {
      setIsVisitBooked(false);
      setSelectedProjectForVisit(null);
    }, 4000);
  };

  const handleDownloadBrochure = (projectId: string) => {
    setDownloadingProjectId(projectId);
    setTimeout(() => {
      setDownloadingProjectId(null);
      setDownloadSuccessId(projectId);
      setTimeout(() => setDownloadSuccessId(null), 3000);
    }, 1500);
  };

  // Loading / not-found states — no static fallback.
  if (!builder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <BrandLogo variant="onLight" className="h-8 w-auto" />
            </Link>
            <Link href="/builders" className="text-xs font-bold text-[#18A67D] hover:text-[#0E7C5D] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> All Builders
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-16">
          {loadFailed ? (
            <SpaceAvailable
              title="Builder not found"
              message="This builder profile isn't available. Browse all verified builders instead."
            />
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#0F2A43] py-16">
              <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
              <span>Loading builder profile...</span>
            </div>
          )}
        </main>
      </div>
    );
  }

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
              href="/builders"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              All Builders
            </Link>
            <Link
              href="/collections"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Collections
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

      {/* Builder Showcase Hero Banner */}
      <div className="relative bg-[#0F2A43] text-white py-12 px-4 sm:px-8 overflow-hidden">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0 z-0">
          <Image
            src={builder.bannerImage}
            alt={builder.name}
            fill
            referrerPolicy="no-referrer"
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2A43] via-[#0F2A43]/95 to-[#0F2A43]/80" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/builders" className="hover:text-white transition-colors">Builders</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#22C39A] font-bold">{builder.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Builder Logo */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/40 bg-white shadow-xl shrink-0">
                <Image
                  src={builder.logo}
                  alt={builder.name}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-[#18A67D] text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{builder.badge}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {builder.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                  {builder.tagline}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-300 pt-1 flex-wrap font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#22C39A]" />
                    <span>HQ: {builder.headquarters}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#22C39A]" />
                    <span>RERA ID: {builder.reraRegistrationNumber}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Contact Sales Desk Box */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3 shrink-0 lg:w-80 text-xs">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-[11px]">
                <Phone className="w-3.5 h-3.5 text-[#22C39A]" />
                <span>Authorized Sales Desk</span>
              </div>
              <div className="space-y-1 text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Direct Phone:</span>
                  <a href={`tel:${builder.contactPhone}`} className="font-bold text-white hover:text-[#22C39A]">
                    {builder.contactPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Inquiry Desk:</span>
                  <span className="font-semibold text-white truncate max-w-[150px]">{builder.contactEmail}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProjectForVisit(builder.projects[0] || null)}
                className="w-full py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Free Site Visit</span>
              </button>
            </div>

          </div>

          {/* Builder Key Statistics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Experience</span>
              <span className="text-base sm:text-lg font-black text-white">{builder.experienceYears} Years</span>
              <span className="text-[10px] text-slate-400 block">Est. {builder.establishedYear}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivered Projects</span>
              <span className="text-base sm:text-lg font-black text-[#22C39A]">{builder.projectsDeliveredCount}+ Projects</span>
              <span className="text-[10px] text-slate-400 block">{builder.totalSqFtDelivered}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Ongoing Projects</span>
              <span className="text-base sm:text-lg font-black text-white">{builder.ongoingProjectsCount} Active Sites</span>
              <span className="text-[10px] text-slate-400 block">Under Construction</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Presence</span>
              <span className="text-base sm:text-lg font-black text-amber-400">{builder.citiesPresent.length} Cities</span>
              <span className="text-[10px] text-slate-400 block">{builder.citiesPresent.slice(0, 3).join(', ')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-1 space-y-10">
        
        {/* ========================================================= */}
        {/* BUILDER PROJECTS CATALOG & SHOWCASE                       */}
        {/* ========================================================= */}
        <section className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F2A43] tracking-tight">
                Flagship Projects & Master Townships by {builder.name}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Explore project brochures, RERA registration numbers, unit floor plans, and pricing quotes
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-2xs text-xs font-bold">
              {['All', 'Ready to Move', 'Under Construction', 'New Launch'].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveProjectStatus(status)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeProjectStatus === status
                      ? 'bg-[#0F2A43] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F2A43] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Cards List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const isDownloading = downloadingProjectId === project.id;
              const isDownloaded = downloadSuccessId === project.id;

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Project Cover & Image Carousel */}
                    <div className="relative h-60 w-full overflow-hidden bg-slate-100 group">
                      <Image
                        src={project.coverImage}
                        alt={project.name}
                        fill
                        referrerPolicy="no-referrer"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded shadow-xs ${
                          project.status === 'Ready to Move'
                            ? 'bg-[#18A67D] text-white'
                            : project.status === 'Under Construction'
                            ? 'bg-blue-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}>
                          {project.status}
                        </span>

                        <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#22C39A]" />
                          <span>RERA Verified</span>
                        </span>
                      </div>

                      {/* Bottom Banner Details */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="text-lg font-extrabold leading-tight drop-shadow-sm">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-200 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#22C39A] shrink-0" />
                          <span>{project.locality}, {project.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="p-5 space-y-4">
                      
                      {/* Price & Specs Header */}
                      <div className="flex items-baseline justify-between pb-3 border-b border-[#F1F5F9]">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Price Range</span>
                          <span className="text-lg font-black text-[#0E7C5D]">{project.priceRangeFormatted}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Possession</span>
                          <span className="text-xs font-bold text-[#0F2A43]">{project.completionDate}</span>
                        </div>
                      </div>

                      {/* Key Project Specs */}
                      <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-center text-xs">
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold block">Configurations</span>
                          <span className="font-bold text-[#0F2A43] text-[11px] truncate block">{project.bhkOptions.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold block">Carpet Area</span>
                          <span className="font-bold text-[#0F2A43] text-[11px] truncate block">{project.carpetAreaRange}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#94A3B8] font-bold block">Total Units</span>
                          <span className="font-bold text-[#0E7C5D] text-[11px] truncate block">{project.totalUnits}</span>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0F2A43] block uppercase tracking-wider">Project Highlights:</span>
                        <div className="space-y-1">
                          {project.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-[#475569]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#18A67D] shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RERA Number */}
                      <div className="p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#0F2A43]">
                          <ShieldCheck className="w-4 h-4 text-[#18A67D]" />
                          <span className="font-bold text-[11px]">RERA Registration:</span>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {project.reraId}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Project Actions Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadBrochure(project.id)}
                      disabled={isDownloading}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isDownloaded
                          ? 'bg-[#E7F6F1] border-[#18A67D] text-[#0E7C5D]'
                          : 'bg-white border-[#CBD5E1] text-[#0F2A43] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#18A67D]" />
                          <span>Brochure Downloaded</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>Download Brochure</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedProjectForVisit(project)}
                      className="py-2.5 px-3 bg-[#0F2A43] hover:bg-[#18A67D] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#22C39A]" />
                      <span>Book Site Visit</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </section>

        {/* ========================================================= */}
        {/* LINKED PROPERTY LISTINGS ON PLATFORM                     */}
        {/* ========================================================= */}
        {linkedProperties.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A67D] uppercase">
                <Tag className="w-3.5 h-3.5" />
                <span>Live Units for Sale & Rent</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#0F2A43] tracking-tight mt-0.5">
                Active Listings in {builder.name} Communities ({linkedProperties.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedProperties.map((prop) => {
                const shortlisted = isShortlisted(prop.id);

                return (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        <Image
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                          alt={prop.title}
                          fill
                          referrerPolicy="no-referrer"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="bg-[#0F2A43]/90 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                            {prop.category}
                          </span>
                          <button
                            onClick={() => toggleShortlist(prop.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-xs ${
                              shortlisted ? 'bg-rose-500 text-white' : 'bg-black/40 text-white'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${shortlisted ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                          {prop.bhk ? `${prop.bhk} BHK • ` : ''}{prop.carpetAreaSqFt} sq.ft
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="text-lg font-black text-[#0E7C5D]">
                          {prop.priceFormatted}
                        </div>
                        <h4 className="text-xs font-bold text-[#0F2A43] truncate" title={prop.title}>
                          {prop.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                          <MapPin className="w-3 h-3 text-[#18A67D] shrink-0" />
                          <span className="truncate">{prop.locality}, {prop.city}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link
                        href={`/properties/${prop.id}`}
                        className="w-full py-2 bg-[#0F2A43] hover:bg-[#18A67D] text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                      >
                        <span>View Unit Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* ABOUT BUILDER, PHILOSOPHY & AWARDS                       */}
        {/* ========================================================= */}
        <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* About Narrative */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-lg font-black text-[#0F2A43] tracking-tight">
                About {builder.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                {builder.about}
              </p>

              {/* Specialties */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-[#0F2A43] block uppercase tracking-wider">
                  Core Architectural Strengths:
                </span>
                <div className="flex flex-wrap gap-2">
                  {builder.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/20 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-[#18A67D]" />
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Awards & Citations */}
            <div className="bg-[#F8FAFC] p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase">
                <Award className="w-4 h-4" />
                <span>Industry Accolades</span>
              </div>
              <div className="space-y-2 text-xs">
                {builder.awards.map((award, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#0F2A43] font-semibold flex items-start gap-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 fill-current" />
                    <span>{award}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ========================================================= */}
      {/* SITE VISIT BOOKING MODAL                                  */}
      {/* ========================================================= */}
      {selectedProjectForVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 border border-[#E2E8F0] animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E7F6F1] flex items-center justify-center text-[#18A67D]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0F2A43]">Schedule Free Site Visit</h3>
                  <p className="text-[11px] text-[#64748B]">{selectedProjectForVisit.name} ({selectedProjectForVisit.locality})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProjectForVisit(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[#64748B] hover:text-[#0F2A43]"
              >
                ✕
              </button>
            </div>

            {isVisitBooked ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#18A67D] mx-auto" />
                <h4 className="text-base font-bold text-[#0F2A43]">Site Visit Scheduled!</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  A representative from the authorized <strong>{builder.name}</strong> sales desk will contact you to coordinate free cab pickup & sample flat walkthrough.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookVisit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={visitName}
                    onChange={(e) => setVisitName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Mobile Number for SMS & WhatsApp Pass</label>
                  <input
                    type="tel"
                    required
                    value={visitPhone}
                    onChange={(e) => setVisitPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Preferred Visit Date</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Cab Pickup Request</label>
                    <select className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F2A43] outline-none cursor-pointer">
                      <option>Self Driving / Visiting directly</option>
                      <option>Request Free AC Cab Pickup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#0F2A43] mb-1">Specific Requirements / BHK Preference (Optional)</label>
                  <textarea
                    rows={2}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="e.g. Interested in 3 BHK higher floor with park facing view"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#0F2A43] outline-none focus:bg-white focus:border-[#18A67D]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Confirm Site Visit Pass</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. {builder.name} Official Showcase.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/builders" className="hover:text-[#18A67D]">All Builders</Link>
            <span className="text-slate-300">•</span>
            <Link href="/collections" className="hover:text-[#18A67D]">Curated Collections</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">All Properties</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
