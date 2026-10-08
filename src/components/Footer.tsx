'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { CITIES_DATA } from '@/lib/realEstateData';
import { CityInfo } from '@/lib/types';
import { BrandLogo } from '@/components/BrandLogo';

interface FooterProps {
  onSelectCity: (city: CityInfo) => void;
  onOpenEmiCalculator: () => void;
  onOpenAiValuation: () => void;
  onOpenPostProperty: () => void;
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="bg-[#0F2A43] text-slate-300 text-xs border-t border-[#163b5c]">

      {/* Main Links Grid */}
      <div className="py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
          
          {/* Col 1: Brand & About */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center">
              <BrandLogo variant="onDark" className="h-9 w-auto" />
            </div>
            <p className="text-slate-300 leading-relaxed max-w-sm text-xs">
              A property portal for buying, selling, and renting residential flats, villas, commercial spaces, and land plots &mdash; with owner-direct, zero-brokerage listings.
            </p>
            <div className="pt-2 text-slate-400 space-y-1 text-xs">
              <div>
                Phone:{' '}
                <a href="tel:+917991549436" className="hover:text-white transition-colors">
                  +91 79915 49436
                </a>
              </div>
              <div>
                Email:{' '}
                <a href="mailto:support@baybayt.com" className="hover:text-white transition-colors">
                  support@baybayt.com
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Top Real Estate Cities */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Explore Top Cities
            </div>
            <ul className="space-y-1.5 text-slate-300">
              {CITIES_DATA.slice(0, 6).map((c) => (
                <li key={c.name}>
                  <Link
                    href={`/properties?city=${encodeURIComponent(c.name)}`}
                    className="hover:text-white transition-colors"
                  >
                    Properties in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Services & AI Tools */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Dashboards & Portals
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <Link href="/auth?mode=signin" className="hover:text-white transition-colors text-[#22C39A] font-semibold">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors text-white font-semibold">
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors text-amber-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Admin Verification</span>
                </Link>
              </li>
              <li>
                <Link href="/post-property" className="hover:text-white transition-colors text-[#22C39A] font-semibold">
                  Post Property FREE
                </Link>
              </li>
              <li>
                <Link href="/properties" className="hover:text-white transition-colors">
                  Search All Properties
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Tools & Calculators */}
          <div className="space-y-2.5">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Tools & Features
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <Link href="/collections" className="hover:text-white transition-colors text-[#22C39A] font-semibold">
                  Curated Collections
                </Link>
              </li>
              <li>
                <Link href="/builders" className="hover:text-white transition-colors text-white font-semibold">
                  Top Builders & Projects
                </Link>
              </li>
              <li>
                <Link href="/properties?verified=true" className="hover:text-white transition-colors">
                  Verified Listings
                </Link>
              </li>
              <li>
                <Link href="/properties?owner=true" className="hover:text-white transition-colors">
                  0% Brokerage Homes
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* RERA & Disclaimer Bottom Bar */}
      <div className="bg-[#091a2a] py-5 px-4 sm:px-8 border-t border-[#163b5c] text-[11px] text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} BayBayt. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
