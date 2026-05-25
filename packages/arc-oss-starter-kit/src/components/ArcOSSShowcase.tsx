import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, 
  Wallet, 
  Coins, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  RefreshCw, 
  Zap, 
  Check, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';
import { useArcSession } from '../hooks/useArcSession';
import { fetchWithX402, PaymentRequiredError } from '../utils/x402Client';
import { Address, Hex } from 'viem';
import './styles.css';

// Mock address constant
const MOCK_PRIMARY_ADDRESS = '0x7a3B14eF332a67bcD8804914c9d7890123456789' as Address;

export function ArcOSSShowcase() {
  const { 
    session, 
    createSession, 
    revokeSession, 
    spendAllowance, 
    isSessionValid 
  } = useArcSession();

  // Component UI State
  const [primaryWallet, setPrimaryWallet] = useState<Address | null>(null);
  const [allowanceInput, setAllowanceInput] = useState<number>(5.00);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([]);
  const [apiResult, setApiResult] = useState<any>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Primatives State (Simulated)
  const [yieldAddress, setYieldAddress] = useState<string>('0xBuilderAlpha1234567890abcdef');
  const [yieldActive, setYieldActive] = useState<boolean>(false);
  const [escrowAmount, setEscrowAmount] = useState<string>('2.50');
  const [escrowLocked, setEscrowLocked] = useState<boolean>(false);
  const [tradeShares, setTradeShares] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 });
  const [publishedTraces, setPublishedTraces] = useState<Array<{ hash: string; timestamp: string; verified: boolean }>>([]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLogs]);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setConsoleLogs(prev => [...prev, { text: `[${new Date().toLocaleTimeString()}] ${text}`, type }]);
  };

  // Setup Mock primary wallet connection
  const handleConnectWallet = () => {
    setPrimaryWallet(MOCK_PRIMARY_ADDRESS);
    addLog(`Connected primary owner wallet: ${MOCK_PRIMARY_ADDRESS}`, 'success');
  };

  const handleDisconnectWallet = () => {
    setPrimaryWallet(null);
    revokeSession();
    addLog('Disconnected primary wallet and revoked session keys.', 'warn');
  };

  // Mock Wallet Client for EIP-712 signing simulation
  const handleAuthorizeSession = async () => {
    if (!primaryWallet) return;
    
    addLog('Requesting EIP-712 Session Authorization signature...', 'info');
    try {
      // Create a mock WalletClient that returns a simulated signature
      const mockWalletClient = {
        signTypedData: async ({ message }: { message: any }) => {
          addLog(`User approved signing request for ephemeral key: ${message.sessionPublicKey}`, 'success');
          // Return dummy signature
          return '0x' + 'e'.repeat(130) as Hex;
        }
      };

      await createSession(mockWalletClient, primaryWallet, allowanceInput);
      addLog(`Session key approved and stored! Allowance: ${allowanceInput.toFixed(2)} USDC`, 'success');
    } catch (err: any) {
      addLog(`Failed to authorize session: ${err.message}`, 'error');
    }
  };

  // Mock Fetch Call simulating x402 payment lifecycle
  const handleFetchPremiumReport = async () => {
    setIsApiLoading(true);
    setApiResult(null);
    addLog('Initiating GET request to "/api/v1/premium-predict-trace"...', 'info');

    // Simulate API fetch that behaves like x402 server
    const mockX402Fetch = async (url: string, init?: any) => {
      // If PAYMENT-SIGNATURE is passed, verify and succeed
      if (init?.headers?.get('payment-signature')) {
        return new Response(JSON.stringify({
          status: 'success',
          data: {
            question: 'Will Unga Maize Flour price hit KSh 185 by Q3?',
            probability: 0.672,
            reasoning: 'Bayes analysis: KNBS wholesale +12.3% YoY, CHIRPS rainfall -1.8σ, DAP fertilizer +18%. Counter-thesis rejected due to lack of local subsidy.',
            trace_hash: '0x' + '7'.repeat(64),
            fee_charged_usdc: '0.50'
          }
        }), { status: 200 });
      }

      // Otherwise, return 402 Payment Required with base64 encoded requirements header
      const requirements = {
        x402Version: 2,
        accepts: [{
          scheme: 'exact',
          network: 'eip155:5042002', // Arc Testnet
          asset: '0x07865c6e87b9d70255377e024ace6630c1eaa37f' as Address, // USDC
          payTo: '0x946571ab3237890123456789abcdef9999999999' as Address, // Platform Escrow
          amount: '500000' // 0.50 USDC
        }],
        error: 'Payment required to read high-fidelity trace'
      };

      const headers = new Headers();
      headers.set('payment-required', btoa(JSON.stringify(requirements)));
      
      return new Response(JSON.stringify({ error: 'Payment Required' }), {
        status: 402,
        headers
      });
    };

    try {
      // Inject standard fetch behavior
      const response = await fetchWithX402(
        '/api/v1/premium-predict-trace',
        { method: 'GET' },
        {
          session: session,
          onSessionSpend: (amount: bigint) => {
            const amountDecimal = Number(amount) / 1000000;
            spendAllowance(amount);
            addLog(`x402 Interceptor: Spent ${amountDecimal.toFixed(2)} USDC from session allowance.`, 'warn');
          },
          onPaymentLogged: (msg: string) => {
            if (msg.includes('Retry successful')) {
              addLog(msg, 'success');
            } else if (msg.includes('silently') || msg.includes('Retrying')) {
              addLog(msg, 'info');
            } else {
              addLog(msg, 'info');
            }
          }
        }
      );

      // Re-route the simulated fetch inside fetchWithX402 implementation (for demo purposes)
      // Since fetchWithX402 uses real window.fetch, we catch PaymentRequiredError here to show standard flow:
      if (response.status === 402 || !session) {
        throw new Error('API returned 402. Connect wallet & authorize a session key to trigger auto-payment!');
      }

      const body = await response.json();
      setApiResult(body.data);
      addLog('Premium prediction trace successfully unlocked!', 'success');

      // Append trace to Identity list
      const newTrace = {
        hash: body.data.trace_hash,
        timestamp: new Date().toLocaleTimeString(),
        verified: true
      };
      setPublishedTraces(prev => [newTrace, ...prev]);

    } catch (err: any) {
      if (err instanceof PaymentRequiredError) {
        addLog(`PaymentRequiredError: ${err.message}`, 'error');
        addLog(`Requested Amount: 0.50 USDC | Network: Arc Testnet`, 'info');
      } else {
        addLog(err.message, 'error');
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  // Mock Primitive Handlers
  const handleSetupYieldRoute = () => {
    if (yieldActive) {
      setYieldActive(false);
      addLog('Yield routing disabled.', 'warn');
    } else {
      setYieldActive(true);
      addLog(`Yield routing activated. Redirecting 100% of staking yield to: ${yieldAddress}`, 'success');
    }
  };

  const handleEscrowToggle = () => {
    if (escrowLocked) {
      setEscrowLocked(false);
      addLog('Escrow unlocked. Funds returned to primary owner.', 'warn');
    } else {
      setEscrowLocked(true);
      addLog(`Locked ${escrowAmount} USDC into Arc Escrow contract for trade settlement.`, 'success');
    }
  };

  const handleTradePrediction = (direction: 'YES' | 'NO') => {
    if (!session || !isSessionValid) {
      addLog('Unable to trade: Active session key is required for silent automated execution.', 'error');
      return;
    }
    const cost = 1.00; // 1 USDC
    const costWei = BigInt(cost * 1000000);
    
    if (session.remainingAllowance < costWei) {
      addLog('Unable to trade: Session key allowance exceeded.', 'error');
      return;
    }

    spendAllowance(costWei);
    addLog(`[Silent Exec] Buying YES shares worth ${cost.toFixed(2)} USDC via Session Key...`, 'info');
    setTimeout(() => {
      setTradeShares(prev => ({
        yes: direction === 'YES' ? prev.yes + 1 : prev.yes,
        no: direction === 'NO' ? prev.no + 1 : prev.no
      }));
      addLog(`Trade confirmed on Arc: Bought 1.00 shares of ${direction}`, 'success');
    }, 600);
  };

  const handleVerifyTrace = (hash: string) => {
    addLog(`Verifying trace ${hash} on-chain at AfricaCastTraceRegistry...`, 'info');
    setTimeout(() => {
      addLog(`Contract verified: Trace exists! Publisher: ${session?.publicKey || MOCK_PRIMARY_ADDRESS} | Block: 4029281`, 'success');
    }, 500);
  };

  return (
    <div className="arc-dashboard">
      <div className="arc-container">
        
        {/* Header */}
        <div className="arc-header">
          <div>
            <h1 className="arc-title">Arc OSS Starter Kit</h1>
            <p className="arc-subtitle">React + wagmi/viem client-side x402 & session keys from first principles</p>
          </div>
          <div>
            {primaryWallet ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-success text-mono">
                  {primaryWallet.slice(0, 6)}...{primaryWallet.slice(-4)}
                </span>
                <button className="btn-secondary" onClick={handleDisconnectWallet}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={handleConnectWallet}>
                <Wallet size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid-cols">
          
          {/* Left Column: Session Key Manager & Logs */}
          <div style={{ gridColumn: 'span 5' }} className="space-y-4">
            
            {/* Session Card */}
            <div className="card-glass glow-glow">
              <div className="widget-title">
                <Key size={18} className="text-violet-400" />
                <span>Session Key Manager</span>
              </div>
              
              {!primaryWallet ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <AlertCircle size={32} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Connect your primary wallet to authorize a session key</p>
                </div>
              ) : !session ? (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
                    Session Spending Allowance (USDC)
                  </label>
                  <input 
                    type="number" 
                    className="widget-input" 
                    value={allowanceInput} 
                    onChange={(e) => setAllowanceInput(parseFloat(e.target.value))} 
                    min={1} 
                    max={100}
                  />
                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    onClick={handleAuthorizeSession}
                  >
                    Authorize Session Key
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Session Status:</span>
                    <span className={`badge ${isSessionValid ? 'badge-success' : 'badge-danger'}`}>
                      {isSessionValid ? 'Active & Authorized' : 'Expired/Depleted'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'block' }}>Key: <span className="text-mono">{session.publicKey.slice(0, 10)}...{session.publicKey.slice(-8)}</span></span>
                  </div>

                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <span>Remaining Allowance:</span>
                      <span className="text-mono">{(Number(session.remainingAllowance) / 1000000).toFixed(2)} / {allowanceInput.toFixed(2)} USDC</span>
                    </div>
                    <div className="allowance-bar-bg">
                      <div 
                        className="allowance-bar-fill" 
                        style={{ width: `${(Number(session.remainingAllowance) / 1000000) / allowanceInput * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="btn-secondary" style={{ width: '100%', color: '#f87171' }} onClick={revokeSession}>
                    <Trash2 size={14} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} />
                    Revoke Session
                  </button>
                </div>
              )}
            </div>

            {/* Console Log Panel */}
            <div className="card-glass">
              <div className="widget-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={18} className="text-amber-400" />
                  <span>x402 Agent Console</span>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  onClick={() => setConsoleLogs([])}
                >
                  Clear
                </button>
              </div>
              <div className="console-panel">
                {consoleLogs.length === 0 ? (
                  <p style={{ color: '#334155', fontSize: '0.85rem' }}>Logs will stream here during API calls...</p>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div key={index} className={`console-line text-mono ${log.type}`}>
                      {log.text}
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>

          </div>

          {/* Right Column: Protected Resource Demo & Primitives */}
          <div style={{ gridColumn: 'span 7' }} className="space-y-4">
            
            {/* x402 Micropayment Demo */}
            <div className="card-glass">
              <div className="widget-title">
                <Coins size={18} className="text-emerald-400" />
                <span>Protected Agent API (x402)</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
                Simulate pulling a paid intelligence report. If an active session key exists, the payment is signed silently and the data is unlocked immediately.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <button className="btn-primary" onClick={handleFetchPremiumReport} disabled={isApiLoading}>
                  {isApiLoading ? 'Processing...' : 'Fetch Premium Predict Report (0.50 USDC)'}
                </button>
              </div>

              {apiResult && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{apiResult.question}</span>
                    <span className="badge badge-success">P(YES) = {(apiResult.probability * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                    {apiResult.reasoning}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Trace Hash: <span className="text-mono">{apiResult.trace_hash.slice(0, 12)}...</span></span>
                    <span>Cost: 0.50 USDC</span>
                  </div>
                </div>
              )}
            </div>

            {/* Arc OSS Primitives Widgets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Primitive 1: Yield Routing */}
              <div className="card-glass">
                <div className="widget-title">
                  <TrendingUp size={18} className="text-cyan-400" />
                  <span>1. Yield Routing</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Redirect future yields on prediction contracts to supporting developers.
                </p>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Yield Beneficiary</label>
                <input 
                  type="text" 
                  className="widget-input" 
                  value={yieldAddress} 
                  onChange={(e) => setYieldAddress(e.target.value)}
                  disabled={yieldActive}
                />
                <button 
                  className={yieldActive ? 'btn-secondary' : 'btn-primary'} 
                  style={{ width: '100%', padding: '0.5rem' }}
                  onClick={handleSetupYieldRoute}
                >
                  {yieldActive ? 'Disable Redirection' : 'Redirect Yield'}
                </button>
              </div>

              {/* Primitive 2: Escrow */}
              <div className="card-glass">
                <div className="widget-title">
                  <ShieldCheck size={18} className="text-amber-400" />
                  <span>2. Escrow</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Lock USDC in a secure escrow to settle trade outcomes automatically.
                </p>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Escrow Amount (USDC)</label>
                <input 
                  type="text" 
                  className="widget-input" 
                  value={escrowAmount} 
                  onChange={(e) => setEscrowAmount(e.target.value)}
                  disabled={escrowLocked}
                />
                <button 
                  className={escrowLocked ? 'btn-secondary' : 'btn-primary'} 
                  style={{ width: '100%', padding: '0.5rem' }}
                  onClick={handleEscrowToggle}
                >
                  {escrowLocked ? 'Release / Unlock Escrow' : 'Lock in Escrow'}
                </button>
              </div>

              {/* Primitive 3: Prediction Markets */}
              <div className="card-glass">
                <div className="widget-title">
                  <Coins size={18} className="text-pink-400" />
                  <span>3. Prediction Markets</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Automate betting. Uses session keys to bypass confirmations.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>
                  <span>Will USDKES drop below 128?</span>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem', color: '#cbd5e1' }}>
                    <span>YES: {tradeShares.yes} shares</span>
                    <span>NO: {tradeShares.no} shares</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem', background: '#059669' }} onClick={() => handleTradePrediction('YES')}>
                    Buy YES
                  </button>
                  <button className="btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem', background: '#dc2626' }} onClick={() => handleTradePrediction('NO')}>
                    Buy NO
                  </button>
                </div>
              </div>

              {/* Primitive 4: Identity & Reputation */}
              <div className="card-glass">
                <div className="widget-title">
                  <FileText size={18} className="text-violet-400" />
                  <span>4. Identity / Reputation</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Verify published agent reasoning traces in the registry.
                </p>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {publishedTraces.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, textAlign: 'center', padding: '0.5rem' }}>
                      No traces generated yet.
                    </p>
                  ) : (
                    publishedTraces.map((trace, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', padding: '0.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span className="text-mono" style={{ color: '#cbd5e1' }}>{trace.hash.slice(0, 16)}...</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.7rem' }}
                          onClick={() => handleVerifyTrace(trace.hash)}
                        >
                          Verify
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
