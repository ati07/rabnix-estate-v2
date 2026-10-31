'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { useProperties } from '@/lib/propertyContext';
import { PropertyCatalog } from '@/components/PropertyCatalog';
import { parseFiltersFromParams, type PropertyFilterState } from '@/lib/propertyFilters';
import { CITIES_DATA } from '@/lib/realEstateData';

/**
 * The public /properties catalog. It is a thin wrapper around the shared
 * <PropertyCatalog> UI (the same design used on the SEO landing pages): it seeds
 * the filters from the URL's query params, feeds the live client property store,
 * and asks the catalog to mirror filter changes back into the address bar
 * (shareable deep links). The landing pages reuse the identical catalog but seed
 * from a fixed facet instead and keep their clean canonical URL.
 */
function PropertiesCatalogContent() {
  const searchParams = useSearchParams();
  const { properties } = useProperties();

  // Seed filters from the URL. Normalize the city to its canonical CITIES_DATA
  // name so the selector shows the right option.
  const initialFilters = useMemo<PropertyFilterState>(() => {
    const f = parseFiltersFromParams(searchParams);
    if (f.city && f.city !== 'All') {
      const match = CITIES_DATA.find(
        (c) => c.name.toLowerCase() === f.city.toLowerCase() || c.code.toLowerCase() === f.city.toLowerCase(),
      );
      if (match) f.city = match.name;
    }
    return f;
  }, [searchParams]);

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
              href="/"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              My Dashboard
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

      <PropertyCatalog
        properties={properties}
        initialFilters={initialFilters}
        syncUrl
        showHeading
        showSavedSearches
      />

      {/* Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B] mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. Verified Catalog.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <Link href="/post-property" className="hover:text-[#18A67D]">Post Property</Link>
            <span className="text-slate-300">•</span>
            <Link href="/dashboard" className="hover:text-[#18A67D]">Dashboard</Link>
            <span className="text-slate-300">•</span>
            <Link href="/admin" className="hover:text-[#18A67D]">Admin Verification</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PropertiesCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A43]">
            <div className="w-4 h-4 border-2 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
            <span>Loading verified properties catalog...</span>
          </div>
        </div>
      }
    >
      {/* Filters live in local state and are mirrored to the URL via the History
          API (shareable deep links) — so no searchParams-keyed remount. */}
      <PropertiesCatalogContent />
    </Suspense>
  );
}
