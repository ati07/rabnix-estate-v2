'use client';

import React, { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  Building2, 
  Home, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Key,
  Star
} from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const initialMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'signin';

  // Once signed in, send the user straight to their dashboard.
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      
      {/* Top Simple Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <BrandLogo variant="onLight" priority className="h-9 w-auto" />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0F2A43] hover:text-[#18A67D] transition-colors bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </Link>
        </div>
      </header>

      {/* Main Dual-Column Authentication Canvas */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Brand Pillars, Trust & Visuals */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F6F1] text-[#0E7C5D] text-xs font-bold uppercase tracking-wider border border-[#18A67D]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#18A67D]" />
                <span>India&apos;s Smartest Real Estate Network</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F2A43] leading-tight">
                Unlock Verified Properties, Direct Owners & <span className="text-[#18A67D]">AI Valuations</span>
              </h1>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Join home buyers, property owners, and verified developers who find, buy, sell, and rent homes with zero friction.
              </p>
            </div>

            {/* Core Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              {[
                {
                  icon: ShieldCheck,
                  title: '100% RERA & Physically Verified',
                  desc: 'Every property title, carpet area, and occupancy certificate is verified before listing.'
                },
                {
                  icon: Key,
                  title: 'Direct Owner Network',
                  desc: 'Connect straight to verified landlords and individual flat sellers without middlemen.'
                },
                {
                  icon: TrendingUp,
                  title: 'BayBayt AI Price Trends & Forecasts',
                  desc: 'AI algorithms estimate genuine fair market rates, rental yields, and 5-year appreciation.'
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-3.5 p-3.5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
                    <div className="p-2 rounded-lg bg-[#E7F6F1] text-[#0E7C5D] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#0F2A43]">{item.title}</div>
                      <div className="text-[11px] sm:text-xs text-[#64748B] mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User Testimonial & Trust Rating */}
            <div className="p-4 bg-[#0F2A43] rounded-2xl text-white space-y-2.5 border border-[#163b5c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#22C39A]">4.9 / 5 Rating</span>
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                &ldquo;Found our 3 BHK in Whitefield within 4 days. Contacted the owner directly. The AI valuation gave us complete confidence during price negotiation!&rdquo;
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                <span className="font-bold text-white">Ananya & Rohit Deshmukh</span>
                <span>Bangalore Homeowners</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Sign In / Sign Up Form */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
              <AuthForm initialMode={initialMode} onSuccess={() => router.replace('/dashboard')} />
            </div>
          </div>

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 px-4 text-center text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} BayBayt. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/" className="hover:text-[#18A67D]">Home</Link>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Privacy Policy</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Terms of Service</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">RERA Disclaimers</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-bold text-[#0F2A43]">Loading BayBayt Authentication...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
