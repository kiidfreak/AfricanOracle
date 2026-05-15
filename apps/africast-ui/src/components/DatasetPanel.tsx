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
    <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800/60 flex items-center gap-2">
        <Database size={13} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">
          Loaded Datasets
        </span>
        <span className="ml-auto text-[9px] font-mono text-slate-600">
          {DATASETS.length} sources
        </span>
      </div>

      <div className="divide-y divide-slate-800/40">
        {DATASETS.map((ds) => (
          <div
            key={ds.name}
            className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center border border-slate-800/50 shrink-0">
              {ds.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200 truncate">{ds.name}</span>
                <span className={`status-dot ${ds.status}`} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500">{ds.source}</span>
                <span className="text-[9px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500 font-mono">{ds.records}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-slate-600 font-mono">{ds.lastUpdate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
