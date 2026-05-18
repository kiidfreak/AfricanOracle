'use client';

import React from 'react';
import { Zap, Wallet, Radio } from 'lucide-react';

export const TopBar = ({
  address,
  onConnect,
}: {
  address?: string | null;
  onConnect?: () => void;
}) => {
  const displayAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="w-full h-14 bg-[#0a0f1a]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Zap className="text-white w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">AfricaCast</h1>
          <p className="text-[9px] text-indigo-400/80 font-mono uppercase tracking-[0.2em] leading-none mt-0.5">
            Verifiable Intelligence
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80">
          <Radio size={10} className="animate-pulse" />
          <span className="font-mono">Arc Testnet</span>
        </div>
        <div className="h-4 w-px bg-slate-800" />
        
        {displayAddr ? (
          <div className="flex items-center gap-2 bg-[#0d1222] border border-slate-800/80 rounded-full py-1 pl-3 pr-1.5 shadow-sm">
            <span className="text-[11px] text-slate-300 font-mono">{displayAddr}</span>
            <div className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-indigo-500/20">
              <Wallet size={10} />
              Connected
            </div>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 rounded-full py-1.5 px-4 text-[10px] font-bold text-white uppercase tracking-wider transition-all hover:scale-[1.03]"
          >
            <Wallet size={11} />
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};
