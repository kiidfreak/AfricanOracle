'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Cpu, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LogEntry {
  id: string;
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export const AgentConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    addLog('system', 'AfricaCast 5-Agent Pipeline initialized.', 'info');
    addLog('orchestrator', 'Awaiting market question input...', 'info');
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (agent: string, message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      agent,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Agent Logic Stream</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-amber-500/50" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 border-l border-slate-800 pl-3 py-0.5"
            >
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={`uppercase font-black shrink-0 ${
                log.agent === 'orchestrator' ? 'text-indigo-400' :
                log.agent === 'research' ? 'text-blue-400' :
                log.agent === 'hypothesis' ? 'text-amber-400' :
                log.agent === 'trader' ? 'text-emerald-400' :
                'text-slate-500'
              }`}>
                {log.agent}
              </span>
              <span className={`${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-amber-300' :
                log.type === 'success' ? 'text-emerald-400' :
                'text-slate-300'
              }`}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
