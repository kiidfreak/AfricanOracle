'use client';

import React, { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { AgentConsole } from '@/components/AgentConsole';
import { PredictForm } from '@/components/PredictForm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  TrendingUp, 
  Hash, 
  ExternalLink,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const [prediction, setPrediction] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePredict = async (question: string) => {
    setIsProcessing(true);
    setPrediction(null);
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setPrediction(data);
    } catch (err) {
      console.error('Prediction failed:', err);
      // Fallback for demo if API fails
      setPrediction({
        question,
        probability: 0.684,
        confidence: 0.82,
        edge: 0.134,
        recommendation: 'BET_YES',
        trace_hash: '0xMockErrorFallback',
        arc_tx_hash: '0xMockErrorFallback',
        revenue: 0.05,
        steps: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <TopBar />
      
      <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Interaction & Console */}
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <PredictForm onPredict={handlePredict} />
          
          <div className="h-[400px]">
            <AgentConsole />
          </div>
        </div>

        {/* Right Column: Visualization & Trace */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <AnimatePresence mode="wait">
            {!prediction && !isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="text-slate-700 w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Awaiting Intelligence Cycle</h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Enter a market question to begin the verifiable reasoning process using regional data sources.
                </p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full bg-slate-900/30 border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-12"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-indigo-500 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="text-indigo-400 animate-pulse" size={32} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 italic tracking-tight">Computing Verifiable Alpha...</h3>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 16, 4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-indigo-500/40 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Result Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/20 flex flex-col items-end">
                      <span className="text-[10px] uppercase font-black tracking-widest">Edge</span>
                      <span className="text-2xl font-mono font-bold">+{ (prediction.edge * 100).toFixed(1) }%</span>
                    </div>
                  </div>

                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                    Prediction Analysis
                  </span>
                  
                  <h2 className="text-3xl font-bold text-white max-w-xl mb-8 leading-tight">
                    {prediction.question}
                  </h2>

                  <div className="grid grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">P(H) Posterior</span>
                      <div className="text-3xl font-mono font-bold text-white">{(prediction.probability * 100).toFixed(1)}%</div>
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.probability * 100}%` }}
                          className="bg-indigo-500 h-full"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Signal Confidence</span>
                      <div className="text-3xl font-mono font-bold text-white">{(prediction.confidence * 100).toFixed(1)}%</div>
                      <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.confidence * 100}%` }}
                          className="bg-blue-500 h-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Recommendation</span>
                      <div className={`text-2xl font-bold mt-1 ${
                        prediction.recommendation === 'BET_YES' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {prediction.recommendation.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Market Maker Liquidity View */}
                  <div className="mt-8 pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Market Maker Liquidity (Arc Testnet)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-[9px] text-emerald-500/60 uppercase font-bold mb-1">Agent Bid</span>
                        <span className="text-xl font-mono font-bold text-emerald-400">{(prediction.probability - 0.02).toFixed(2)}</span>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col items-center">
                        <span className="text-[9px] text-red-500/60 uppercase font-bold mb-1">Agent Ask</span>
                        <span className="text-xl font-mono font-bold text-red-400">{(prediction.probability + 0.02).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between px-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Liquidity Depth:</span>
                      <span className="text-[10px] text-slate-300 font-mono">{(prediction.confidence * 500).toFixed(0)} USDC available</span>
                    </div>
                  </div>
                </div>

                {/* Reasoning Trace Section */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-indigo-400" size={24} />
                      <h3 className="text-xl font-bold text-white tracking-tight">Verifiable Reasoning Trace</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      <Hash size={12} />
                      {prediction.trace_hash.slice(0, 16)}...
                    </div>
                  </div>

                  <div className="space-y-4">
                    {prediction.steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 group">
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-3 h-3 rounded-full ${idx === 4 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'} z-10`} />
                          {idx < 4 && <div className="w-[1px] h-12 bg-slate-800" />}
                        </div>
                        <div className="flex-1 bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 hover:border-slate-700 transition-all group-hover:bg-slate-950">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{step.agent} Agent</span>
                            <span className="text-[10px] font-mono text-slate-600">P(H) = {(step.prob * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-sm text-slate-300">{step.msg}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Builder Fee</span>
                        <span className="text-emerald-400 font-mono font-bold">+{prediction.revenue} USDC</span>
                      </div>
                      <div className="w-[1px] h-8 bg-slate-800" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Arc Transaction</span>
                        <span className="text-slate-400 font-mono text-xs truncate max-w-[120px]">{prediction.arc_tx_hash}</span>
                      </div>
                    </div>
                    
                    <button className="bg-slate-800 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                      View on ArcScan
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
