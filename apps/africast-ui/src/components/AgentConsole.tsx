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

// Realistic demo log sequence for the maize question
export const DEMO_LOGS: Omit<LogEntry, 'id'>[] = [
  { agent: 'orchestrator', message: 'Intelligence cycle initiated — classifying intent: agriculture/food', type: 'info' },
  { agent: 'research', message: 'Querying KNBS maize wholesale prices...', type: 'info' },
  { agent: 'research', message: 'Found: Nairobi maize 90kg bag → KES 4,850 (+12.3% YoY)', type: 'data' },
  { agent: 'research', message: 'Querying EAGC Unga retail pricing...', type: 'info' },
  { agent: 'research', message: 'Found: 2kg Unga flour KES 168 → trending toward KES 185', type: 'data' },
  { agent: 'research', message: 'Querying CHIRPS rainfall for Rift Valley...', type: 'info' },
  { agent: 'research', message: 'Found: Rainfall deficit −1.8σ below 30yr mean', type: 'data' },
  { agent: 'research', message: 'Querying fertilizer import costs (DAP/CAN)...', type: 'info' },
  { agent: 'research', message: 'Found: DAP fertilizer +18% since Jan — supply squeeze', type: 'data' },
  { agent: 'research', message: '4 L1 signals gathered, deriving L2 supply dynamics', type: 'success' },
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
];

interface Props {
  isRunning: boolean;
  onComplete?: () => void;
}

export const AgentConsole = ({ isRunning, onComplete }: Props) => {
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

    // Stream logs with realistic timing
    DEMO_LOGS.forEach((log, i) => {
      const delay = 400 + i * 350 + (log.type === 'data' ? 200 : 0);
      const t = setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { ...log, id: `${Date.now()}-${i}` },
        ]);
        if (i === DEMO_LOGS.length - 1) {
          onComplete?.();
        }
      }, delay);
      timeoutRef.current.push(t);
    });

    return () => {
      timeoutRef.current.forEach(clearTimeout);
    };
  }, [isRunning, onComplete]);

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
