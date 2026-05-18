'use client';

import React from 'react';
import { Database, Globe, CloudRain, Landmark, BarChart3, Wheat } from 'lucide-react';

interface Dataset {
  name: string;
  source: string;
  status: 'live' | 'cached';
  records: string;
  region: string;
  icon: React.ReactNode;
  lastUpdate: string;
}

const DATASETS: Dataset[] = [
  {
    name: 'Maize Wholesale Prices',
    source: 'KNBS / EAGC',
    status: 'live',
    records: '2,847 records',
    region: 'KE',
    icon: <Wheat size={13} className="text-amber-400" />,
    lastUpdate: '2h ago',
  },
  {
    name: 'CBK Interest Rates',
    source: 'Central Bank of Kenya',
    status: 'live',
    records: '156 meetings',
    region: 'KE',
    icon: <Landmark size={13} className="text-blue-400" />,
    lastUpdate: '6h ago',
  },
  {
    name: 'CHIRPS Rainfall Index',
    source: 'UCSB / FEWS NET',
    status: 'cached',
    records: '12,400 gridpoints',
    region: 'East Africa',
    icon: <CloudRain size={13} className="text-cyan-400" />,
    lastUpdate: '1d ago',
  },
  {
    name: 'USD/KES Exchange Rate',
    source: 'Open Exchange Rates',
    status: 'live',
    records: '365 daily closes',
    region: 'KE',
    icon: <Globe size={13} className="text-emerald-400" />,
    lastUpdate: '15m ago',
  },
  {
    name: 'CPI / Inflation',
    source: 'KNBS',
    status: 'cached',
    records: '84 monthly reports',
    region: 'KE',
    icon: <BarChart3 size={13} className="text-rose-400" />,
    lastUpdate: '3d ago',
  },
];

export const DatasetPanel = () => {
  return (
    <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl overflow-hidden shadow-md">
      {/* Scoped CSS animation keyframes for high-fidelity infinite wrap LTR scrolling */}
      <style>{`
        @keyframes marquee-ltr {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee-ltr {
          display: flex;
          width: max-content;
          animation: marquee-ltr 28s linear infinite;
        }
        .marquee-container:hover .animate-marquee-ltr {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-800/60 flex items-center gap-2 bg-[#0c1120]">
        <Database size={12} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">
          Loaded Datasets
        </span>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        <span className="ml-auto text-[9px] font-mono text-slate-600">
          {DATASETS.length} sources · auto-synced
        </span>
      </div>

      {/* Ticker marquee container */}
      <div className="marquee-container relative w-full overflow-hidden bg-[#070b16] py-3.5 flex select-none">
        {/* Left & Right Edge Gradient Masks for premium fading edge visual effect */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-[#0c1120] to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-[#0c1120] to-transparent pointer-events-none z-10" />

        {/* Scrolling Tracks */}
        <div className="animate-marquee-ltr flex gap-6 px-3 shrink-0">
          {/* Set 1 */}
          {DATASETS.map((ds, idx) => (
            <div
              key={`${ds.name}-1-${idx}`}
              className="flex items-center gap-3 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/40 hover:border-indigo-500/20 rounded-full py-1.5 px-4 shrink-0 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0">
                {ds.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-slate-200">{ds.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${ds.status === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-slate-500 font-medium">{ds.source}</span>
                  <span className="text-[9px] text-slate-600">•</span>
                  <span className="text-[9px] text-indigo-400/90 font-mono">{ds.records}</span>
                </div>
              </div>
              <span className="text-[8.5px] text-slate-600 font-mono ml-2 shrink-0">{ds.lastUpdate}</span>
            </div>
          ))}
          {/* Set 2 (Duplicated for infinite seamless wrapping) */}
          {DATASETS.map((ds, idx) => (
            <div
              key={`${ds.name}-2-${idx}`}
              className="flex items-center gap-3 bg-slate-950/60 hover:bg-slate-900/80 border border-slate-800/40 hover:border-indigo-500/20 rounded-full py-1.5 px-4 shrink-0 shadow-sm transition-all hover:scale-[1.01] cursor-pointer"
              aria-hidden="true"
            >
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shrink-0">
                {ds.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-slate-200">{ds.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${ds.status === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-slate-500 font-medium">{ds.source}</span>
                  <span className="text-[9px] text-slate-600">•</span>
                  <span className="text-[9px] text-indigo-400/90 font-mono">{ds.records}</span>
                </div>
              </div>
              <span className="text-[8.5px] text-slate-600 font-mono ml-2 shrink-0">{ds.lastUpdate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
