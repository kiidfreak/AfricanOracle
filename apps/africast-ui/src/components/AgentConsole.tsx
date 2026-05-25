'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'lucide-react';

export interface LogEntry {
  id: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'data' | 'math';
}

const AGENT_COLORS: Record<string, string> = {
  system: 'text-slate-500',
  orchestrator: 'text-indigo-400',
  research: 'text-blue-400',
  hypothesis: 'text-amber-400',
  bayesian: 'text-purple-400',
  trader: 'text-emerald-400',
  trace: 'text-cyan-400',
};

// Realistic demo log sequences by category
const LOGS_BY_CATEGORY: Record<string, Omit<LogEntry, 'id'>[]> = {
  agriculture: [
    { agent: 'orchestrator', message: 'Intelligence cycle initiated — classifying intent: agriculture/food', type: 'info' },
    { agent: 'research', message: 'Querying KNBS maize wholesale prices...', type: 'info' },
    { agent: 'research', message: 'Found: Nairobi maize 90kg bag → KES 4,850 (+12.3% YoY)', type: 'data' },
    { agent: 'research', message: 'Querying EAGC Unga retail pricing...', type: 'info' },
    { agent: 'research', message: 'Found: 2kg Unga flour KES 168 → trending toward KES 185', type: 'data' },
    { agent: 'research', message: 'Querying CHIRPS rainfall for Rift Valley...', type: 'info' },
    { agent: 'research', message: 'Found: Rainfall deficit −1.8σ below 30yr mean', type: 'data' },
    { agent: 'research', message: 'Querying fertilizer import costs (DAP/CAN)...', type: 'info' },
    { agent: 'research', message: 'Found: DAP fertilizer +18% since Jan — supply squeeze', type: 'data' },
    { agent: 'orchestrator', message: '4 L1 signals gathered, deriving L2 supply dynamics', type: 'success' },
    { agent: 'hypothesis', message: 'Counter-thesis: "Gov subsidy caps flour at KES 180"', type: 'info' },
    { agent: 'hypothesis', message: 'Counter probability: 0.33 — disagreement: 0.34 (HIGH)', type: 'data' },
    { agent: 'bayesian', message: 'Prior: P(H) = 0.53 (crowd opinion on Polymarket)', type: 'math' },
    { agent: 'bayesian', message: 'Signal 1 (drought) → P(H) = 0.53 → 0.64', type: 'math' },
    { agent: 'bayesian', message: 'Signal 2 (fertilizer costs) → P(H) = 0.64 → 0.71', type: 'math' },
    { agent: 'bayesian', message: 'Signal 3 (gov subsidy counter) → P(H) = 0.71 → 0.67', type: 'math' },
    { agent: 'bayesian', message: 'Final posterior: P(H) = 0.67 | Confidence: 0.79', type: 'success' },
    { agent: 'trader', message: 'Edge = +14.0% vs crowd (0.53) → actionable signal', type: 'success' },
    { agent: 'trace', message: 'Hashing reasoning trace → keccak256', type: 'info' },
    { agent: 'trace', message: 'Publishing to Arc Testnet...', type: 'info' },
    { agent: 'trace', message: 'Tx confirmed — reasoning is now verifiable on-chain ✓', type: 'success' },
  ],
  macro: [
    { agent: 'orchestrator', message: 'Intelligence cycle initiated — classifying intent: macro/monetary', type: 'info' },
    { agent: 'research', message: 'Querying KNBS May Inflation data...', type: 'info' },
    { agent: 'research', message: 'Found: Inflation dropped to 5.0% YoY (prior: 5.6%)', type: 'data' },
    { agent: 'research', message: 'Querying CBK interest rates...', type: 'info' },
    { agent: 'research', message: 'Found: MPC holds lending rate at 13.0%', type: 'data' },
    { agent: 'research', message: 'Querying NSE 20 Share Index history...', type: 'info' },
    { agent: 'research', message: 'Found: Index climbs 1.2% on eased macro pressure', type: 'data' },
    { agent: 'orchestrator', message: '3 L1 signals gathered, deriving L2 macro trends', type: 'success' },
    { agent: 'hypothesis', message: 'Counter-thesis: "Rising public debt servicing costs force rate hike"', type: 'info' },
    { agent: 'hypothesis', message: 'Counter probability: 0.28 — disagreement: 0.22 (LOW)', type: 'data' },
    { agent: 'bayesian', message: 'Prior: P(H) = 0.44 (MPC rate cut crowd sentiment)', type: 'math' },
    { agent: 'bayesian', message: 'Signal 1 (inflation drop) → P(H) = 0.44 → 0.54', type: 'math' },
    { agent: 'bayesian', message: 'Signal 2 (MPC hold) → P(H) = 0.54 → 0.61', type: 'math' },
    { agent: 'bayesian', message: 'Signal 3 (debt service counter) → P(H) = 0.61 → 0.58', type: 'math' },
    { agent: 'bayesian', message: 'Final posterior: P(H) = 0.58 | Confidence: 0.86', type: 'success' },
    { agent: 'trader', message: 'Edge = +14.0% vs crowd (0.44) → actionable signal', type: 'success' },
    { agent: 'trace', message: 'Hashing reasoning trace → keccak256', type: 'info' },
    { agent: 'trace', message: 'Publishing to Arc Testnet...', type: 'info' },
    { agent: 'trace', message: 'Tx confirmed — reasoning is now verifiable on-chain ✓', type: 'success' },
  ],
  fx: [
    { agent: 'orchestrator', message: 'Intelligence cycle initiated — classifying intent: fx/currency', type: 'info' },
    { agent: 'research', message: 'Querying USD/KES spot exchange rates...', type: 'info' },
    { agent: 'research', message: 'Found: Spot at 157.8 KES/USD (+4.2% QoQ depreciation)', type: 'data' },
    { agent: 'research', message: 'Querying Central Bank of Kenya FX reserves...', type: 'info' },
    { agent: 'research', message: 'Found: Reserves decreased to $7.2B (−8% YTD)', type: 'data' },
    { agent: 'orchestrator', message: '2 L1 signals gathered, deriving L2 currency outlook', type: 'success' },
    { agent: 'hypothesis', message: 'Counter-thesis: "IMF Disbursement bolsters reserves next week"', type: 'info' },
    { agent: 'hypothesis', message: 'Counter probability: 0.45 — disagreement: 0.38 (HIGH)', type: 'data' },
    { agent: 'bayesian', message: 'Prior: P(H) = 0.22 (crowd USD/KES breach 140)', type: 'math' },
    { agent: 'bayesian', message: 'Signal 1 (USD/KES spot) → P(H) = 0.22 → 0.32', type: 'math' },
    { agent: 'bayesian', message: 'Signal 2 (CBK FX reserves) → P(H) = 0.32 → 0.38', type: 'math' },
    { agent: 'bayesian', message: 'Signal 3 (IMF funding counter) → P(H) = 0.38 → 0.34', type: 'math' },
    { agent: 'bayesian', message: 'Final posterior: P(H) = 0.34 | Confidence: 0.77', type: 'success' },
    { agent: 'trader', message: 'Edge = +12.0% vs crowd (0.22) → actionable signal', type: 'success' },
    { agent: 'trace', message: 'Hashing reasoning trace → keccak256', type: 'info' },
    { agent: 'trace', message: 'Publishing to Arc Testnet...', type: 'info' },
    { agent: 'trace', message: 'Tx confirmed — reasoning is now verifiable on-chain ✓', type: 'success' },
  ],
  equities: [
    { agent: 'orchestrator', message: 'Intelligence cycle initiated — classifying intent: equities/corporate', type: 'info' },
    { agent: 'research', message: 'Querying NSE corporate filings for NCBA Group...', type: 'info' },
    { agent: 'research', message: 'Found: Dividend recommendation of KSh 3.00 final dividend', type: 'data' },
    { agent: 'research', message: 'Querying Business Daily for Nedbank regional banking news...', type: 'info' },
    { agent: 'research', message: 'Found: Nedbank & NCBA regional synergy talks progressing', type: 'data' },
    { agent: 'research', message: 'Querying Crown Paints AGM corporate notices...', type: 'info' },
    { agent: 'research', message: 'Found: Target revenue growth target KES 4.0B', type: 'data' },
    { agent: 'research', message: 'Querying NSE Banking Sector Index trends...', type: 'info' },
    { agent: 'research', message: 'Found: Banking index climbs 3.5% on positive dividend yields', type: 'data' },
    { agent: 'orchestrator', message: '4 L1 signals gathered, deriving L2 equity performance', type: 'success' },
    { agent: 'hypothesis', message: 'Counter-thesis: "Credit risk/bad loan provisions from regional subsidiaries"', type: 'info' },
    { agent: 'hypothesis', message: 'Counter probability: 0.30 — disagreement: 0.15 (LOW)', type: 'data' },
    { agent: 'bayesian', message: 'Prior: P(H) = 0.50 (crowd sentiment baseline)', type: 'math' },
    { agent: 'bayesian', message: 'Signal 1 (dividend approvals) → P(H) = 0.50 → 0.58', type: 'math' },
    { agent: 'bayesian', message: 'Signal 2 (regional synergy) → P(H) = 0.58 → 0.63', type: 'math' },
    { agent: 'bayesian', message: 'Signal 3 (revenue growth) → P(H) = 0.63 → 0.67', type: 'math' },
    { agent: 'bayesian', message: 'Signal 4 (banking index) → P(H) = 0.67 → 0.71', type: 'math' },
    { agent: 'bayesian', message: 'Signal 5 (subsidiary credit risk counter) → P(H) = 0.71 → 0.69', type: 'math' },
    { agent: 'bayesian', message: 'Final posterior: P(H) = 0.69 | Confidence: 0.86', type: 'success' },
    { agent: 'trader', message: 'Edge = +19.0% vs crowd (0.50) → actionable signal', type: 'success' },
    { agent: 'trace', message: 'Hashing reasoning trace → keccak256', type: 'info' },
    { agent: 'trace', message: 'Publishing to Arc Testnet...', type: 'info' },
    { agent: 'trace', message: 'Tx confirmed — reasoning is now verifiable on-chain ✓', type: 'success' },
  ],
};

