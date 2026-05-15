'use client';

import React from 'react';
import { ShieldCheck, Hash, ExternalLink, CheckCircle2 } from 'lucide-react';

interface Props {
  prediction: any;
}

const TRACE_STEPS = [
  { agent: 'Research', signal: 'Rift Valley Rainfall Deficit (−1.8σ)', quality: 0.85, impact: '+0.280', priorProb: '53.0%', postProb: '64.0%' },
  { agent: 'Research', signal: 'DAP Fertilizer Costs +18% YTD', quality: 0.78, impact: '+0.190', priorProb: '64.0%', postProb: '71.0%' },
  { agent: 'Hypothesis', signal: 'Counter: Gov Subsidy Caps Flour at 180', quality: 0.65, impact: '−0.150', priorProb: '71.0%', postProb: '67.0%' },
];

export const ResultPanel = ({ prediction }: Props) => {
  const prob = prediction.probability ?? 0.684;
  const conf = prediction.confidence ?? 0.82;
  const edge = prediction.edge ?? 0.134;
  const rec = prediction.recommendation ?? 'BET_YES';
  const traceHash = prediction.trace_hash ?? '0x' + 'a'.repeat(64);
  const txHash = prediction.arc_tx_hash ?? '0x' + 'b'.repeat(64);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Probability result */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Posterior Probability</span>
            <div className="text-4xl font-bold text-white font-mono mt-1">{(prob * 100).toFixed(1)}%</div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/60">Edge vs Market</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">+{(edge * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Probability bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000"
            style={{ width: `${prob * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Confidence</span>
            <div className="text-lg font-mono font-bold text-slate-200">{(conf * 100).toFixed(0)}%</div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Recommendation</span>
            <div className={`text-lg font-bold ${rec === 'BET_YES' ? 'text-emerald-400' : rec === 'BET_NO' ? 'text-red-400' : 'text-slate-400'}`}>
              {rec.replace('_', ' ')}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Signals Used</span>
            <div className="text-lg font-mono font-bold text-slate-200">3</div>
          </div>
        </div>
      </div>

      {/* Bayesian Trace */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">Reasoning Trace</span>
          <span className="ml-auto text-[9px] font-mono text-slate-600 flex items-center gap-1">
            <Hash size={9} />
            {traceHash.slice(0, 14)}...
          </span>
        </div>

        <div className="space-y-2">
          {TRACE_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#080c16] rounded-lg p-3 border border-slate-800/30">
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-indigo-400/80">{step.agent}</span>
                  <span className="text-[11px] text-slate-300 truncate">{step.signal}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] font-mono text-slate-500">
                  <span>q={step.quality}</span>
                  <span className={step.impact.startsWith('−') ? 'text-red-400/70' : 'text-emerald-400/70'}>
                    Δ={step.impact}
                  </span>
                  <span>P(H): {step.priorProb} → <strong className="text-slate-300">{step.postProb}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On-chain proof */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Arc Testnet Transaction</span>
            <div className="text-xs font-mono text-slate-400 mt-0.5">{txHash.slice(0, 22)}...</div>
          </div>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5">
          ArcScan
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};
