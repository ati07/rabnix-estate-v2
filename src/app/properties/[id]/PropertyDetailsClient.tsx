'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Property } from '@/lib/types';
import { BrandLogo } from '@/components/BrandLogo';
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
  MessageSquare, 
  Calendar, 
  Compass, 
  Layers, 
  Sparkles, 
  ArrowLeft, 
  Check,
  Info,
  Award,
  AlertCircle,
  FileText,
  Clock,
  Car,
  Home,
  UserCheck,
  Images,
  Video
} from 'lucide-react';
import { useProperties } from '@/lib/propertyContext';
import { useAuth } from '@/lib/authContext';
import { useGenie } from '@/lib/genieContext';
import { OtpVerifyModal } from '@/components/OtpVerifyModal';
import PropertyLocationMap from '@/components/map/PropertyLocationMap';
import NearbyProperties from '@/components/map/NearbyProperties';
import dynamic from 'next/dynamic';
import VideoPlayer from '@/components/media/VideoPlayer';

// 360° viewer is WebGL-only — load it client-side, never on the server.
const PanoramaViewer = dynamic(() => import('@/components/media/PanoramaViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-2/1 rounded-2xl bg-[#0F2A43] flex items-center justify-center text-white text-sm font-bold">
      Loading 360° view…
    </div>
  ),
});

