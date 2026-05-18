'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Landmark,
  BarChart2,
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface Signal {
  id: string;
  name: string;
  signal_class: string;
  value: number;
  unit: string;
  source_id: string;
  created_at: string;
}

const CLASS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  cpi_inflation: {
    label: 'Inflation',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    icon: <TrendingUp size={11} />,
  },
  interest_rate: {
    label: 'Rates',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: <Landmark size={11} />,
  },
  equity_price: {
    label: 'Equity',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: <BarChart2 size={11} />,
  },
  sentiment: {
    label: 'Sentiment',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    icon: <MessageSquare size={11} />,
  },
};

function classFor(cls: string) {
  return CLASS_META[cls] ?? {
    label: cls,
    color: 'text-slate-400',
    bg: 'bg-slate-800/40 border-slate-700/30',
    icon: <Activity size={11} />,
  };
}

function formatValue(value: number, unit: string, cls: string): string {
  if (unit === 'percent') return `${value.toFixed(2)}%`;
  if (unit === 'score') return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  if (unit === 'KES') return `KES ${value.toFixed(2)}`;
  if (unit === 'days') return `${value}d`;
  return `${value}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export const SignalsFeed = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch('/api/signals?limit=30');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setSignals(arr);
      setOnline(true);
      setLastFetch(new Date());
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + poll every 30s
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const classes = ['all', ...Array.from(new Set(signals.map((s) => s.signal_class)))];
  const visible = filter === 'all' ? signals : signals.filter((s) => s.signal_class === filter);

  return (
    <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800/60 flex items-center gap-2 shrink-0">
        <Activity size={13} className="text-indigo-400" />
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">
          Live Signal Feed
        </span>

        {/* Online status */}
        <div className="flex items-center gap-1 ml-1">
          {online ? (
            <Wifi size={10} className="text-emerald-400" />
          ) : (
            <WifiOff size={10} className="text-rose-400" />
          )}
          <span className={`text-[9px] font-mono ${online ? 'text-emerald-500' : 'text-rose-500'}`}>
            {online ? 'live' : 'mock'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchSignals}
          className="ml-auto p-1 rounded hover:bg-slate-800 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={10} className="text-slate-600 hover:text-slate-400" />
        </button>

        <span className="text-[9px] font-mono text-slate-600">
          {signals.length} signals
        </span>
      </div>

      {/* Filter chips */}
      <div className="px-4 py-2 border-b border-slate-800/40 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {classes.map((cls) => {
          const meta = cls === 'all' ? null : classFor(cls);
          const active = filter === cls;
          return (
            <button
              key={cls}
              onClick={() => setFilter(cls)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${
                active
                  ? meta
                    ? `${meta.bg} ${meta.color} border-current`
                    : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  : 'bg-transparent text-slate-600 border-slate-800/50 hover:border-slate-700 hover:text-slate-400'
              }`}
            >
              {cls === 'all' ? 'All' : (CLASS_META[cls]?.label ?? cls)}
            </button>
          );
        })}
      </div>

      {/* Signal rows */}
      <div className="overflow-y-auto divide-y divide-slate-800/30 max-h-[340px]">
        {loading ? (
          // Skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 bg-slate-800 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-slate-800 rounded w-3/4" />
                <div className="h-2 bg-slate-800/60 rounded w-1/2" />
              </div>
              <div className="h-3 bg-slate-800 rounded w-12" />
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-600 text-xs">
            No signals found
          </div>
        ) : (
          visible.map((sig) => {
            const meta = classFor(sig.signal_class);
            const isNeg = sig.unit === 'score' && sig.value < 0;
            return (
              <div
                key={sig.id}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors group"
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-md flex items-center justify-center border shrink-0 ${meta.bg} ${meta.color}`}>
                  {meta.icon}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200 truncate">{sig.name}</div>
                  <div className="text-[9px] text-slate-600 font-mono mt-0.5">{sig.source_id} · {timeAgo(sig.created_at)}</div>
                </div>

                {/* Value */}
                <div className={`text-[12px] font-mono font-bold shrink-0 ${
                  isNeg ? 'text-red-400' : sig.unit === 'score' ? 'text-emerald-400' : meta.color
                }`}>
                  {formatValue(sig.value, sig.unit, sig.signal_class)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {lastFetch && (
        <div className="px-4 py-2 border-t border-slate-800/30 shrink-0">
          <span className="text-[9px] text-slate-700 font-mono">
            last fetch: {lastFetch.toLocaleTimeString()} · auto-refreshes every 30s
          </span>
        </div>
      )}
    </div>
  );
};