const classifyCategory = (question: string): string => {
  const q = question.toLowerCase();
  if (['maize', 'unga', 'flour', 'wheat', 'food', 'crop', 'harvest', 'drought'].some(k => q.includes(k))) {
    return 'agriculture';
  }
  if (['cbk', 'rate', 'mpc', 'inflation', 'cpi', 'monetary'].some(k => q.includes(k))) {
    return 'macro';
  }
  if (['kes', 'usd', 'shilling', 'forex', 'fx', 'dollar', 'exchange'].some(k => q.includes(k))) {
    return 'fx';
  }
  if (['nedbank', 'ncba', 'crown paints', 'dividend', 'agm', 'nse', 'equity', 'shares', 'stock', 'corporate'].some(k => q.includes(k))) {
    return 'equities';
  }
  return 'agriculture';
};

interface Props {
  isRunning: boolean;
  question?: string;
  onComplete?: () => void;
}

export const AgentConsole = ({ isRunning, question, onComplete }: Props) => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '0', agent: 'system', message: 'AfricaCast pipeline ready. Awaiting question.', type: 'info' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!isRunning) return;

    // Clear previous timeouts
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];

    // Reset logs to initial step and identify category
    const category = question ? classifyCategory(question) : 'agriculture';
    const categoryLogs = LOGS_BY_CATEGORY[category] || LOGS_BY_CATEGORY.agriculture;

    setLogs([
      { id: 'init', agent: 'system', message: `Initializing intelligence cycle for classified intent: ${category.toUpperCase()}`, type: 'info' }
    ]);

    // Stream logs with realistic timing
    categoryLogs.forEach((log, i) => {
      const delay = 400 + i * 350 + (log.type === 'data' ? 200 : 0);
      const t = setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { ...log, id: `${Date.now()}-${i}` },
        ]);
        if (i === categoryLogs.length - 1) {
          onComplete?.();
        }
      }, delay);
      timeoutRef.current.push(t);
    });

    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, [isRunning, question, onComplete]);

  return (
    <div className="flex flex-col h-full bg-[#080c16] border border-slate-800/60 rounded-xl overflow-hidden">
      <div className="bg-[#0a0f1a] px-4 py-2 border-b border-slate-800/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            Agent Logic Stream
          </span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/40" />
          <div className="w-2 h-2 rounded-full bg-amber-500/40" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-fade-in-up py-0.5">
            <span className={`uppercase font-bold shrink-0 w-20 text-right ${AGENT_COLORS[log.agent] || 'text-slate-500'}`}>
              {log.agent}
            </span>
            <span className="text-slate-700 shrink-0">│</span>
            <span className={
              log.type === 'data' ? 'text-cyan-300/90' :
              log.type === 'math' ? 'text-purple-300/90' :
              log.type === 'success' ? 'text-emerald-300/90' :
              'text-slate-400'
            }>
              {log.message}
            </span>
          </div>
        ))}
        {isRunning && (
          <div className="flex gap-2 py-0.5">
            <span className="w-20" />
            <span className="text-slate-700 shrink-0">│</span>
            <span className="cursor-blink text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
};
