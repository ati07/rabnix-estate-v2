'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, MapPin, Check, LocateFixed, Loader2 } from 'lucide-react';
import { CityInfo } from '@/lib/types';
import { POPULAR_CITY_NAMES, resolveCityInfo } from '@/lib/realEstateData';
import { detectNearestCity } from '@/lib/geoCity';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityInfo;
  onSelectCity: (city: CityInfo) => void;
}

// Deterministic gradient for cities that have no curated photo, so each city
// always gets the same colourful tile instead of a blank card.
const TILE_GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-fuchsia-500',
  'from-amber-500 to-pink-500',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
  'from-lime-500 to-emerald-600',
];

function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TILE_GRADIENTS[hash % TILE_GRADIENTS.length];
}

function CityCard({
  city,
  isSelected,
  onClick,
}: {
  city: CityInfo;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-102 hover:shadow-md group ${
        isSelected
          ? 'border-[#18A67D] ring-2 ring-[#E7F6F1] shadow-sm'
          : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
      }`}
    >
      <div className="relative h-28 w-full bg-slate-200">
        {city.image ? (
          <Image
            src={city.image}
            alt={city.name}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 200px"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradientFor(city.name)} group-hover:scale-108 transition-transform duration-500`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {isSelected && (
          <div className="absolute top-2 right-2 bg-[#18A67D] text-white p-1 rounded-full shadow-md">
            <Check className="w-3 h-3" />
          </div>
        )}

        <div className="absolute bottom-2 left-2 text-white">
          <div className="font-bold text-sm drop-shadow-md">{city.name}</div>
          {city.state && (
            <div className="text-[10px] text-slate-200">{city.state}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CitySelectorModal({
  isOpen,
  onClose,
  selectedCity,
  onSelectCity,
}: CitySelectorModalProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [dbCityNames, setDbCityNames] = useState<string[]>([]);

  // Pull the cities that actually have approved inventory (once per open).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/cities/distinct')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success || !Array.isArray(data.cities)) return;
        setDbCityNames(data.cities.map((c: { name: string }) => c.name));
      })
      .catch(() => {
        /* keep popular-only fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const popularCities = useMemo(
    () => POPULAR_CITY_NAMES.map((name) => resolveCityInfo(name)),
    []
  );

  // Every live city that isn't already pinned to the Popular row.
  const otherCities = useMemo(() => {
    const popularSet = new Set(POPULAR_CITY_NAMES.map((n) => n.toLowerCase()));
    return dbCityNames
      .filter((name) => !popularSet.has(name.toLowerCase()))
      .map((name) => resolveCityInfo(name));
  }, [dbCityNames]);

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

  const handlePick = (city: CityInfo) => {
    onSelectCity(city);
    onClose();
  };

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

        {/* City sections */}
        <div className="px-6 pb-6 pt-3 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Popular Cities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-2.5">
              Popular Cities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {popularCities.map((city) => (
                <CityCard
                  key={city.name}
                  city={city}
                  isSelected={selectedCity.name.toLowerCase() === city.name.toLowerCase()}
                  onClick={() => handlePick(city)}
                />
              ))}
            </div>
          </div>

          {/* All Cities (live from inventory) */}
          {otherCities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#64748B] mb-2.5">
                All Cities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {otherCities.map((city) => (
                  <CityCard
                    key={city.name}
                    city={city}
                    isSelected={selectedCity.name.toLowerCase() === city.name.toLowerCase()}
                    onClick={() => handlePick(city)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
