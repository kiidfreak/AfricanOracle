'use client';

import React from 'react';
import {
  ShieldCheck,
  Hash,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Scale,
  BrainCircuit,
  Link2,
} from 'lucide-react';

interface Props {
  prediction: any;
}

export const ResultPanel = ({ prediction }: Props) => {
  const prob = prediction.probability ?? 0.602;
  const conf = prediction.confidence ?? 0.775;
  const edge = prediction.edge ?? 0.102;
  const rec = prediction.recommendation ?? 'BET_YES';
  const traceHash = prediction.trace_hash ?? '0x' + 'a'.repeat(64);
  const txHash = prediction.arc_tx_hash ?? '0x' + 'b'.repeat(64);
  const question = prediction.question ?? '';

  // ── Bayesian belief steps: use live trace or fall back to demo ────────────
  const rawSteps: any[] = prediction.steps ?? [];
  const BELIEF_STEPS = rawSteps.length > 0
    ? [
        { label: 'Prior (crowd opinion)', prob: rawSteps[0]?.prior_prob ?? 0.50, insight: 'What the market thinks today' },
        ...rawSteps.map((s: any) => ({
          label: s.signal_name,
          prob: s.posterior_prob,
          delta: s.effective_impact > 0
            ? `+${(s.effective_impact * 100).toFixed(1)}%`
            : `${(s.effective_impact * 100).toFixed(1)}%`,
          source: s.signal_name,
          direction: s.effective_impact >= 0 ? 'up' as const : 'down' as const,
          insight: s.narrative,
        })),
      ]
    : [
        { label: 'Prior (crowd opinion)', prob: 0.50, insight: 'What the market thinks today' },
        { label: 'Maize prices surge', prob: 0.559, delta: '+5.9%', source: 'KNBS', direction: 'up' as const, insight: 'Wholesale prices up 12.3% YoY' },
        { label: 'Drought pressure', prob: 0.597, delta: '+3.8%', source: 'CHIRPS', direction: 'up' as const, insight: 'Rainfall −1.8σ below 30yr mean' },
        { label: 'Fertilizer cost squeeze', prob: 0.625, delta: '+2.8%', source: 'KRA', direction: 'up' as const, insight: 'DAP imports up 18% since Jan' },
        { label: 'Govt subsidy', prob: 0.602, delta: '−2.3%', source: 'Hypothesis Agent', direction: 'down' as const, insight: 'Counter: subsidy caps flour at 180' },
      ];

  // ── Key signals: use live signals from prediction or demo ─────────────────
  const rawSignals: any[] = prediction.signals ?? [];
  const SIGNALS = rawSignals.length > 0
    ? rawSignals.map((s: any) => ({
        icon: s.value > 0
          ? <TrendingUp size={14} className="text-emerald-400" />
          : <TrendingDown size={14} className="text-red-400" />,
        name: s.name,
        source: s.source_id ?? 'AfricaCast',
        insight: s.narrative ?? `Value: ${s.value} ${s.unit ?? ''}`.trim(),
        color: s.value > 0 ? 'text-emerald-400' : 'text-red-400',
      }))
    : [
        { icon: <TrendingUp size={14} className="text-emerald-400" />, name: 'Maize prices +12.3% YoY', source: 'KNBS / EAGC', insight: 'Strong upward pressure on flour costs', color: 'text-emerald-400' },
        { icon: <TrendingDown size={14} className="text-red-400" />, name: 'Rainfall deficit −1.8σ', source: 'CHIRPS / FEWS NET', insight: 'Supply risk increasing — drought signal', color: 'text-red-400' },
        { icon: <TrendingUp size={14} className="text-amber-400" />, name: 'DAP fertilizer +18% YTD', source: 'Kenya Revenue Authority', insight: 'Future production costs rising', color: 'text-amber-400' },
        { icon: <Scale size={14} className="text-blue-400" />, name: 'Govt subsidy scenario', source: 'Hypothesis Agent', insight: 'Counter-force: caps flour at KES 180', color: 'text-blue-400' },
      ];

  return (
    <div className="space-y-4">
      {/* ══════ LAYER 1: DECISION ══════ */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-6 relative overflow-hidden">
        {/* Subtle glow behind probability */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit size={16} className="text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">
            AfricaCast Prediction
          </span>
        </div>

        <h2 className="text-lg font-semibold text-white mb-6 leading-snug">{question}</h2>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Probability</span>
            <div className="text-4xl font-bold text-white font-mono">{(prob * 100).toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Confidence</span>
            <div className="text-4xl font-bold text-white font-mono">{(conf * 100).toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Edge vs Crowd</span>
            <div className="text-4xl font-bold text-emerald-400 font-mono">+{(edge * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Recommendation badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
          rec === 'BET_YES'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : rec === 'BET_NO'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          <ArrowRight size={14} />
          Recommendation: {rec.replace('_', ' ')}
        </div>
      </div>

      {/* ══════ LAYER 1.5: MARKET vs AFRICAST ══════ */}
      <div className="bg-[#0c1120] border border-indigo-500/15 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <Scale size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">Market vs AfricaCast</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Market (crowd) */}
          <div className="bg-[#080c16] rounded-lg p-4 border border-slate-800/30">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Market (Crowd)</span>
            <div className="text-3xl font-mono font-bold text-slate-400">53.0%</div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-slate-600 rounded-full" style={{ width: '53%' }} />
            </div>
          </div>

          {/* AfricaCast */}
          <div className="bg-[#080c16] rounded-lg p-4 border border-indigo-500/15">
            <span className="text-[9px] text-indigo-400/80 uppercase font-bold tracking-wider block mb-2">AfricaCast</span>
            <div className="text-3xl font-mono font-bold text-white">{(prob * 100).toFixed(1)}%</div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" style={{ width: `${prob * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Mispricing badge */}
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">
              +{(edge * 100).toFixed(1)}% mispricing detected
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">
            crowd is underpricing this event
          </span>
        </div>
      </div>

      {/* ══════ LAYER 2: KEY SIGNALS ══════ */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">Key Signals</span>
          <span className="ml-auto text-[9px] text-slate-600 font-mono">{SIGNALS.length} signals ingested</span>
        </div>

        <div className="space-y-3">
          {SIGNALS.map((sig, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#080c16] rounded-lg p-3 border border-slate-800/30">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center border border-slate-800/50 shrink-0 mt-0.5">
                {sig.icon}
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-slate-200">{sig.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{sig.insight}</div>
                <div className="text-[9px] text-slate-600 mt-1 font-mono">{sig.source}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ LAYER 3: BAYESIAN BELIEF UPDATE (THE MAGIC) ══════ */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <BrainCircuit size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-slate-300">Belief Update</span>
          <span className="ml-auto text-[9px] text-slate-500">Each signal shifts probability</span>
        </div>

        <div className="space-y-1">
          {BELIEF_STEPS.map((step, i) => (
            <div key={i}>
              {/* Step row */}
              <div className="flex items-center gap-3 py-2">
                {/* Delta badge */}
                <div className="w-14 shrink-0 text-right">
                  {i === 0 ? (
                    <span className="text-[10px] text-slate-600 font-mono">START</span>
                  ) : (
                    <span className={`text-[13px] font-mono font-bold ${
                      step.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {step.delta}
                    </span>
                  )}
                </div>

                {/* Label + insight */}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-200">{step.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{step.insight}</div>
                </div>

                {/* Probability */}
                <span className="text-[13px] font-mono font-bold text-white shrink-0 w-14 text-right">
                  {(step.prob * 100).toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden ml-17">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    i === 0
                      ? 'bg-slate-600'
                      : step.direction === 'down'
                      ? 'bg-gradient-to-r from-purple-600 to-red-500'
                      : 'bg-gradient-to-r from-indigo-600 to-emerald-500'
                  }`}
                  style={{ width: `${step.prob * 100}%` }}
                />
              </div>

              {/* Connector */}
              {i < BELIEF_STEPS.length - 1 && (
                <div className="flex items-center gap-2 py-0.5 pl-14">
                  <div className="w-px h-3 bg-slate-800 ml-0.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Final result */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Final Posterior</span>
          <span className="text-xl font-mono font-bold text-white">
            {(BELIEF_STEPS[BELIEF_STEPS.length - 1].prob * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* ══════ LAYER 4: VERIFIABILITY ══════ */}
      <div className="bg-[#0c1120] border border-slate-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={14} className="text-cyan-400" />
          <span className="text-xs font-bold text-slate-300">Verifiable Trace</span>
          <CheckCircle2 size={12} className="text-emerald-400 ml-1" />
          <span className="text-[9px] text-emerald-400/80 font-mono">recorded on Arc Testnet</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#080c16] rounded-lg p-3 border border-slate-800/30">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Trace Hash</span>
            <div className="flex items-center gap-1.5">
              <Hash size={11} className="text-slate-600" />
              <span className="text-[11px] font-mono text-slate-400 truncate">{traceHash.slice(0, 22)}...</span>
            </div>
          </div>
          <div className="bg-[#080c16] rounded-lg p-3 border border-slate-800/30">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">On-Chain Record</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-slate-600" />
              <span className="text-[11px] font-mono text-slate-400 truncate">{txHash.slice(0, 22)}...</span>
            </div>
          </div>
        </div>

        <button className="mt-3 w-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 py-2 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-800/40">
          View on ArcScan
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};
