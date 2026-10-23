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
  Phone, 
  Mail, 
  Award,
  AlertCircle,
  Clock,
  ArrowLeft,
  Check,
  UserCheck,
  MessageSquare,
  Bed,
  Bath,
  Maximize2,
  Filter,
  CheckCircle
} from 'lucide-react';
import { getAgentProperties } from '@/lib/homeSectionsData';
import type { PreferredAgentItem } from '@/lib/homeSectionsData';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import type { Property } from '@/lib/types';

export default function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const agentId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const { properties } = useProperties();

  // Live agent + their listings from the API. No static fallback: null while
  // loading, and a "not found" state when the API has no such agent.
  const [agent, setAgent] = useState<PreferredAgentItem | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [liveAgentProperties, setLiveAgentProperties] = useState<Property[] | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success && d.agent) {
          setAgent(d.agent);
          if (Array.isArray(d.properties)) setLiveAgentProperties(d.properties);
        } else {
          setLoadFailed(true);
        }
      })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [agentId]);

  // Prefer the API's live-attributed listings; fall back to context-derived ones.
  const agentProperties = liveAgentProperties ?? (agent ? getAgentProperties(agent, properties) : []);

  // Filter tab for agent properties (all, buy, rent)
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'buy' | 'rent'>('all');
  
  // Inquiry / Callback form states
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryPhone, setInquiryPhone] = useState(user?.phone || '');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryMessage, setInquiryMessage] = useState(
    `Hello ${agent?.name || 'Agent'}, I found your profile on BayBayt Realty. I am looking for properties in ${agent?.city || 'Lucknow'} and would like your professional consultation.`
  );
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        {loadFailed ? (
          <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center max-w-md space-y-4 shadow-lg">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-[#0F2A43]">Agent Profile Not Found</h2>
            <p className="text-sm text-[#64748B]">
              The requested real estate consultant profile is not available.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
            <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
            <span>Loading agent profile...</span>
          </div>
        )}
      </div>
    );
  }

  const filteredProperties = agentProperties.filter((p) => {
    if (propertyFilter === 'all') return true;
    if (propertyFilter === 'buy') return p.listingType === 'buy';
    if (propertyFilter === 'rent') return p.listingType === 'rent';
    return true;
  });

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
            <span className="hover:text-[#18A67D]">Preferred Agents</span>
            <span>/</span>
            <span className="text-[#0F2A43] font-bold truncate max-w-[200px]">{agent.name}</span>
          </div>

          <button
            onClick={handleShare}
            className="p-2 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-[#64748B] hover:text-[#0F2A43] transition-colors relative cursor-pointer"
            title="Share Agent Profile"
          >
            {isCopied ? <Check className="w-4 h-4 text-[#18A67D]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Agent Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              {/* Agent Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#18A67D]/30 shrink-0 shadow-md">
                <Image
                  src={agent.avatar}
                  alt={agent.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-0 inset-x-0 bg-[#0F2A43]/80 py-0.5 text-center text-[10px] font-bold text-white tracking-wide">
                  VERIFIED
                </div>
              </div>

              {/* Agent Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-[#18A67D] font-bold text-xs rounded-md border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {agent.badge || 'BayBayt Preferred'}
                  </span>
                  {agent.reraId && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-md border border-blue-100">
                      RERA: {agent.reraId}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2A43] tracking-tight">
                  {agent.name}
                </h1>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-[#64748B]">
                  <div className="flex items-center text-slate-800 font-semibold">
                    <Building2 className="w-4 h-4 text-[#18A67D] mr-1.5 shrink-0" />
                    {agent.agencyName}
                  </div>
                  <div className="flex items-center text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                    {agent.city}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
              <a
                href={`tel:${agent.phone || '+919415078901'}`}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call {agent.phone || '+91 94150 78901'}</span>
              </a>
              <a
                href="#contact-form"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0F2A43] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-[#18A67D]" />
                <span>Send WhatsApp / Message</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#F1F5F9] text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs text-[#64748B] font-medium">Operating Since</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#0F2A43] mt-0.5">
                {agent.operatingSince
                  ? `${agent.operatingSince} (${new Date().getFullYear() - agent.operatingSince} Yrs)`
                  : '—'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs text-[#64748B] font-medium">Buyers & Tenants Served</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#18A67D] mt-0.5">
                {agent.buyersServed || '500+'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs text-[#64748B] font-medium">Properties for Sale</div>
              <div className="text-lg sm:text-xl font-extrabold text-[#0F2A43] mt-0.5">
                {agent.propertiesForSaleCount ?? 0} Listings
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-xs text-[#64748B] font-medium">Verified Status</div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle className="w-5 h-5" />
                100% Legit
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout (Left: Properties & Details, Right: Form & Credibility) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-6">

            {/* About the Agent */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#18A67D]" />
                About {agent.name}
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                {agent.about || `${agent.name} is a certified real estate advisor operating under ${agent.agencyName} in ${agent.city}. Providing end-to-end guidance for residential homes, luxury villas, builder floors, and high-yield investment properties.`}
              </p>

              {/* Specializations & Areas Served */}
              <div className="space-y-3 pt-2">
                {agent.specializations && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.specializations.map((spec, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 text-[#0F2A43] text-xs font-semibold rounded-lg border border-slate-200">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {agent.areasServed && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Primary Localities Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {agent.areasServed.map((loc, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-100 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Properties by this Agent */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0F2A43] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#18A67D]" />
                    Properties Listed by {agent.name}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Verified properties managed and available through this agent desk.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
                  <button
                    onClick={() => setPropertyFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      propertyFilter === 'all' ? 'bg-white text-[#0F2A43] shadow-xs' : 'text-slate-600 hover:text-[#0F2A43]'
                    }`}
                  >
                    All ({agentProperties.length})
                  </button>
                  <button
                    onClick={() => setPropertyFilter('buy')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      propertyFilter === 'buy' ? 'bg-white text-[#0F2A43] shadow-xs' : 'text-slate-600 hover:text-[#0F2A43]'
                    }`}
                  >
                    For Sale
                  </button>
                  <button
                    onClick={() => setPropertyFilter('rent')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      propertyFilter === 'rent' ? 'bg-white text-[#0F2A43] shadow-xs' : 'text-slate-600 hover:text-[#0F2A43]'
                    }`}
                  >
                    For Rent
                  </button>
                </div>
              </div>

              {/* Property Cards Grid */}
              {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProperties.map((prop) => (
                    <div
                      key={prop.id}
                      onClick={() => router.push(`/properties/${prop.id}`)}
                      className="group bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:border-[#18A67D] hover:shadow-md transition-all cursor-pointer flex flex-col"
                    >
                      {/* Property Image */}
                      <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                        <Image
                          src={prop.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
                          alt={prop.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded">
                            {prop.listingType === 'buy' ? 'FOR SALE' : 'FOR RENT'}
                          </span>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5">
                          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-xs text-[#0F2A43] text-xs font-extrabold rounded-md shadow-xs">
                            {prop.priceFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Property Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-[#0F2A43] line-clamp-1 group-hover:text-[#18A67D] transition-colors">
                            {prop.title}
                          </h3>
                          <div className="flex items-center text-xs text-[#64748B] line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                            {prop.locality}, {prop.city}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                          {prop.bhk && (
                            <div className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5 text-slate-400" />
                              <span>{prop.bhk} BHK</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.bathrooms} Baths</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{prop.carpetAreaSqFt} sq.ft</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No properties currently match this filter.
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Contact Form & Verification Details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Contact / Consultation Form */}
            <div id="contact-form" className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-4 sticky top-20">
              <div className="border-b border-[#F1F5F9] pb-3">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  BayBayt Verified Direct Desk
                </span>
                <h3 className="text-base font-bold text-[#0F2A43] mt-1.5">
                  Contact {agent.name}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Schedule property visits, discuss property pricing, or list your property with this preferred agent.
                </p>
              </div>

              {isInquirySubmitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#18A67D] mx-auto" />
                  <div className="text-sm font-bold text-emerald-900">Message Sent to Agent!</div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Thank you, {inquiryName}. <strong>{agent.name}</strong> has received your inquiry and will call you at <strong>{inquiryPhone}</strong> shortly.
                  </p>
                  <button
                    onClick={() => setIsInquirySubmitted(false)}
                    className="text-xs text-emerald-700 font-bold underline cursor-pointer"
                  >
                    Send another message
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
                      placeholder="e.g. Priya Sharma"
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
                      placeholder="e.g. priya@example.com"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#18A67D] bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Request</label>
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
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Free Consultation Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Office address & verified docs */}
              {agent.address && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-800 block">Registered Office:</span>
                  <p className="text-slate-500">{agent.address}</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
