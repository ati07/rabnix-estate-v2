'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { propertyImageAlt } from '@/lib/seoText';
import { 
  Heart, 
  MapPin, 
  Maximize2, 
  ShieldCheck, 
  Building2, 
  Compass, 
  Calendar, 
  CheckCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  MessageSquare,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';

interface PropertyCardProps {
  property: Property;
  isShortlisted: boolean;
  onToggleShortlist: (propertyId: string) => void;
  onViewDetails: (property: Property) => void;
  onContactAgent: (property: Property) => void;
}

export function PropertyCard({
  property,
  isShortlisted,
  onToggleShortlist,
  onViewDetails,
  onContactAgent,
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      id={`property-card-${property.id}`}
      className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col md:flex-row group"
    >
      {/* Media / Carousel Column */}
      <div className="relative w-full md:w-80 h-56 md:h-auto shrink-0 bg-[#F1F5F9] overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt={propertyImageAlt(property, images.length > 1 ? currentImageIndex + 1 : undefined)}
          fill
          className="object-cover group-hover:scale-103 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 320px"
          referrerPolicy="no-referrer"
        />

        {/* Gradient Overlay on Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {property.isExclusiveOwner && (
            <span className="bg-[#0E7C5D] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>OWNER DIRECT</span>
            </span>
          )}
          {property.isVerified && !property.isExclusiveOwner && (
            <span className="bg-[#0F2A43] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-white/10">
              <ShieldCheck className="w-3 h-3 text-[#22C39A]" />
              <span>VERIFIED ON SITE</span>
            </span>
          )}
          {property.reraApproved && (
            <span className="bg-[#0F2A43]/95 text-[#22C39A] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-white/10">
              <Award className="w-3 h-3" />
              <span>RERA REGISTERED</span>
            </span>
          )}
        </div>

        {/* Shortlist Heart Button */}
        <button
          id={`shortlist-btn-${property.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleShortlist(property.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-transform active:scale-90 z-10 cursor-pointer ${
            isShortlisted
              ? 'bg-[#E7F6F1] text-[#18A67D]'
              : 'bg-white/90 text-[#64748B] hover:text-[#18A67D] hover:bg-white'
          }`}
          title={isShortlisted ? 'Remove from shortlist' : 'Save to shortlist'}
        >
          <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current text-[#18A67D]' : ''}`} />
        </button>

        {/* Carousel Arrow Controls */}
        {images.length > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrevImage}
              className="p-1 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="p-1 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Photo Count Indicator */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-1 rounded z-10 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>{images.length} Photos</span>
        </div>

        {/* Category Tag on Media */}
        <div className="absolute bottom-3 left-3 text-white text-xs font-bold uppercase tracking-wider drop-shadow-sm z-10">
          {property.category}
        </div>
      </div>

      {/* Details & Specs Column */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        
        {/* Top Header: Price & Location */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-[#0F2A43] tracking-tight">
                  {property.priceFormatted}
                </span>
                {property.pricePerSqFt && (
                  <span className="text-xs text-[#64748B] font-medium">
                    (₹{formatIndianNumber(property.pricePerSqFt)}/sq.ft)
                  </span>
                )}
                {property.priceDrop && (
                  <span className="text-[10px] bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    HOT DEAL
                  </span>
                )}
              </div>

              <Link 
                href={`/properties/${property.id}`}
                className="block text-sm sm:text-base font-semibold text-[#172033] hover:text-[#18A67D] transition-colors line-clamp-1 mt-0.5"
              >
                {property.title}
              </Link>
            </div>

          </div>

          {/* Locality & Sublocality with MapPin */}
          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#18A67D] shrink-0" />
            <span className="font-semibold text-[#172033]">{property.locality}</span>
            <span>, {property.city}</span>
            {property.subLocality && (
              <span className="text-[#64748B]">({property.subLocality})</span>
            )}
          </div>
        </div>

        {/* Specifications Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] text-xs">
          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Carpet Area</span>
            <span className="font-bold text-[#172033]">{property.carpetAreaSqFt} sq.ft</span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Configuration</span>
            <span className="font-bold text-[#172033]">
              {property.bhk ? `${property.bhk} BHK, ${property.bathrooms} Baths` : `${property.bathrooms} Baths`}
            </span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Status</span>
            <span className="font-bold text-[#172033]">{property.constructionStatus}</span>
          </div>

          <div>
            <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">Furnishing</span>
            <span className="font-bold text-[#172033]">{property.furnishing}</span>
          </div>
        </div>

        {/* Nearby Landmark snippet */}
        {property.nearbyLandmarks && property.nearbyLandmarks.length > 0 && (
          <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
            <span className="font-bold text-[#172033]">Connectivity:</span>
            <span className="truncate">
              {property.nearbyLandmarks[0].name} ({property.nearbyLandmarks[0].distance})
            </span>
          </div>
        )}

        {/* Bottom Actions Row & Posted By */}
        <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Posted By Details */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#0F2A43] flex items-center justify-center font-bold text-white text-xs shrink-0">
              {property.postedBy.name.slice(0, 1)}
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033] flex items-center gap-1">
                <span>{property.postedBy.name}</span>
                <span className="text-[10px] font-normal text-[#64748B]">
                  ({property.postedBy.type})
                </span>
              </div>
              <div className="text-[10px] text-[#0E7C5D] font-semibold">
                {property.postedBy.responseTime || 'Responds quickly'}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold bg-[#F1F5F9] text-[#172033] px-2 py-1 rounded uppercase tracking-wider hidden sm:inline-block">
              {property.postedBy.type === 'Owner' ? 'Owner' : 'Verified'}
            </span>

            <Link
              id={`view-details-btn-${property.id}`}
              href={`/properties/${property.id}`}
              className="text-xs font-bold text-[#0F2A43] hover:text-[#18A67D] py-2 px-1 transition-colors flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <button
              id={`contact-agent-btn-${property.id}`}
              onClick={() => onContactAgent(property)}
              className="text-xs font-bold text-white bg-[#18A67D] hover:bg-[#0E7C5D] px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact {property.postedBy.type === 'Owner' ? 'Owner' : 'Agent'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