export default function PropertyDetailsClient({ id, initialProperty }: { id: string; initialProperty: Property | null }) {
  const propertyId = id;
  const router = useRouter();

  const { properties, isLoading, getPropertyById, isShortlisted, toggleShortlist, addInquiry } = useProperties();
  const { user } = useAuth();
  const { openGenie } = useGenie();

  // Prefer the live client-context record (reflects shortlist/edits as they
  // load); fall back to the server-rendered `initialProperty` so the first
  // paint — and the crawler's SSR HTML — already carry real listing content.
  const property = getPropertyById(propertyId) ?? initialProperty ?? undefined;

  // Active image gallery index
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // Which media surface is showing: standard photos, 360° panoramas, or video.
  const [mediaMode, setMediaMode] = useState<'photos' | '360' | 'video'>('photos');
  const hasPanorama = (property?.panoramaImages?.length ?? 0) > 0;
  const hasVideo = !!property?.videoUrl;

  // Inquiry form states — start blank so the customer enters their own details.
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [preferredVisitTime, setPreferredVisitTime] = useState('This Weekend (11:00 AM - 1:00 PM)');
  const [isInquirySubmitted, setIsInquirySubmitted] = useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  // Seller phone is withheld from the public payload; it's fetched here from the
  // gated reveal endpoint only after the customer submits an inquiry.
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  // Before the seller's contact is revealed, the customer must verify their own
  // mobile via OTP. Once verified (cookie set for ~30 min) we skip the popup.
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [isCopied, setIsCopied] = useState(false);

  // Record a real view once per browser session for this listing (avoids
  // inflating the count on refresh or React strict-mode double mounts). Sends a
  // stable anonymous visitorKey so unique-visitor analytics are real.
  useEffect(() => {
    if (!property || property.id !== propertyId) return;
    if (typeof window === 'undefined') return;
    const seenKey = `baybayt_viewed_${propertyId}`;
    if (sessionStorage.getItem(seenKey)) return;
    sessionStorage.setItem(seenKey, '1');

    let visitorKey = localStorage.getItem('baybayt_visitor_key');
    if (!visitorKey) {
      visitorKey = (crypto.randomUUID?.() ?? `v_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem('baybayt_visitor_key', visitorKey);
    }

    fetch(`/api/properties/${propertyId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorKey }),
      keepalive: true,
    }).catch(() => {});
  }, [property?.id, propertyId]);

  // Listings load client-side, so on a fresh refresh `properties` is briefly
  // empty. Show a loader until the fetch resolves — otherwise the "Not Found"
  // screen flashes before the data arrives.
  if (!property && isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-[3px] border-[#18A67D]/25 border-t-[#18A67D] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#64748B]">Loading property details…</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center max-w-md space-y-4 shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-[#0F2A43]">Property Not Found</h2>
          <p className="text-sm text-[#64748B]">
            The listing you are looking for may have been sold, archived, or is currently pending verification.
          </p>
          <Link
            href="/properties"
            className="inline-block px-6 py-2.5 bg-[#18A67D] hover:bg-[#0E7C5D] text-white text-xs font-bold rounded-xl"
          >
            Browse All Active Properties
          </Link>
        </div>
      </div>
    );
  }

  const isFavorite = isShortlisted(property.id);

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryPhone.trim() || !inquiryName.trim()) return;

    // Customer must verify their own number first (unless already verified this
    // session). The OTP popup drives the verification; completeInquiry runs after.
    if (!isPhoneVerified) {
      setShowOtpModal(true);
      return;
    }
    completeInquiry();
  };

  // Records the lead and reveals the seller's contact via the gated endpoint —
  // the number is never shipped in the public listing payload. Runs only once
  // the customer's mobile is verified.
  const completeInquiry = () => {
    if (!property) return;
    setIsSubmittingInquiry(true);
    addInquiry({
      propertyId: property.id,
      propertyTitle: property.title,
      buyerName: inquiryName,
      buyerPhone: inquiryPhone,
      buyerEmail: inquiryEmail,
      message: inquiryMessage,
      preferredTime: preferredVisitTime,
      sellerUserId: property.postedByUserId,
      buyerUserId: user?.id
    });

    fetch(`/api/properties/${property.id}/contact`, {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.contact?.phone) setRevealedPhone(data.contact.phone);
      })
      .catch(() => { /* leave revealedPhone null; UI shows a fallback */ })
      .finally(() => {
        setIsSubmittingInquiry(false);
        setIsInquirySubmitted(true);
      });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Similar properties
  const similarProperties = properties
    .filter((p) => p.id !== property.id && (p.city === property.city || p.category === property.category))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">

      {/* Mobile verification before revealing the seller's contact */}
      <OtpVerifyModal
        isOpen={showOtpModal}
        phone={inquiryPhone}
        onClose={() => setShowOtpModal(false)}
        onVerified={() => {
          setIsPhoneVerified(true);
          setShowOtpModal(false);
          completeInquiry();
        }}
      />

      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-3.5 px-4 sm:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/properties" className="p-2 rounded-xl hover:bg-[#F1F5F9] text-[#0F2A43] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link href="/" className="flex items-center gap-2 group select-none">
              <BrandLogo variant="onLight" className="h-7 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => toggleShortlist(property.id)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-[#E2E8F0] text-[#0F2A43] hover:bg-[#F8FAFC]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Shortlisted' : 'Shortlist'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] bg-white text-[#0F2A43] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isCopied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <Link
              href="/post-property"
              className="hidden sm:flex items-center gap-1 text-xs font-bold px-3 py-2 bg-[#18A67D] hover:bg-[#0E7C5D] text-white rounded-xl transition-colors"
            >
              <span>+ Post Property</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-8 flex-1">
        
        {/* Verification Status Warning if not approved */}
        {property.verificationStatus && property.verificationStatus !== 'approved' && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            property.verificationStatus === 'pending'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : property.verificationStatus === 'under_review'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider block">
                  Verification Status: {property.verificationStatus.replace('_', ' ')}
                </span>
                <span>
                  {property.verificationStatus === 'rejected'
                    ? property.rejectionReason || 'Requires document corrections.'
                    : 'This listing is undergoing title deed and RERA clearance.'}
                </span>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-white rounded-lg border shadow-xs text-xs font-bold text-[#0F2A43] hover:bg-slate-50 shrink-0"
            >
              Open Admin Review &rarr;
            </Link>
          </div>
        )}

        {/* Title & Price Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F2A43] text-white uppercase tracking-wider">
                For {property.listingType.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2E8F0] text-[#0F2A43]">
                {property.category}
              </span>
              {property.isVerified && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E7F6F1] text-[#0E7C5D] flex items-center gap-1 border border-[#18A67D]/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#18A67D]" />
                  Verified RERA Listing
                </span>
              )}
              {property.postedBy.type === 'Owner' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Owner Direct
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F2A43] tracking-tight">
              {property.title}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B]">
              <MapPin className="w-4 h-4 text-[#18A67D] shrink-0" />
              <span>{property.locality}, {property.city}</span>
              {property.subLocality && <span>• {property.subLocality}</span>}
              {property.reraId && (
                <span className="font-mono text-[11px] bg-[#F1F5F9] px-2 py-0.5 rounded border">
                  RERA: {property.reraId}
                </span>
              )}
            </div>
          </div>

          <div className="text-left md:text-right space-y-1 bg-[#F8FAFC] p-4 rounded-2xl border md:border-none md:p-0">
            <div className="text-2xl sm:text-3xl font-black text-[#0E7C5D]">
              {property.priceFormatted}
            </div>
            {property.pricePerSqFt && (
              <div className="text-xs text-[#64748B] font-medium">
                ₹{property.pricePerSqFt.toLocaleString('en-IN')} / sq.ft
              </div>
            )}
          </div>
        </div>

        {/* Media Showcase */}
        <div className="space-y-3">
          {/* Mode toggles — only shown when richer media exists */}
          {(hasPanorama || hasVideo) && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMediaMode('photos')}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  mediaMode === 'photos' ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-white text-[#0F2A43] border-[#E2E8F0] hover:border-[#18A67D]'
                }`}
              >
                <Images className="w-4 h-4" /> Photos
              </button>
              {hasPanorama && (
                <button
                  type="button"
                  onClick={() => setMediaMode('360')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    mediaMode === '360' ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-white text-[#0F2A43] border-[#E2E8F0] hover:border-[#18A67D]'
                  }`}
                >
                  <Compass className="w-4 h-4" /> 360° View
                </button>
              )}
              {hasVideo && (
                <button
                  type="button"
                  onClick={() => setMediaMode('video')}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    mediaMode === 'video' ? 'bg-[#0F2A43] text-white border-[#0F2A43]' : 'bg-white text-[#0F2A43] border-[#E2E8F0] hover:border-[#18A67D]'
                  }`}
                >
                  <Video className="w-4 h-4" /> Video
                </button>
              )}
            </div>
          )}

          {mediaMode === '360' && hasPanorama ? (
            <PanoramaViewer images={property.panoramaImages ?? []} />
          ) : mediaMode === 'video' && hasVideo ? (
            <VideoPlayer url={property.videoUrl ?? ''} />
          ) : (
            <>
              <div className="rounded-2xl overflow-hidden shadow-md border border-[#E2E8F0] aspect-21/9 sm:aspect-2/1 lg:aspect-21/9 bg-[#0F2A43] relative">
                <Image
                  src={property.images[activeImageIndex] || property.images[0]}
                  alt={property.title}
                  fill
                  className="object-cover transition-all duration-300"
                  referrerPolicy="no-referrer"
                  priority
                />
                <div className="absolute bottom-4 right-4 bg-[#0F2A43]/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 z-10">
                  <span>Photo {activeImageIndex + 1} of {property.images.length}</span>
                </div>
              </div>

              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer relative ${
                        activeImageIndex === idx ? 'border-[#18A67D] scale-102 ring-2 ring-[#18A67D]/40' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {property.virtualTourUrl && (
            <a
              href={property.virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0E7C5D] bg-[#E7F6F1] border border-[#18A67D]/30 rounded-xl px-3 py-2 hover:bg-[#d7f0e8] transition-colors"
            >
              <Compass className="w-4 h-4" /> Open Virtual Tour
            </a>
          )}
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Details, Specs, Amenities, Landmarks */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Specs Highlight Box */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Configuration</span>
                <div className="text-base font-extrabold text-[#0F2A43]">
                  {property.bhk ? `${property.bhk} BHK` : property.category}
                </div>
                <span className="text-[11px] text-[#64748B]">{property.bathrooms} Baths • {property.balconies || 1} Balcony</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Carpet Area</span>
                <div className="text-base font-extrabold text-[#0F2A43]">
                  {property.carpetAreaSqFt} sq.ft
                </div>
                <span className="text-[11px] text-[#64748B]">Super: {property.superBuiltUpAreaSqFt || Math.round(property.carpetAreaSqFt * 1.2)} sq.ft</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Status & Age</span>
                <div className="text-base font-extrabold text-[#0F2A43]">
                  {property.constructionStatus}
                </div>
                <span className="text-[11px] text-[#64748B]">Possession: {property.possessionDate || 'Immediate'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Furnishing</span>
                <div className="text-base font-extrabold text-[#0F2A43]">
                  {property.furnishing}
                </div>
                <span className="text-[11px] text-[#64748B]">Floor: {property.floor || 4} of {property.totalFloors || 14}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-3 shadow-xs">
              <h2 className="text-lg font-bold text-[#0F2A43]">Property Overview & Highlights</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                {property.description}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-lg font-medium text-[#0F2A43]">
                  Facing: <strong>{property.facing || 'East'}</strong>
                </span>
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-lg font-medium text-[#0F2A43]">
                  Monthly Maintenance: <strong>₹{property.maintenance || 3500}/mo</strong>
                </span>
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-lg font-medium text-[#0F2A43]">
                  Total Views: <strong>{property.viewsCount ?? 0}</strong>
                </span>
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-lg font-medium text-[#0F2A43]">
                  Direct Inquiries: <strong>{property.inquiriesCount ?? 0}</strong>
                </span>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#0F2A43]">Society Amenities & Infrastructure</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F2A43]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#18A67D] shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Documents & RERA Status */}
            <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#18A67D]" />
                  <h2 className="text-lg font-bold text-[#0F2A43]">Verified Title & Legal Clearance</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E7F6F1] text-[#0E7C5D]">
                  Checked by BayBayt Legal
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {(property.documentsSubmitted || [
                  'Encumbrance Certificate (EC)',
                  'Approved Sanction Plan',
                  'Property Tax Clearance'
                ]).map((doc, i) => (
                  <div key={i} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-[#0E7C5D] font-bold">
                      <Check className="w-3.5 h-3.5 text-[#18A67D]" />
                      <span>Verified Document</span>
                    </div>
                    <div className="font-semibold text-[#0F2A43] truncate">{doc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Nearby (Google Maps) */}
            <PropertyLocationMap
              coordinates={property.coordinates}
              address={property.address}
              title={property.title}
              locality={property.locality}
              city={property.city}
            />

            {/* Nearby listings (server-side radius search) */}
            <NearbyProperties propertyId={property.id} coordinates={property.coordinates} />

          </div>

          {/* Right 1 Col: Contact Seller, Schedule Tour & Agent Card.
              The whole column is sticky so both the contact form and the
              "Ask Genie" card float alongside the scrolling content. */}
          <div className="space-y-6 sticky top-20 self-start">

            {/* Contact Seller Form */}
            <div id="contact-seller-card" className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-md space-y-5">
              
              {/* Seller Profile Summary */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#18A67D] relative shrink-0">
                  <Image
                    src={property.postedBy.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={property.postedBy.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-bold text-[#0F2A43]">{property.postedBy.name}</h3>
                    <UserCheck className="w-3.5 h-3.5 text-[#18A67D]" />
                  </div>
                  <div className="text-xs font-semibold text-[#18A67D]">{property.postedBy.type}</div>
                  <div className="text-[11px] text-[#64748B]">Responds in: {property.postedBy.responseTime || 'Under 1 hour'}</div>
                </div>
              </div>

              {/* Inquiry Status or Form */}
              {isInquirySubmitted ? (
                <div className="p-4 bg-[#E7F6F1] border border-[#18A67D]/30 rounded-xl space-y-3 animate-in fade-in">
                  <div className="text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-[#18A67D] mx-auto" />
                    <h4 className="text-sm font-bold text-[#0E7C5D]">Inquiry Sent!</h4>
                    <p className="text-xs text-[#64748B]">
                      Your request has been shared with the seller and our team. Here are the seller&apos;s contact details:
                    </p>
                  </div>

                  {/* Revealed seller contact details */}
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 space-y-2 text-left">
                    <div>
                      <div className="text-sm font-bold text-[#0F2A43]">{property.postedBy.name}</div>
                      <div className="text-[11px] font-semibold text-[#18A67D]">
                        {property.postedBy.type}
                        {property.postedBy.companyName ? ` · ${property.postedBy.companyName}` : ''}
                      </div>
                    </div>
                    {revealedPhone ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2A43]">
                          <Phone className="w-3.5 h-3.5 text-[#18A67D]" />
                          <a href={`tel:${revealedPhone}`} className="hover:underline">{revealedPhone}</a>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={`tel:${revealedPhone}`}
                            className="py-2 px-3 bg-[#0F2A43] hover:bg-[#163b5c] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${revealedPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I am interested in ${property.title}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-3 bg-[#25D366] hover:bg-[#1ebd59] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-[#64748B]">
                        The seller&apos;s phone number will appear here shortly. Our team will also reach out to connect you directly.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInquirySubmitted(false)}
                    className="w-full text-xs font-bold text-[#0F2A43] underline cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase">Your Name *</label>
                    <input
                      type="text"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[#18A67D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase">Mobile Number *</label>
                    <input
                      type="tel"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      required
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-[#18A67D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase">Preferred Site Visit Time</label>
                    <select
                      value={preferredVisitTime}
                      onChange={(e) => setPreferredVisitTime(e.target.value)}
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium outline-none"
                    >
                      <option value="This Weekend (11:00 AM - 1:00 PM)">This Weekend (11:00 AM - 1:00 PM)</option>
                      <option value="Today Evening (5:00 PM - 7:00 PM)">Today Evening (5:00 PM - 7:00 PM)</option>
                      <option value="Tomorrow Morning (10:00 AM)">Tomorrow Morning (10:00 AM)</option>
                      <option value="Direct Call / WhatsApp Chat First">Direct Call / WhatsApp Chat First</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#64748B] uppercase">Message</label>
                    <textarea
                      rows={2}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      placeholder="e.g. Please share the floor plan and site-visit availability."
                      className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingInquiry}
                    className="w-full py-3 bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingInquiry ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>Get Seller Contact Details</span>
                      </>
                    )}
                  </button>

                  <div className="text-center text-[10px] text-[#64748B] flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#18A67D]" />
                    <span>Your contact details are protected and shared only with this seller</span>
                  </div>
                </form>
              )}

            </div>

            {/* Ask Genie about this property */}
            <button
              type="button"
              onClick={() => openGenie(property)}
              className="w-full bg-[#0F2A43] hover:bg-[#163b5c] text-white rounded-2xl p-4 flex items-center gap-3 transition-colors cursor-pointer shadow-md text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-[#18A67D] flex items-center justify-center shrink-0 transform rotate-45">
                <Sparkles className="w-4 h-4 transform -rotate-45" />
              </div>
              <div>
                <div className="text-sm font-bold">Ask BayBayt Genie</div>
                <div className="text-[11px] text-slate-300">Price, locality, EMI & more about this home</div>
              </div>
            </button>

          </div>

        </div>

        {/* Similar Recommended Properties */}
        {similarProperties.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#0F2A43]">Similar Properties You May Like</h2>
              <Link href="/properties" className="text-xs font-bold text-[#18A67D] hover:underline">
                View All Catalog &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {similarProperties.map((simProp) => (
                <Link
                  key={simProp.id}
                  href={`/properties/${simProp.id}`}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <Image
                      src={simProp.images[0]}
                      alt={simProp.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 bg-[#0F2A43]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
                      {simProp.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-base font-black text-[#0E7C5D]">{simProp.priceFormatted}</div>
                    <div className="text-xs font-bold text-[#0F2A43] truncate">{simProp.title}</div>
                    <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#18A67D]" />
                      <span>{simProp.locality}, {simProp.city}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B] mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. Verified Real Estate Platform.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/properties" className="hover:text-[#18A67D]">Catalog</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">Dashboard</Link>
            <span className="text-slate-300">•</span>
            <Link href="/admin" className="hover:text-[#18A67D]">Admin</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
