'use client';

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { CITY_MARKET_TRENDS } from '@/data/mockProperties';
import { TrendingUp, ArrowUpRight, ShieldCheck, MapPin } from 'lucide-react';

export function MarketTrendsChart() {
  const [selectedCity, setSelectedCity] = useState<'all' | 'Bengaluru' | 'Mumbai' | 'New Delhi' | 'Hyderabad' | 'Pune'>('all');

  const cityColors: Record<string, string> = {
    Bengaluru: '#18A67D',
    Mumbai: '#0F2A43',
    'New Delhi': '#F59E0B',
    Hyderabad: '#6366F1',
    Pune: '#EC4899',
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F6F1] text-[#0E7C5D] text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pan-India Real Estate Price Index</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F2A43]">
            Average Property Price Index (₹ / sq.ft)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quarterly weighted price movement across prime Indian metro residential markets.
          </p>
        </div>

        {/* City Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Pune'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCity === city
                  ? 'bg-[#0F2A43] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {city === 'all' ? 'Compare All' : city}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={CITY_MARKET_TRENDS} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
                fontWeight: 600
              }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}/sq.ft`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />

            {(selectedCity === 'all' || selectedCity === 'Bengaluru') && (
              <Line
                type="monotone"
                dataKey="Bengaluru"
                stroke={cityColors.Bengaluru}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {(selectedCity === 'all' || selectedCity === 'Mumbai') && (
              <Line
                type="monotone"
                dataKey="Mumbai"
                stroke={cityColors.Mumbai}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {(selectedCity === 'all' || selectedCity === 'New Delhi') && (
              <Line
                type="monotone"
                dataKey="New Delhi"
                stroke={cityColors['New Delhi']}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {(selectedCity === 'all' || selectedCity === 'Hyderabad') && (
              <Line
                type="monotone"
                dataKey="Hyderabad"
                stroke={cityColors.Hyderabad}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
            {(selectedCity === 'all' || selectedCity === 'Pune') && (
              <Line
                type="monotone"
                dataKey="Pune"
                stroke={cityColors.Pune}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        {[
          { city: 'Bengaluru', growth: '+23.8%', rate: '₹10,400/sq.ft', driver: 'Tech corridor & Outer Ring Road' },
          { city: 'Hyderabad', growth: '+24.3%', rate: '₹9,450/sq.ft', driver: 'HITEC & Financial District' },
          { city: 'Mumbai', growth: '+12.1%', rate: '₹24,100/sq.ft', driver: 'Atal Setu & Coastal Road' },
          { city: 'Pune', growth: '+19.1%', rate: '₹8,100/sq.ft', driver: 'Kharadi & Hinjewadi Phase 3' },
        ].map((item, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2A43]">{item.city}</span>
              <span className="text-xs font-black text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {item.growth}
              </span>
            </div>
            <div className="text-sm font-extrabold text-[#0F2A43] mt-1">{item.rate}</div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.driver}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
