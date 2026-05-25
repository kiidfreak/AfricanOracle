'use client';

import React, { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { 
  Zap, 
  Check, 
  Globe, 
  Key, 
  Terminal, 
  Sliders, 
  Wallet, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Sparkles,
  Database,
  Lock,
  Loader2,
  Copy,
  CheckCircle2
} from 'lucide-react';

export default function PricingPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Subscription Modal states
  const [showSubModal, setShowSubModal] = useState(false);
  const [subStep, setSubStep] = useState<'idle' | 'approving' | 'paying' | 'confirmed'>('idle');
  const [subTxHash, setSubTxHash] = useState('');

  // Sandbox states
  const [sandboxKey, setSandboxKey] = useState('');
  const [sandboxQuestion, setSandboxQuestion] = useState('Will NCBA Group approve KSh 3.00 final dividend?');
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Whitelabel customizer states
  const [brandTitle, setBrandTitle] = useState('Delta Capital Oracles');
  const [accentColor, setAccentColor] = useState<'indigo' | 'violet' | 'emerald' | 'rose'>('indigo');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['macro', 'equities', 'fx']);

  // Auto-connect wallet if authorized
  useEffect(() => {
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
      setWalletAddress('0x7a3B14eF332a67bcD8804914c9d7890123456789');
    }
  };

  // Pricing calculations
  const prices = {
    developer: isAnnual ? 39 : 49,
    professional: isAnnual ? 159 : 199,
    whitelabel: isAnnual ? 719 : 899,
  };

  const handleSubscribeClick = (planName: string) => {
    setSelectedPlan(planName);
    setShowSubModal(true);
    setSubStep('idle');
  };

  const handleSimulateSubscription = async () => {
    if (!walletAddress) {
      await handleConnectWallet();
    }
    
    // Step 1: Approving USDC
    setSubStep('approving');
    await new Promise(r => setTimeout(r, 2000));

    // Step 2: Paying on-chain
    setSubStep('paying');
    await new Promise(r => setTimeout(r, 2500));

    // Step 3: Confirmed
    const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setSubTxHash(mockHash);
    setSubStep('confirmed');
  };

  const handleGenerateKey = () => {
    const randomHex = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setSandboxKey(`ac_sandbox_${randomHex}`);
    setCopiedKey(false);
  };

  const handleCopyKey = () => {
    if (sandboxKey) {
      navigator.clipboard.writeText(sandboxKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRunSandbox = async () => {
    if (!sandboxKey) {
      handleGenerateKey();
    }
    setSandboxLoading(true);
    setSandboxResult(null);

    // Simulate API query latency
    await new Promise(r => setTimeout(r, 1800));

    // Construct realistic API response based on question
    setSandboxResult({
      status: "success",
      query: sandboxQuestion,
      prediction: {
        prediction_id: "sandbox-pred-" + Math.floor(1000 + Math.random() * 9000),
        probability: 0.693,
        confidence: 0.856,
        edge: 0.193,
        recommendation: "BET_YES",
        trace_hash: "0x89fb37fc0875944d0c688e..."
      },
      signals_used: [
        { name: "CBK MPC Interest Rate Hold", source: "Central Bank of Kenya", quality: 0.94, impact: 0.18 },
        { name: "NSE Banking Sector Index Yields +3.5%", source: "NSE Corporate Filings", quality: 0.90, impact: 0.22 }
      ],
      arc_testnet_publication: {
        tx_hash: "0x73ba52f899150aa0eff55b...",
        status: "confirmed",
        gas_used: "84021"
      }
    });
    setSandboxLoading(false);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // Whitelabel accent color mapper
  const accentClasses = {
    indigo: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      glow: 'shadow-indigo-500/10',
      gradient: 'from-indigo-600 to-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    violet: {
      bg: 'bg-violet-600',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      glow: 'shadow-violet-500/10',
      gradient: 'from-violet-600 to-violet-400',
      badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/10',
      gradient: 'from-emerald-600 to-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    rose: {
      bg: 'bg-rose-600',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/10',
      gradient: 'from-rose-600 to-rose-400',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
  }[accentColor];

  return (
    <main className="min-h-screen bg-[#06080f] text-slate-200 pb-20">
      <TopBar address={walletAddress} onConnect={handleConnectWallet} />

      <div className="max-w-[1280px] mx-auto px-6 pt-12">
        {/* ── HERO BANNER ── */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-4 border border-indigo-500/20">
            <Sparkles size={11} />
            Data Access & White-labeled Dashboard Deployments
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl leading-none">
            AfricaCast SaaS Solutions
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Gain enterprise-grade API data access to verifiable local African market reasoning feeds. 
            Or launch a fully whitelabeled, custom-branded instance of our prediction platform for your fund.
          </p>
        </div>

        {/* ── PRICING TOGGLE ── */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-xs font-semibold ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
          <button 
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-11 h-6 bg-slate-800 rounded-full p-0.5 relative transition-colors cursor-pointer"
          >
            <div className={`w-5 h-5 bg-indigo-500 rounded-full shadow transition-transform ${
              isAnnual ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
            Annual billing
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </span>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          
          {/* Card 1: Developer */}
          <div className="bg-[#0c1120] border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Developer API</span>
                <Database size={16} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white">Sandbox Core</h3>
              <p className="text-xs text-slate-400 mt-1">Perfect for local research and market model prototype testing.</p>
              
              <div className="my-6">
                <span className="text-3xl font-bold text-white font-mono">${prices.developer}</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>

              <div className="h-px bg-slate-800/60 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>1,000 API Requests / Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Access to L1 Ingested Signals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Standard Bayesian trace payload</span>
                </li>
                <li className="flex items-center gap-2 text-slate-500">
                  <X size={14} className="shrink-0" />
                  <span>No on-chain oracle triggers</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribeClick('Developer API Sandbox')}
              className="mt-8 w-full bg-slate-800 hover:bg-slate-700/80 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Get Sandbox Access
            </button>
          </div>

          {/* Card 2: Professional (Featured) */}
          <div className="bg-[#0e1428] border border-indigo-500/30 rounded-2xl p-6 relative flex flex-col justify-between shadow-lg shadow-indigo-950/20 hover:border-indigo-500/50 transition-all">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Professional</span>
                <Zap size={16} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Trading Desk API</h3>
              <p className="text-xs text-slate-400 mt-1">Live market data for quant trading desks and active signal feeders.</p>
              
              <div className="my-6">
                <span className="text-3xl font-bold text-white font-mono">${prices.professional}</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>

              <div className="h-px bg-indigo-950/50 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>10,000 API Requests / Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>L1 + L2 Signals (Full Narrative)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Arc Testnet Oracle Direct Feeds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Real-time webhook alert triggers</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribeClick('Professional Trading Desk API')}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-md shadow-indigo-900/30 hover:scale-[1.02] cursor-pointer"
            >
              Subscribe with Wallet (USDC)
            </button>
          </div>

          {/* Card 3: Whitelabel / Enterprise */}
          <div className="bg-[#0c1120] border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enterprise</span>
                <Globe size={16} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Whitelabel Portal</h3>
              <p className="text-xs text-slate-400 mt-1">Deploy AfricaCast under your brand for your clients & fund partners.</p>
              
              <div className="my-6">
                <span className="text-3xl font-bold text-white font-mono">${prices.whitelabel}</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>

              <div className="h-px bg-slate-800/60 my-6" />

              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Unlimited API Inquiries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Custom Whitelabel subdomain deployment</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Custom Data Collectors (e.g. your private sheets)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-400 shrink-0" />
                  <span>Dedicated node & database resources</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribeClick('Enterprise Whitelabel Portal')}
              className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
            >
              Request Custom Deploy
            </button>
          </div>

        </div>

        {/* ── INTERACTIVE AREA GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          
          {/* LEFT: API SANDBOX (5 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-[#0a0f1a] border border-slate-800/70 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Developer Sandbox</h2>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4">
              Get an instant sandbox key and simulate querying our L2 prediction engine.
            </p>

            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={sandboxKey} 
                readOnly
                placeholder="Click generate to get an API Key"
                className="flex-1 bg-[#06080f] border border-slate-800/80 rounded-lg px-3 py-2 text-[10px] font-mono text-indigo-400 focus:outline-none placeholder-slate-600"
              />
              <button 
                onClick={handleGenerateKey}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Generate Key
              </button>
              {sandboxKey && (
                <button 
                  onClick={handleCopyKey}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg shrink-0 cursor-pointer"
                  title="Copy Key"
                >
                  {copiedKey ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              )}
            </div>

            {/* Input query field */}
            <div className="space-y-2 mb-4">
              <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Question Payload</label>
              <input 
                type="text" 
                value={sandboxQuestion}
                onChange={(e) => setSandboxQuestion(e.target.value)}
                className="w-full bg-[#06080f] border border-slate-800/80 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-slate-700"
              />
            </div>

            <button 
              onClick={handleRunSandbox}
              disabled={sandboxLoading}
              className="w-full bg-slate-800 hover:bg-slate-700/80 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {sandboxLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-indigo-400" />
                  Running cycle...
                </>
              ) : (
                <>
                  <Terminal size={13} className="text-indigo-400" />
                  Test API Request
                </>
              )}
            </button>

            {/* API Console View */}
            <div className="mt-4 bg-[#06080f] border border-slate-850 rounded-xl overflow-hidden">
              <div className="bg-[#080d16] px-3 py-1.5 border-b border-slate-850 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500">API Response Console</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-indigo-400" />
                </span>
              </div>
              <pre className="p-3 font-mono text-[9px] text-cyan-300/80 overflow-auto max-h-[180px] leading-relaxed">
                {sandboxResult ? (
                  JSON.stringify(sandboxResult, null, 2)
                ) : sandboxLoading ? (
                  `POST /v1/predict HTTP/1.1\nHost: api.africast.io\nAuthorization: Bearer ${sandboxKey || 'ac_sandbox_...'}\n\nLoading reasoning stream from Arc network...`
                ) : (
                  `// Press "Test API Request" to see structured JSON payload output.`
                )}
              </pre>
            </div>
          </div>

          {/* RIGHT: WHITELABEL CUSTOMIZER (7 cols) */}
          <div className="col-span-12 lg:col-span-6 bg-[#0a0f1a] border border-slate-800/70 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sliders size={14} className="text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">White-labeled Portal Builder</h2>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4">
              Instantly customize colors, branding, and active markets for your private client deployment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Controls */}
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Portal Name</label>
                  <input 
                    type="text" 
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value)}
                    className="w-full bg-[#06080f] border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Theme Accent Color</label>
                  <div className="flex gap-2.5 mt-1.5">
                    {(['indigo', 'violet', 'emerald', 'rose'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-transform ${
                          color === 'indigo' ? 'bg-indigo-600 border-indigo-400' :
                          color === 'violet' ? 'bg-violet-600 border-violet-400' :
                          color === 'emerald' ? 'bg-emerald-600 border-emerald-400' :
                          'bg-rose-600 border-rose-400'
                        } ${accentColor === color ? 'scale-110 ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-[#06080f]' : ''}`}
                      >
                        {accentColor === color && <Check size={10} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">Active Markets</label>
                  <div className="space-y-1">
                    {['macro', 'equities', 'fx', 'agriculture', 'energy'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                        <input 
                          type="checkbox" 
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="rounded border-slate-800 bg-[#06080f] text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3"
                        />
                        <span className="capitalize">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mock Dashboard Preview */}
              <div className="bg-[#06080f] border border-slate-850 rounded-xl p-3 shadow-inner flex flex-col justify-between min-h-[220px]">
                
                {/* Header preview */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 ${accentClasses.bg} rounded flex items-center justify-center shrink-0`}>
                      <Zap className="text-white w-2 h-2" />
                    </div>
                    <span className="text-[9px] font-bold text-white truncate max-w-[100px]">{brandTitle}</span>
                  </div>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded font-mono ${accentClasses.badge}`}>
                    Client Node Live
                  </span>
                </div>

                {/* Simulated Feed preview */}
                <div className="my-3 flex-1 flex flex-col gap-1.5">
                  <span className="text-[7px] text-slate-500 uppercase tracking-wider block">Ingested Signals</span>
                  
                  {/* Signals representation */}
                  {selectedCategories.length > 0 ? (
                    selectedCategories.slice(0, 2).map((cat, idx) => (
                      <div key={idx} className="bg-[#0a0f1a]/85 border border-slate-850 rounded p-1.5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-slate-200 truncate capitalize">{cat} Index Feed</span>
                          <span className="text-[6px] text-slate-500 font-mono">source_id: {cat}-feed-node</span>
                        </div>
                        <span className={`text-[8px] font-mono font-bold ${accentClasses.text}`}>+{(2.1 + idx * 1.5).toFixed(1)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-center border border-dashed border-slate-800/40 rounded p-4">
                      <Lock size={12} className="text-slate-600 mb-1" />
                      <span className="text-[7px] text-slate-500">No active markets enabled.</span>
                    </div>
                  )}
                </div>

                {/* Subdomain address bar */}
                <div className="bg-[#0c1120] rounded border border-slate-850 px-2 py-1 flex items-center justify-between">
                  <span className="text-[7px] text-slate-400 font-mono">
                    https://{brandTitle.toLowerCase().replace(/[^a-z0-9]/g, '') || 'brand'}.africast.io
                  </span>
                  <ArrowRight size={8} className={accentClasses.text} />
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ── SUBSCRIPTION TRANSACTION MODAL ── */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0f1a] border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative overflow-hidden shadow-2xl">
            
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setShowSubModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-white mb-2">Subscribe to {selectedPlan}</h3>
            <p className="text-xs text-slate-400 mb-6">
              Complete on-chain approval to activate your data feed credentials using Arc Testnet USDC.
            </p>

            {/* Steps Visualizer */}
            <div className="space-y-4 mb-6">
              
              {/* Step 1: Connection */}
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  walletAddress ? 'bg-indigo-500 text-white' : 'bg-slate-850 text-slate-500'
                }`}>
                  {walletAddress ? <Check size={10} /> : '1'}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-200">Connect Payment Wallet</div>
                  <div className="text-[9px] text-slate-500 font-mono truncate max-w-[240px]">
                    {walletAddress ? `Address: ${walletAddress}` : 'Awaiting connection...'}
                  </div>
                </div>
              </div>

              {/* Step 2: Allowance Approval */}
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  subStep === 'approving' ? 'bg-indigo-500 text-white' : 
                  subStep === 'paying' || subStep === 'confirmed' ? 'bg-emerald-500 text-white' : 
                  'bg-slate-850 text-slate-500'
                }`}>
                  {subStep === 'approving' ? <Loader2 size={10} className="animate-spin" /> : 
                   subStep === 'paying' || subStep === 'confirmed' ? <Check size={10} /> : '2'}
                </div>
                <div>
                  <div className={`text-[11px] font-bold ${subStep === 'approving' ? 'text-indigo-400' : 'text-slate-200'}`}>
                    Approve USDC Token Allowance
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Authorize the subscription smart contract to handle USDC.
                  </div>
                </div>
              </div>

              {/* Step 3: Payment */}
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  subStep === 'paying' ? 'bg-indigo-500 text-white' : 
                  subStep === 'confirmed' ? 'bg-emerald-500 text-white' : 
                  'bg-slate-850 text-slate-500'
                }`}>
                  {subStep === 'paying' ? <Loader2 size={10} className="animate-spin" /> : 
                   subStep === 'confirmed' ? <Check size={10} /> : '3'}
                </div>
                <div>
                  <div className={`text-[11px] font-bold ${subStep === 'paying' ? 'text-indigo-400' : 'text-slate-200'}`}>
                    Confirm Subscription Deposit
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Transfer first month deposit to the contract registry.
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {subStep === 'confirmed' && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 animate-fade-in">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-400">Payment Confirmed On-Chain</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono truncate">
                    Tx: {subTxHash}
                  </div>
                  <span className="text-[8px] text-emerald-400/80 font-mono block mt-1">
                    SaaS Access API Credentials unlocked successfully ✓
                  </span>
                </div>
              )}

            </div>

            {/* Action Buttons */}
            {subStep === 'idle' && (
              <button 
                onClick={handleSimulateSubscription}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wallet size={13} />
                {walletAddress ? 'Approve & Pay USDC' : 'Connect Wallet & Pay'}
              </button>
            )}

            {subStep === 'confirmed' && (
              <button 
                onClick={() => setShowSubModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Portal
              </button>
            )}

          </div>
        </div>
      )}

    </main>
  );
}
