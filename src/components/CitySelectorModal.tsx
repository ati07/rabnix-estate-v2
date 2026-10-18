'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Check, LocateFixed, Loader2 } from 'lucide-react';
import { CityInfo } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import { formatIndianNumber } from '@/lib/formatters';
import { detectNearestCity } from '@/lib/geoCity';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityInfo;
  onSelectCity: (city: CityInfo) => void;
  /** Real verified-listing count per city, keyed by lowercased city name. */
  cityCounts?: Record<string, number>;
}

export function CitySelectorModal({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
  cityCounts,
}: CitySelectorModalProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setDetectError(null);
    const city = await detectNearestCity();
    setIsDetecting(false);
    if (city) {
      onSelectCity(city);
      onClose();
    } else {
      setDetectError('Could not detect your location. Please allow location access or pick a city below.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white p-5 flex items-center justify-between border-b border-[#163b5c]">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#18A67D]" />
              <span>Select Your City</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Explore property rates, trending localities, and verified projects across India
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detect location */}
        <div className="px-6 pt-5 pb-1">
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E7F6F1] hover:bg-[#d5efe6] text-[#0E7C5D] font-bold text-sm px-4 py-2.5 rounded-lg border border-[#18A67D]/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {isDetecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            <span>{isDetecting ? 'Detecting your location…' : 'Use my current location'}</span>
          </button>
          {detectError && (
            <p className="mt-2 text-xs text-red-600">{detectError}</p>
          )}
        </div>

        {/* City Grid */}
        <div className="px-6 pb-6 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-h-[75vh] overflow-y-auto">
          {CITIES_DATA.map((city) => {
            const isSelected = selectedCity.name === city.name;
            const verifiedCount = cityCounts?.[city.name.toLowerCase()] ?? 0;
            return (
              <div
                key={city.name}
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 hover:shadow-md group ${
                  isSelected
                    ? 'border-[#18A67D] ring-2 ring-[#E7F6F1] shadow-sm'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {/* City Photo */}
                <div className="relative h-28 w-full bg-slate-200">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    className="object-cover group-hover:scale-108 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, 200px"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-[#18A67D] text-white p-1 rounded-full shadow-md">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 text-white">
                    <div className="font-bold text-sm drop-shadow-md">{city.name}</div>
                    <div className="text-[10px] text-slate-200">{city.state}</div>
                  </div>
                </div>

                {/* City Details */}
                <div className="p-2.5 bg-white text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-[10px]">Avg Rate:</span>
                    <span className="font-bold text-[#0F2A43]">₹{formatIndianNumber(city.avgPricePerSqFt)}/sq.ft</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#64748B]">YoY Growth:</span>
                    <span className="text-[10px] font-bold text-[#0E7C5D]">+{city.yoyGrowth}%</span>
                  </div>

                  <div className="text-[10px] text-[#64748B] pt-0.5 border-t border-[#E2E8F0]">
                    {verifiedCount > 0
                      ? `${formatIndianNumber(verifiedCount)} verified ${verifiedCount === 1 ? 'property' : 'properties'}`
                      : 'No listings yet'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
