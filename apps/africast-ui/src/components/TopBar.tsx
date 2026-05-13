'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, Shield, Zap, TrendingUp } from 'lucide-react';

export const TopBar = () => {
  const { address, balance, network, isDemo } = useWallet();

  return (
    <div className="w-full h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Zap className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">AfricaCast</h1>
          <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest leading-none">Verifiable Intelligence</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Revenue Ticker */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TrendingUp size={14} />
            <span className="text-sm font-bold font-mono">14.05 USDC</span>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Total Builder Revenue</span>
        </div>

        <div className="h-8 w-[1px] bg-slate-800" />

        {/* Wallet Info */}
        <div className="flex items-center gap-4 bg-slate-950/50 border border-slate-800 rounded-full py-1.5 pl-4 pr-1.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium leading-tight">
              {network}
            </span>
            <span className="text-xs text-slate-300 font-mono leading-tight">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connecting...'}
            </span>
          </div>
          
          <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-indigo-500/20">
            <Wallet size={12} />
            {balance} USDC
          </div>
        </div>

        {isDemo && (
          <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-amber-500/20">
            Demo
          </div>
        )}
      </div>
    </div>
  );
};
