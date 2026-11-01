'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Building2, 
  MapPin, 
  IndianRupee, 
  Check, 
  Info, 
  Award,
  BarChart3,
  Percent,
  Compass
} from 'lucide-react';
import { AiValuationResult, PropertyCategory, FurnishingStatus } from '@/lib/types';
import { CITIES_DATA } from '@/lib/realEstateData';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/formatters';
import { BHK_OPTION_VALUES, bhkLabel } from '@/lib/propertyFilters';

interface AiValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCity?: string;
}

export function AiValuationModal({
  isOpen,
  onClose,
  defaultCity = 'Bangalore'
}: AiValuationModalProps) {
  const [city, setCity] = useState<string>(defaultCity);
  const [locality, setLocality] = useState<string>('Whitefield');
  const [category, setCategory] = useState<PropertyCategory>('Apartment');
  const [areaSqFt, setAreaSqFt] = useState<number>(1200);
  const [bhk, setBhk] = useState<number>(2);
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-Furnished');
  const [age, setAge] = useState<string>('2 years');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiValuationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'valuation',
          payload: {
            city,
            locality,
            category,
            areaSqFt,
            bhk,
            furnishing,
            age
          }
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data.error || 'Unable to compute valuation.');
      }
    } catch (err: any) {
      setError('Network error while running AI valuation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-neutral-200">
        
        {/* Header */}
        <div className="bg-[#0F2A43] text-white px-6 py-4 flex items-center justify-between border-b border-[#163b5c] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#18A67D] text-white text-xs font-black px-2 py-0.5 rounded-xs">
              BayBayt
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <Sparkles className="w-4 h-4 text-[#22C39A]" />
              <span>AI Property Valuation & Instant Price Estimator</span>
            </div>
          </div>
          <button
            id="valuation-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Input Form */}
          <form onSubmit={handleRunValuation} className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
            <div className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider">
              Enter Property Details for AI Valuation
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                >
                  {CITIES_DATA.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Locality</label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Bandra West, Whitefield"
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Property Type</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                >
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Independent Villa</option>
                  <option value="Builder Floor">Builder Floor</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Commercial Office">Commercial Office</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Area (sq.ft)</label>
                <input
                  type="number"
                  required
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">BHK</label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                >
                  {BHK_OPTION_VALUES.map((n) => (
                    <option key={n} value={n}>{bhkLabel(n)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Furnishing</label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value as FurnishingStatus)}
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                >
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748B]">Age of Property</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 2 years / Under Construction"
                  className="w-full text-xs font-semibold bg-white border border-[#CBD5E1] rounded-lg p-2.5 outline-none focus:border-[#18A67D]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                id="valuation-submit-btn"
                type="submit"
                disabled={loading}
                className="bg-[#18A67D] hover:bg-[#0E7C5D] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{loading ? 'Crunching Indian Market Real Estate Data...' : 'Estimate Fair Value & Yield'}</span>
              </button>
            </div>
          </form>

          {/* Results Display */}
          {loading && (
            <div className="text-center py-12 space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-[#18A67D] border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-[#0F2A43]">
                Analyzing registry transactions, RERA benchmarks & micro-market rates...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5 animate-fade-in">
              
              {/* Metric Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#E7F6F1] p-4 rounded-2xl border border-[#18A67D]/30">
                  <span className="text-xs font-bold text-[#0E7C5D] uppercase block">
                    Fair Market Valuation
                  </span>
                  <div className="text-2xl font-black text-[#0F2A43] mt-1">
                    {formatIndianCurrency(result.fairValueEstimate)}
                  </div>
                  <div className="text-xs text-[#64748B] font-semibold mt-1">
                    ₹{formatIndianNumber(result.fairPriceSqFt)} per sq.ft
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Range: {formatIndianCurrency(result.estimatedPriceMin)} - {formatIndianCurrency(result.estimatedPriceMax)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#CBD5E1]">
                  <span className="text-xs font-bold text-[#0E7C5D] uppercase block">
                    Expected Gross Rental Yield
                  </span>
                  <div className="text-2xl font-black text-[#0E7C5D] mt-1">
                    {result.rentalYield}% p.a.
                  </div>
                  <div className="text-xs text-[#64748B] font-semibold mt-1">
                    ₹{formatIndianNumber(result.estimatedRentalMin)} - ₹{formatIndianNumber(result.estimatedRentalMax)} / month
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Steady cashflow potential
                  </div>
                </div>

                <div className="bg-[#0F2A43] text-white p-4 rounded-2xl border border-[#163b5c]">
                  <span className="text-xs font-bold text-[#22C39A] uppercase block">
                    5-Year Capital Growth
                  </span>
                  <div className="text-2xl font-black text-white mt-1">
                    +{result.fiveYearAppreciationForecast}%
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-1">
                    Locality Grade: {result.localityGrade}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Confidence: {result.confidenceScore || 94}%
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-1">
                <div className="text-xs font-bold text-[#0F2A43] uppercase tracking-wider">
                  Valuation Executive Summary
                </div>
                <p className="text-xs text-[#172033] leading-relaxed">{result.summary}</p>
              </div>

              {/* Drivers & Pros/Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pros */}
                <div className="bg-[#E7F6F1]/50 p-4 rounded-xl border border-[#18A67D]/20 space-y-2">
                  <span className="text-xs font-bold text-[#0E7C5D] block">
                    Key Investment Drivers & Pros
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#172033]">
                    {result.marketPros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-4 h-4 text-[#0E7C5D] shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons / Considerations */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-800 block">
                    Points of Caution & Market Risks
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#172033]">
                    {result.marketCons.map((con, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
