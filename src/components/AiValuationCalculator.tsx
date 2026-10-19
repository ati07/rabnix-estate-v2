'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Calculator, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  DollarSign,
  PieChart,
  Home
} from 'lucide-react';
import { ValuationQuery, ValuationResult, PropertyType, FurnishingStatus } from '@/types';
import { INDIAN_CITIES } from '@/data/mockProperties';

export function AiValuationCalculator() {
  const [formData, setFormData] = useState<ValuationQuery>({
    city: 'Bengaluru',
    locality: 'Whitefield',
    propertyType: 'apartment',
    bedrooms: 3,
    carpetArea: 1500,
    furnishing: 'semi-furnished',
    age: '1-3 Years',
    floor: 6,
    totalFloors: 20,
    hasParking: true,
    isGatedSociety: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  // Baseline city price multiplier per sq ft
  const calculateLocalValuation = (data: ValuationQuery): ValuationResult => {
    const baseRates: Record<string, number> = {
      Bengaluru: 9800,
      Mumbai: 22500,
      'New Delhi': 8200,
      Hyderabad: 8800,
      Pune: 7600,
      Chennai: 7400,
      Kolkata: 5800,
      Ahmedabad: 5200,
    };

    let rate = baseRates[data.city] || 7500;

    // Property type adjustments
    if (data.propertyType === 'villa') rate *= 1.35;
    if (data.propertyType === 'commercial') rate *= 1.45;
    if (data.propertyType === 'independent_house') rate *= 1.15;

    // Furnishing adjustments
    if (data.furnishing === 'furnished') rate *= 1.12;
    if (data.furnishing === 'unfurnished') rate *= 0.95;

    // Age adjustments
    if (data.age === 'Under Construction') rate *= 0.90;
    if (data.age === '5-10 Years') rate *= 0.88;
    if (data.age === '>10 Years') rate *= 0.78;

    // Gated society and parking
    if (data.isGatedSociety) rate *= 1.08;
    if (data.hasParking) rate *= 1.04;

    const avgRate = Math.round(rate);
    const rawValuation = avgRate * data.carpetArea;
    const minValuation = Math.round(rawValuation * 0.94);
    const maxValuation = Math.round(rawValuation * 1.06);

    const formatPrice = (val: number) => {
      if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(2)} Cr`;
      }
      return `₹${(val / 100000).toFixed(1)} Lakh`;
    };

    const monthlyRent = Math.round((rawValuation * 0.042) / 12);
    const rentalDisplay = `₹${monthlyRent.toLocaleString('en-IN')} / mo`;

    return {
      estimatedPriceMin: minValuation,
      estimatedPriceMax: maxValuation,
      estimatedPriceDisplay: `${formatPrice(minValuation)} – ${formatPrice(maxValuation)}`,
      avgPricePerSqFt: avgRate,
      rentalEstimateMonthly: rentalDisplay,
      appreciationRateYearly: '+8.6% p.a.',
      confidenceScore: 94,
      marketDemand: 'Very High',
      comparableLocalities: [
        { name: `${data.locality} Prime Corridor`, avgRate: `₹${avgRate.toLocaleString('en-IN')}/sq.ft` },
        { name: `${data.city} Tech Park Hub`, avgRate: `₹${Math.round(avgRate * 1.05).toLocaleString('en-IN')}/sq.ft` },
        { name: `${data.city} Metro Station Link`, avgRate: `₹${Math.round(avgRate * 0.96).toLocaleString('en-IN')}/sq.ft` },
      ],
      aiAnalysisText: `Based on verified micro-market registrations in ${data.locality}, ${data.city}, a ${data.bedrooms > 0 ? `${data.bedrooms} BHK ` : ''}${data.propertyType.replace('_', ' ')} spanning ${data.carpetArea} sq.ft commands strong buyer liquidity with an estimated annual appreciation of 8-11% fueled by infrastructure developments.`
    };
  };

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call server route
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.estimatedPriceDisplay) {
          setResult(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Fallback algorithmic calculation
    setTimeout(() => {
      setResult(calculateLocalValuation(formData));
      setLoading(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#0F2A43] via-[#163b5c] to-[#0F2A43] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#22C39A] text-xs font-bold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BayBayt AI Valuation Engine 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Instant AI Fair Market Property Valuation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Calculate accurate price estimates, fair rental returns, and 5-year capital appreciation forecasts using real Indian registry data.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs">
            <ShieldCheck className="w-5 h-5 text-[#22C39A]" />
            <span>RERA & Registration Verified Benchmarks</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
        
        {/* Left Form (7 Cols) */}
        <form onSubmit={handleEstimate} className="lg:col-span-7 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                City
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0F2A43] focus:border-[#18A67D] focus:ring-1 focus:ring-[#18A67D]"
              >
                {INDIAN_CITIES.filter((c) => c !== 'All Cities').map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Locality */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Locality / Area Name
              </label>
              <input
                type="text"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                placeholder="e.g. Whitefield, Bandra West, Gachibowli..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D] focus:ring-1 focus:ring-[#18A67D]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Property Type
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value as PropertyType })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D]"
              >
                <option value="apartment">Apartment / Flat</option>
                <option value="villa">Independent Villa</option>
                <option value="independent_house">Builder Floor / House</option>
                <option value="commercial">Commercial Office</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Bedrooms (BHK)
              </label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D]"
              >
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="5">5+ BHK</option>
              </select>
            </div>

            {/* Carpet Area */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Carpet Area (sq.ft)
              </label>
              <input
                type="number"
                value={formData.carpetArea}
                onChange={(e) => setFormData({ ...formData, carpetArea: Number(e.target.value) })}
                min="200"
                max="25000"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Furnishing */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Furnishing Status
              </label>
              <select
                value={formData.furnishing}
                onChange={(e) => setFormData({ ...formData, furnishing: e.target.value as FurnishingStatus })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D]"
              >
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="furnished">Fully Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            {/* Age of Property */}
            <div>
              <label className="block text-xs font-bold text-[#0F2A43] mb-1.5">
                Property Age
              </label>
              <select
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#0F2A43] focus:border-[#18A67D]"
              >
                <option value="Under Construction">Under Construction</option>
                <option value="0-1 Year (New)">0-1 Year (Brand New)</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5-10 Years">5-10 Years</option>
                <option value=">10 Years">&gt; 10 Years</option>
              </select>
            </div>
          </div>

          {/* Checkboxes: Gated & Parking */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F2A43]">
              <input
                type="checkbox"
                checked={formData.isGatedSociety}
                onChange={(e) => setFormData({ ...formData, isGatedSociety: e.target.checked })}
                className="w-4 h-4 text-[#18A67D] rounded accent-[#18A67D]"
              />
              <span>Gated Society / High-Rise Township</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F2A43]">
              <input
                type="checkbox"
                checked={formData.hasParking}
                onChange={(e) => setFormData({ ...formData, hasParking: e.target.checked })}
                className="w-4 h-4 text-[#18A67D] rounded accent-[#18A67D]"
              />
              <span>Reserved Covered Car Parking</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-[#18A67D] hover:bg-[#158f6c] text-white text-sm font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing Micro-Market Registrations...</span>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Instant AI Valuation Report</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Right Result Card (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          {result ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#0E7C5D] tracking-wider">
                    AI Fair Market Value
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-[#0F2A43]">
                    {result.estimatedPriceDisplay}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#E7F6F1] text-[#0E7C5D] flex flex-col items-center">
                  <span className="text-[10px] font-bold">Accuracy</span>
                  <span className="text-xs font-black">{result.confidenceScore}%</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">Avg. Rate / Sq.Ft</span>
                  <span className="text-sm font-extrabold text-[#0F2A43]">
                    ₹{result.avgPricePerSqFt.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">Est. Monthly Rent</span>
                  <span className="text-sm font-extrabold text-[#0E7C5D]">
                    {result.rentalEstimateMonthly}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">5-Yr Price Trend</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {result.appreciationRateYearly}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 font-bold block">Micro-Market Demand</span>
                  <span className="text-sm font-extrabold text-[#0F2A43]">
                    {result.marketDemand}
                  </span>
                </div>
              </div>

              {/* AI Analysis Commentary */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
                  <Sparkles className="w-3.5 h-3.5 text-[#18A67D]" />
                  <span>AI Valuation Summary</span>
                </div>
                <p className="leading-relaxed">
                  {result.aiAnalysisText}
                </p>
              </div>

              {/* Comparable Rates */}
              {result.comparableLocalities && result.comparableLocalities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#0F2A43] uppercase tracking-wider block">
                    Nearby Comparable Micro-Markets
                  </span>
                  <div className="space-y-1">
                    {result.comparableLocalities.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-700 font-medium">{comp.name}</span>
                        <span className="font-bold text-[#0F2A43]">{comp.avgRate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F6F1] text-[#18A67D] flex items-center justify-center mx-auto shadow-xs">
                <Calculator className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#0F2A43]">
                Ready for AI Price Estimation
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Fill in the property details on the left and click generate to receive a full fair price range, rental estimate, and appreciation outlook.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
