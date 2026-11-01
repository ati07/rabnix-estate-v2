'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { bhkLabel } from '@/lib/propertyFilters';
import {
  X,
  Heart,
  Trash2, 
  ExternalLink, 
  Layers, 
  Building, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';

interface ShortlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shortlistedProperties: Property[];
  onRemoveFromShortlist: (id: string) => void;
  onViewPropertyDetails: (property: Property) => void;
  onContactAgent: (property: Property) => void;
}

export function ShortlistDrawer({
  isOpen,
  onClose,
  shortlistedProperties,
  onRemoveFromShortlist,
  onViewPropertyDetails,
  onContactAgent,
}: ShortlistDrawerProps) {
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-white w-full sm:w-[540px] md:w-[680px] h-full shadow-2xl flex flex-col border-l border-neutral-200 animate-slide-left">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#163b5c] shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#18A67D] fill-current" />
            <div>
              <h2 className="text-base font-bold">
                My Saved Properties ({shortlistedProperties.length})
              </h2>
              <p className="text-xs text-slate-300">
                Shortlisted homes for quick comparison & contact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {shortlistedProperties.length >= 2 && (
              <button
                onClick={() => setShowComparisonMatrix(!showComparisonMatrix)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showComparisonMatrix
                    ? 'bg-[#18A67D] text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{showComparisonMatrix ? 'Hide Matrix' : 'Compare Side-by-Side'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {shortlistedProperties.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-[#E7F6F1] text-[#18A67D] rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#0F2A43]">Your Shortlist is Empty</h3>
              <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                Click the heart icon on any property card to save it for easy access, side-by-side comparison, or bulk inquiries.
              </p>
            </div>
          ) : showComparisonMatrix ? (
            /* Comparison Matrix */
            <div className="space-y-4 animate-fade-in">
              <div className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Side-by-Side Property Comparison
              </div>

              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] text-[#172033] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-3 w-28 shrink-0">Feature</th>
                      {shortlistedProperties.map((p) => (
                        <th key={p.id} className="p-3 min-w-[160px]">
                          <div className="line-clamp-1 font-bold text-[#0F2A43]">{p.title}</div>
                          <div className="text-[11px] text-[#0E7C5D] font-black">{p.priceFormatted}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">Locality</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">{p.locality}, {p.city}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">Area</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">{p.carpetAreaSqFt} sq.ft</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">Rate / sq.ft</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">
                          {p.pricePerSqFt ? `₹${formatIndianNumber(p.pricePerSqFt)}` : 'N/A'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">Configuration</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">
                          {p.bhk != null ? bhkLabel(p.bhk) : p.category}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">Furnishing</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">{p.furnishing}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-[#64748B]">RERA Status</td>
                      {shortlistedProperties.map((p) => (
                        <td key={p.id} className="p-3 font-medium text-[#172033]">
                          {p.reraApproved ? (
                            <span className="text-[#0E7C5D] font-bold">Approved</span>
                          ) : (
                            <span className="text-[#64748B]">Under Process</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Property Items List */
            <div className="space-y-3">
              {shortlistedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex gap-3 group"
                >
                  <div className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                    <Image
                      src={prop.images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=80'}
                      alt={prop.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-xs font-black text-[#0F2A43] truncate">
                          {prop.title}
                        </div>
                        <button
                          onClick={() => onRemoveFromShortlist(prop.id)}
                          className="text-[#64748B] hover:text-[#d92d20] p-1 transition-colors cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-bold text-[#0E7C5D]">
                        {prop.priceFormatted}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate">
                        {prop.locality}, {prop.city} • {prop.carpetAreaSqFt} sq.ft
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onViewPropertyDetails(prop);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-[#172033] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] px-2.5 py-1 rounded-md cursor-pointer"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          onContactAgent(prop);
                          onClose();
                        }}
                        className="text-[11px] font-bold text-white bg-[#18A67D] hover:bg-[#0E7C5D] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
