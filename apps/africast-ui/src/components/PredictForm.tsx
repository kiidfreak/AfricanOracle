'use client';

import React, { useState } from 'react';
import { Search, Play, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const PredictForm = ({ onPredict }: { onPredict: (q: string) => void }) => {
  const [question, setQuestion] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setIsSimulating(true);
    onPredict(question);
    // Simulation state is handled by the parent/orchestrator
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Search className="text-indigo-400" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Market Intelligence</h2>
          <p className="text-xs text-slate-500">Query regional data via the AfricaCast 5-Agent pipeline.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Will maize prices in Nairobi rise >5% next month?"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
              GPT-4o + Bayesian
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!question || isSimulating}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            <Play size={18} fill="currentColor" />
            Execute Intelligence Cycle
          </button>
          
          <button
            type="button"
            className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            Simulate
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[10px] text-slate-500 uppercase font-bold pt-1 mr-1">Suggestions:</span>
          {[
            { label: 'Will maize prices rise >5% in Nairobi next month?', q: 'Will maize prices rise >5% in Nairobi next month?' },
            { label: 'Will CBK raise rates by >=50bps in the next MPC meeting?', q: 'Will CBK raise rates by >=50bps in the next MPC meeting?' },
            { label: 'Will USD/KES breach 160 within 30 days?', q: 'Will USD/KES breach 160 within 30 days?' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setQuestion(item.q);
                // Auto-trigger simulation
                onPredict(item.q);
                setIsSimulating(true);
              }}
              className="text-[10px] bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md transition-all whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
          <Info className="text-blue-400 shrink-0" size={16} />
          <p className="text-[11px] text-blue-300/80 leading-relaxed">
            <span className="font-bold text-blue-400 uppercase mr-1">Note:</span> 
            Execution triggers the 5-agent pipeline. Proof-of-thought hashes will be generated and published to the Arc Testnet using your ephemeral session identity.
          </p>
        </div>
      </form>
    </div>
  );
};
