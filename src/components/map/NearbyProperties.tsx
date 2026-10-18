'use client';

/**
 * NearbyProperties — "What's around here" strip on the property detail page.
 *
 * This is the real consumer of the server-side geo endpoint (/api/properties/nearby):
 * unlike the discovery map, the detail page does NOT preload the full inventory, so
 * it asks the server for the handful of approved listings nearest this one. It is
 * the thing that makes the indexed (latitude, longitude) columns earn their keep.
 *
 * Renders nothing when the current listing has no coordinates (can't anchor a
 * search) or when the server finds no neighbours — the data gap stays honest.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Navigation } from 'lucide-react';
import { normalizeCoordinates, formatDistance } from '@/lib/maps/config';
import type { Property } from '@/lib/types';

interface NearbyResult {
  property: Property;
  distanceMeters: number;
}

const SEARCH_RADIUS_M = 5000; // 5 km
const MAX_SHOWN = 6;

export default function NearbyProperties({
  propertyId,
  coordinates,
}: {
  propertyId: string;
  coordinates?: { lat: number; lng: number };
}) {
  const center = normalizeCoordinates(coordinates);
  const [results, setResults] = useState<NearbyResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!center) return;
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({
      lat: String(center.lat),
      lng: String(center.lng),
      radius: String(SEARCH_RADIUS_M),
      exclude: propertyId,
      limit: String(MAX_SHOWN),
    });
    fetch(`/api/properties/nearby?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults(data?.success ? (data.results as NearbyResult[]) : []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // center is derived from coordinates; keying on the primitive avoids refetch loops.
  }, [center?.lat, center?.lng, propertyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // No anchor point, still loading the first time, or genuinely nothing nearby:
  // render nothing rather than an empty shell.
  if (!center) return null;
  if (loading && results === null) return null;
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-[#0F2A43] flex items-center gap-2">
          <Navigation className="w-5 h-5 text-[#18A67D]" />
          Nearby Listings
        </h2>
        <span className="text-xs font-semibold text-[#64748B]">
          Within {formatDistance(SEARCH_RADIUS_M)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {results.map(({ property: p, distanceMeters }) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between"
          >
            <div className="aspect-video relative overflow-hidden bg-slate-100">
              <Image
                src={
                  p.images?.[0] ||
                  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
                }
                alt={p.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-[#0F2A43]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
                {p.category}
              </div>
              <div className="absolute top-2 right-2 bg-[#18A67D] text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(distanceMeters)}
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="text-base font-black text-[#0E7C5D]">{p.priceFormatted}</div>
              <div className="text-xs font-bold text-[#0F2A43] truncate">{p.title}</div>
              <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#18A67D]" />
                <span>
                  {p.locality}, {p.city}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
