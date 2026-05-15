'use client';

import React, { useState } from 'react';
import { Search, Play } from 'lucide-react';

const SUGGESTIONS = [
  'Will Unga maize flour price hit KSh 185 by end of Q3?',
  'Will KES weaken past 160 against USD within 30 days?',
  'Will CBK raise rates by >=50bps at the next MPC meeting?',
];

export const PredictForm = ({ onPredict, disabled }: { onPredict: (q: string) => void; disabled?: boolean }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || disabled) return;
    onPredict(question);
  };

  const handleSuggestion = (q: string) => {
    if (disabled) return;
    setQuestion(q);
    onPredict(q);
  };

  return (
    <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search size={14} className="text-indigo-400" />
        <span className="text-xs font-bold text-slate-300">Ask a market question</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Will Unga price hit KSh 185 by Q3?"
          disabled={disabled}
          className="w-full bg-[#080c16] border border-slate-800/60 rounded-lg py-3 px-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!question || disabled}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Play size={14} fill="currentColor" />
          Run Intelligence Cycle
        </button>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestion(s)}
              disabled={disabled}
              className="text-[10px] bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-400/80 border border-indigo-500/15 px-2 py-1 rounded transition-all disabled:opacity-40 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
