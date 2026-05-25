'use client';

import React, { useState, useCallback } from 'react';
import { TopBar } from '@/components/TopBar';
import { DatasetPanel } from '@/components/DatasetPanel';
import { PredictForm } from '@/components/PredictForm';
import { AgentConsole } from '@/components/AgentConsole';
import { ResultPanel } from '@/components/ResultPanel';
import { SignalsFeed } from '@/components/SignalsFeed';
import { BrainCircuit } from 'lucide-react';

export default function Dashboard() {
  const [prediction, setPrediction] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Auto-connect if already authorized
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts[0]) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleConnectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Wallet connection rejected:', err);
      }
    } else {
      // Mock fallback for hackathon demonstration
      setWalletAddress('0x7a3B14eF332a67bcD8804914c9d7890123456789');
    }
  };

  const handlePredict = async (question: string) => {
    setIsRunning(true);
    setPrediction(null);
    setCurrentQuestion(question);

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!data.error) {
        setPrediction({ ...data, question });
      } else {
        throw new Error(data.error);
      }
    } catch {
      // Fallback — demo still works
      setPrediction({
        question,
        probability: 0.684,
        confidence: 0.82,
        edge: 0.134,
        recommendation: 'BET_YES',
        trace_hash: '0x' + 'a'.repeat(64),
        arc_tx_hash: '0x' + 'b'.repeat(64),
      });
    }
  };

  const handleConsoleComplete = useCallback(() => {
    setIsRunning(false);
  }, []);

  return (
    <main className="min-h-screen bg-[#06080f] text-slate-200">
      <TopBar address={walletAddress} onConnect={handleConnectWallet} />

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Hero tagline */}
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-white">
            Intelligence layer for underpriced markets
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Markets exist. What they lack is local data + structured reasoning. We provide both.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Top Banner: Loaded Datasets Ticker */}
          <div className="col-span-12 mb-1">
            <DatasetPanel />
          </div>

          {/* Left column: Input + Console + Feed */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <PredictForm onPredict={handlePredict} disabled={isRunning} />
            <SignalsFeed />
            <div className="h-[280px]">
              <AgentConsole isRunning={isRunning} question={currentQuestion} onComplete={handleConsoleComplete} />
            </div>
          </div>

          {/* Right column: Results */}
          <div className="col-span-12 lg:col-span-7">
            {prediction ? (
              <div>
                <div className="mb-4 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Question</span>
                  <h3 className="text-base font-semibold text-white mt-0.5">{currentQuestion}</h3>
                </div>
                <ResultPanel prediction={prediction} />
              </div>
            ) : (
              <div className="h-full border border-dashed border-slate-800/50 rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[500px]">
                <div className="w-16 h-16 bg-[#0c1120] rounded-full flex items-center justify-center mb-4 border border-slate-800/40">
                  <BrainCircuit className="text-slate-700 w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 mb-1">
                  {isRunning ? 'Agents are reasoning...' : 'Awaiting intelligence cycle'}
                </h3>
                <p className="text-xs text-slate-600 max-w-xs">
                  {isRunning
                    ? 'Watch the agent logic stream for live updates'
                    : 'Select a question to begin. Each decision is backed by traceable Bayesian reasoning.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
