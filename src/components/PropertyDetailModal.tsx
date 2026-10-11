'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  X, 
  MapPin, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Award, 
  Building, 
  Compass, 
  Calendar, 
  CheckCircle2, 
  Phone, 
  MessageSquare,
  Sparkles,
  ChevronRight, 
  Layers, 
  Check, 
  Info,
  TrendingUp,
  FileText,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Property, AiValuationResult } from '@/lib/types';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';

interface PropertyDetailModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  isShortlisted: boolean;
  onToggleShortlist: (id: string) => void;
  onOpenAiGenieWithContext: (property: Property) => void;
}

export function PropertyDetailModal({
  property,
  isOpen,
  onClose,
  isShortlisted,
  onToggleShortlist,
  onOpenAiGenieWithContext,
}: PropertyDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'landmarks' | 'ai_insights'>('overview');
  
  // Lead form state
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // AI Property Analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiValuationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isWhatsAppInitiated, setIsWhatsAppInitiated] = useState(false);

  if (!isOpen) return null;

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'];

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerPhone) return;
    setLeadSubmitted(true);
  };

  const handleGenerateAiInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'valuation',
          payload: {
            city: property.city,
            locality: property.locality,
            category: property.category,
            areaSqFt: property.carpetAreaSqFt,
            bhk: property.bhk || 2,
            furnishing: property.furnishing,
            age: property.ageOfProperty || '1 year'
          }
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiAnalysis(data.data);
      } else {
        setAiError(data.error || 'Unable to retrieve AI analysis.');
      }
    } catch (err: any) {
      setAiError('Network error while generating AI valuation.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-neutral-200">
        
        {/* Modal Top Header Bar */}
        <div className="bg-[#0F2A43] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#163b5c] shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#18A67D] text-white text-xs font-black px-2 py-0.5 rounded-xs">
              BayBayt
            </div>
            <span className="text-xs text-slate-300">Property ID: {property.id}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/properties/${property.id}`}
              className="text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Open full dedicated property page"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              id="detail-modal-shortlist-btn"
              onClick={() => onToggleShortlist(property.id)}
              className={`p-1.5 rounded-full transition-colors ${
                isShortlisted ? 'bg-[#E7F6F1] text-[#18A67D]' : 'hover:bg-white/10 text-slate-300'
              }`}
              title={isShortlisted ? 'Saved' : 'Shortlist'}
            >
              <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current text-[#18A67D]' : ''}`} />
            </button>

            <button
              id="detail-modal-close-btn"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Main Title & Price Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#E7F6F1] text-[#0E7C5D] font-bold text-xs px-2.5 py-0.5 rounded-full">
                  For {property.listingType.toUpperCase()}
                </span>
                <span className="bg-[#F8FAFC] text-[#172033] font-semibold text-xs px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                  {property.category}
                </span>
                {property.reraApproved && (
                  <span className="bg-[#E7F6F1] text-[#0E7C5D] font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#18A67D]" />
                    <span>RERA: {property.reraId || 'Verified'}</span>
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#0F2A43] leading-snug">
                {property.title}
              </h1>

              <div className="flex items-center gap-1 text-sm text-[#64748B]">
                <MapPin className="w-4 h-4 text-[#18A67D] shrink-0" />
                <span className="font-semibold text-[#172033]">{property.locality}</span>
                <span>, {property.city}</span>
                {property.subLocality && (
                  <span className="text-[#64748B]">({property.subLocality})</span>
                )}
              </div>
            </div>

            <div className="md:text-right bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] shrink-0">
              <div className="text-2xl sm:text-3xl font-black text-[#0F2A43] tracking-tight">
                {property.priceFormatted}
              </div>
              {property.pricePerSqFt && (
                <div className="text-xs text-[#64748B] font-semibold">
                  ₹{formatIndianNumber(property.pricePerSqFt)} per sq.ft
                </div>
              )}
              {property.maintenance ? (
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  + ₹{formatIndianNumber(property.maintenance)}/mo maintenance
                </div>
              ) : null}
            </div>
          </div>

          {/* Photo Gallery & Thumbnail Strip */}
          <div className="space-y-3">
            <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-[#0F2A43]">
              <Image
                src={images[selectedImageIndex]}
                alt={property.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
                priority
                referrerPolicy="no-referrer"
              />

              <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                <Layers className="w-3.5 h-3.5" />
                <span>Photo {selectedImageIndex + 1} of {images.length}</span>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#18A67D] scale-102 shadow-xs'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Navigation in Modal */}
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#18A67D] text-[#0E7C5D]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Property Overview
            </button>

            <button
              onClick={() => setActiveTab('amenities')}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'amenities'
                  ? 'border-[#18A67D] text-[#0E7C5D]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Amenities ({property.amenities.length})
            </button>

            <button
              onClick={() => setActiveTab('landmarks')}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'landmarks'
                  ? 'border-[#18A67D] text-[#0E7C5D]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Neighborhood & Landmarks
            </button>

            <button
              onClick={() => {
                setActiveTab('ai_insights');
                if (!aiAnalysis && !aiLoading) handleGenerateAiInsights();
              }}
              className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ai_insights'
                  ? 'border-[#18A67D] text-[#0E7C5D]'
                  : 'border-transparent text-[#64748B] hover:text-[#18A67D]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>MB AI Valuation & Insights</span>
            </button>
          </div>

          {/* Grid Layout: Main Details + Sidebar Lead Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Tab Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Detailed Specs Grid */}
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <h3 className="text-sm font-bold text-[#0F2A43] uppercase tracking-wider mb-3">
                      Property Specifications
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
                      <div>
                        <span className="text-[#64748B] block font-medium">Carpet Area</span>
                        <span className="text-[#172033] font-bold text-sm">{property.carpetAreaSqFt} sq.ft</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Super Built-up Area</span>
                        <span className="text-[#172033] font-bold text-sm">
                          {property.superBuiltUpAreaSqFt || Math.round(property.carpetAreaSqFt * 1.3)} sq.ft
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Configuration</span>
                        <span className="text-[#172033] font-bold text-sm">
                          {property.bhk ? `${property.bhk} BHK` : 'Studio/Open'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Bathrooms</span>
                        <span className="text-[#172033] font-bold text-sm">{property.bathrooms} Baths</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Balconies</span>
                        <span className="text-[#172033] font-bold text-sm">{property.balconies || 2} Balconies</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Floor Level</span>
                        <span className="text-[#172033] font-bold text-sm">
                          {property.floor ? `${property.floor} of ${property.totalFloors || 20}` : 'Ground'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Facing</span>
                        <span className="text-[#172033] font-bold text-sm">{property.facing || 'East'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Furnishing</span>
                        <span className="text-[#172033] font-bold text-sm">{property.furnishing}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Possession Status</span>
                        <span className="text-[#172033] font-bold text-sm">{property.constructionStatus}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Age of Property</span>
                        <span className="text-[#172033] font-bold text-sm">{property.ageOfProperty || 'Under 3 years'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">Water Supply</span>
                        <span className="text-[#172033] font-bold text-sm">24x7 Corporation + Borewell</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] block font-medium">RERA Registration</span>
                        <span className="text-[#172033] font-bold text-sm truncate">{property.reraId || 'Approved'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[#0F2A43] uppercase tracking-wider">
                      About this Property
                    </h3>
                    <p className="text-[#172033] text-sm leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>

                </div>
              )}

              {/* TAB 2: AMENITIES */}
              {activeTab === 'amenities' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#0F2A43] uppercase tracking-wider">
                    Exclusive Society Amenities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {property.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#172033]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#18A67D] shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: NEIGHBORHOOD */}
              {activeTab === 'landmarks' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#0F2A43] uppercase tracking-wider">
                    Nearby Landmarks & Travel Times
                  </h3>
                  {property.nearbyLandmarks && property.nearbyLandmarks.length > 0 ? (
                    <div className="space-y-2">
                      {property.nearbyLandmarks.map((lm, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#18A67D]" />
                            <span className="font-semibold text-[#172033]">{lm.name}</span>
                            <span className="text-xs text-[#64748B] uppercase bg-[#E2E8F0] px-1.5 py-0.5 rounded">
                              {lm.type}
                            </span>
                          </div>
                          <span className="font-bold text-[#172033] text-xs bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                            {lm.distance}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#64748B]">
                      Located in prime {property.locality}, {property.city} with convenient access to schools, markets, and public transit.
                    </div>
                  )}

                  {/* Ask Genie about this location */}
                  <div className="bg-[#0F2A43] text-white p-4 rounded-xl flex items-center justify-between border border-[#163b5c]">
                    <div>
                      <div className="text-sm font-bold flex items-center gap-1.5 text-[#22C39A]">
                        <Sparkles className="w-4 h-4" />
                        <span>Curious about traffic, schools, or upcoming infrastructure?</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Ask BayBayt Genie for an in-depth neighborhood breakdown.
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenAiGenieWithContext(property)}
                      className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 cursor-pointer"
                    >
                      Ask AI Advisor
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: AI VALUATION & INSIGHTS */}
              {activeTab === 'ai_insights' && (
                <div className="space-y-4">
                  {aiLoading ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="inline-block w-8 h-8 border-3 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
                      <div className="text-sm font-bold text-[#0F2A43]">
                        BayBayt AI Valuation Engine is crunching market metrics...
                      </div>
                      <div className="text-xs text-[#64748B]">
                        Analyzing price per sq.ft trends, rental yield data, and capital appreciation for {property.locality}.
                      </div>
                    </div>
                  ) : aiError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {aiError}
                      <button
                        onClick={handleGenerateAiInsights}
                        className="block mt-2 font-bold text-xs underline"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-4 animate-fade-in text-sm">
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-[#E7F6F1] p-3 rounded-xl border border-[#18A67D]/30">
                          <span className="text-[11px] font-bold text-[#0E7C5D] uppercase block">
                            Fair Market Valuation
                          </span>
                          <span className="text-lg font-black text-[#0F2A43]">
                            {formatIndianCurrency(aiAnalysis.fairValueEstimate)}
                          </span>
                          <span className="text-[10px] text-[#64748B] block">
                            Range: {formatIndianCurrency(aiAnalysis.estimatedPriceMin)} - {formatIndianCurrency(aiAnalysis.estimatedPriceMax)}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-[#CBD5E1]">
                          <span className="text-[11px] font-bold text-[#0E7C5D] uppercase block">
                            Expected Rental Yield
                          </span>
                          <span className="text-lg font-black text-[#0E7C5D]">
                            {aiAnalysis.rentalYield}% p.a.
                          </span>
                          <span className="text-[10px] text-[#64748B] block">
                            ₹{formatIndianNumber(aiAnalysis.estimatedRentalMin)} - ₹{formatIndianNumber(aiAnalysis.estimatedRentalMax)}/mo
                          </span>
                        </div>

                        <div className="bg-[#0F2A43] text-white p-3 rounded-xl border border-[#163b5c] col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-bold text-[#22C39A] uppercase block">
                            5-Yr Appreciation Forecast
                          </span>
                          <span className="text-lg font-black text-white">
                            +{aiAnalysis.fiveYearAppreciationForecast}%
                          </span>
                          <span className="text-[10px] text-slate-300 block">
                            Grade: {aiAnalysis.localityGrade}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-[#172033]">
                        <span className="font-bold text-[#0F2A43] block mb-1 text-xs uppercase tracking-wider">
                          Valuer Summary
                        </span>
                        <p className="text-xs leading-relaxed">{aiAnalysis.summary}</p>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#E7F6F1]/50 p-3 rounded-xl border border-[#18A67D]/20">
                          <span className="font-bold text-[#0E7C5D] text-xs block mb-2">
                            Key Investment Advantages
                          </span>
                          <ul className="space-y-1.5 text-xs text-[#172033]">
                            {aiAnalysis.marketPros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#0E7C5D] shrink-0 mt-0.5" />
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/80">
                          <span className="font-bold text-amber-800 text-xs block mb-2">
                            Market Considerations
                          </span>
                          <ul className="space-y-1.5 text-xs text-[#172033]">
                            {aiAnalysis.marketCons.map((con, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateAiInsights}
                      className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Run AI Property Valuation & Rental Yield Analysis</span>
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Right Column: Contact Owner / Agent Lead Box */}
            <div className="space-y-4">
              <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4 sticky top-4">
                
                {/* Agent / Owner Profile */}
                <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
                  <div className="w-12 h-12 rounded-full bg-[#E2E8F0] overflow-hidden relative shrink-0 border border-[#CBD5E1]">
                    {property.postedBy.avatar ? (
                      <Image
                        src={property.postedBy.avatar}
                        alt={property.postedBy.name}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[#172033]">
                        {property.postedBy.name[0]}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      Posted By {property.postedBy.type}
                    </div>
                    <div className="text-sm font-bold text-[#172033]">
                      {property.postedBy.name}
                    </div>
                    {property.postedBy.companyName && (
                      <div className="text-xs text-[#64748B]">
                        {property.postedBy.companyName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Form */}
                {leadSubmitted ? (
                  <div className="bg-[#E7F6F1] border border-[#18A67D]/30 text-[#0E7C5D] p-4 rounded-xl text-center space-y-2 animate-fade-in">
                    <CheckCircle2 className="w-8 h-8 text-[#0E7C5D] mx-auto" />
                    <div className="font-bold text-sm text-[#0F2A43]">Enquiry Sent Successfully!</div>
                    <div className="text-xs text-[#64748B]">
                      {property.postedBy.name} has been notified and will contact you via WhatsApp / Call at {buyerPhone}.
                    </div>
                    <button
                      onClick={() => setLeadSubmitted(false)}
                      className="text-xs text-[#0E7C5D] font-bold underline mt-2"
                    >
                      Send Another Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-3">
                    <div className="text-xs font-bold text-[#172033]">
                      Contact {property.postedBy.type} directly:
                    </div>

                    <div>
                      <input
                        id="lead-input-name"
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Your Full Name"
                        className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 outline-none focus:border-[#18A67D]"
                      />
                    </div>

                    <div>
                      <input
                        id="lead-input-phone"
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Phone / Mobile (+91)"
                        className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 outline-none focus:border-[#18A67D]"
                      />
                    </div>

                    <div>
                      <input
                        id="lead-input-email"
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="Email Address (Optional)"
                        className="w-full text-xs font-medium bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 outline-none focus:border-[#18A67D]"
                      />
                    </div>

                    <div className="text-[10px] text-[#64748B]">
                      By submitting you agree to BayBayt Terms & Privacy Policy.
                    </div>

                    <button
                      id="lead-submit-btn"
                      type="submit"
                      className="w-full bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Get Contact Details & Site Visit</span>
                    </button>
                  </form>
                )}

                {/* Instant WhatsApp connection */}
                {isWhatsAppInitiated ? (
                  <div className="bg-[#E7F6F1] border border-[#22C39A] rounded-lg p-2.5 text-center text-xs text-[#0E7C5D] font-medium space-y-1">
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#18A67D]" />
                      <span>WhatsApp Link Ready</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Connected to {property.postedBy.name} ({property.postedBy.phone}).
                    </p>
                  </div>
                ) : (
                  <button
                    id="direct-whatsapp-btn"
                    onClick={() => {
                      setIsWhatsAppInitiated(true);
                    }}
                    className="w-full bg-[#0E7C5D] hover:bg-[#095741] text-white font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </button>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
