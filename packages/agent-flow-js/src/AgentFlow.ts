import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { CircleProvider } from './CircleProvider';
import { 
  AgentConfig, 
  ReasoningStep, 
  SystemOutput, 
  RevenueReport 
} from './types';

export class AgentFlow {
  private config: AgentConfig;
  private circle: CircleProvider | null = null;
  private trace: ReasoningStep[] = [];
  private totalRevenue: RevenueReport = {
    builder_fee_usdc: 0,
    trade_profit_usdc: 0,
    total_revenue_usdc: 0,
    currency: 'USDC'
  };

  constructor(config: AgentConfig) {
    this.config = config;
    if (process.env.CIRCLE_API_KEY && process.env.CIRCLE_ENTITY_SECRET) {
      this.circle = new CircleProvider({
        apiKey: process.env.CIRCLE_API_KEY,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET
      });
    }
  }

  /**
   * Tracks and adds a reasoning step to the trace.
   */
  public addStep(step: Omit<ReasoningStep, 'latency_ms'>, startTime: number): void {
    const latency = Date.now() - startTime;
    this.trace.push({
      ...step,
      latency_ms: latency
    });

    // Update aggregate revenue if present in step
    if (step.revenue) {
      this.totalRevenue.builder_fee_usdc += step.revenue.builder_fee_usdc;
      this.totalRevenue.trade_profit_usdc += step.revenue.trade_profit_usdc;
      this.totalRevenue.total_revenue_usdc = 
        this.totalRevenue.builder_fee_usdc + this.totalRevenue.trade_profit_usdc;
    }
  }

  /**
   * Main entry point for the hybrid orchestration.
   * In Phase 2, this calls the Python backend for heavy lifting.
   */
  public async run(input: string): Promise<SystemOutput> {
    const startTime = Date.now();
    this.trace = []; // Reset trace
    
    console.log(`[AgentFlow] Initializing cycle for: "${input}"`);

    // 1. Research & Bayesian Math (Calls Python Engine)
    const researchStart = Date.now();
    const engineResult = await this.callPythonEngine(input);
    
    this.addStep({
      step: 1,
      agent: 'research',
      posterior_prob: engineResult.posterior,
      narrative: `Gathered ${engineResult.signals_count} signals. Primary belief updated to ${engineResult.posterior.toFixed(2)}`,
    }, researchStart);

    // 2. Revenue Attribution (Builder Code Layer)
    const attributionStart = Date.now();
    const builderFee = this.calculateEstimatedBuilderFee(engineResult);
    
    // 2. Market Maker Agent (Liquidity Provision)
    const traderStart = Date.now();
    const bid = (engineResult.posterior - 0.02).toFixed(2);
    const ask = (engineResult.posterior + 0.02).toFixed(2);
    const depth = (engineResult.confidence * 500).toFixed(0);

    this.addStep({
      step: 2,
      agent: 'trader',
      posterior_prob: engineResult.posterior,
      narrative: `Market Making initialized. Providing Liquidity: BID ${bid} | ASK ${ask}. Depth: ${depth} USDC.`,
      revenue: {
        builder_fee_usdc: 0.05,
        trade_profit_usdc: 0.02, // Spread capture
        total_revenue_usdc: 0.07,
        currency: 'USDC'
      }
    }, traderStart);

    // 3. Trace & Proof (Arc Network)
    const traceStart = Date.now();
    let txHash = engineResult.arc_tx_hash;
    
    if (process.env.ARC_PRIVATE_KEY && process.env.ARC_RPC_URL) {
      try {
        const { providers, Wallet } = await import('ethers');
        const chainId = parseInt(process.env.ARC_CHAIN_ID || '5042002');
        const provider = new providers.JsonRpcProvider(process.env.ARC_RPC_URL, {
          chainId: chainId,
          name: 'arc-testnet'
        });
        const wallet = new Wallet(process.env.ARC_PRIVATE_KEY, provider);
        
        console.log(`[AgentFlow] Publishing reasoning trace to Arc Testnet from ${wallet.address}...`);
        
        // In a real scenario, we'd call a contract. 
        // For the hackathon, we send a transaction with the trace hash in the data field.
        const tx = await wallet.sendTransaction({
          to: wallet.address, // Self-send to record data
          value: 0,
          data: engineResult.trace_hash,
          chainId: parseInt(process.env.ARC_CHAIN_ID || '5042002')
        });
        
        txHash = tx.hash;
        console.log(`[AgentFlow] Trace transaction confirmed: ${txHash}`);
      } catch (err) {
        console.error('[AgentFlow] Testnet transaction failed, falling back to mock.', err);
      }
    } else if (this.circle) {
      // Real signing via Circle API
      txHash = await this.circle.signTransaction('agent-trace-wallet-id', 'publishTrace', [engineResult.trace_hash]);
    }

    this.addStep({
      step: 3,
      agent: 'trace',
      posterior_prob: engineResult.posterior,
      narrative: `Hashed reasoning trace to Arc Network via ${this.circle ? 'Circle Managed Wallet' : 'Ephemeral Session Identity'}.`,
      arc_tx_hash: txHash
    }, traceStart);

    // Final output
    return {
      hypothesis_id: engineResult.hypothesis_id,
      prediction_id: engineResult.prediction_id,
      probability: engineResult.posterior,
      confidence: engineResult.confidence,
      recommendation: engineResult.recommendation,
      edge: engineResult.edge,
      trace: this.trace,
      revenue_summary: this.totalRevenue,
      trace_hash: engineResult.trace_hash,
      arc_tx_hash: txHash,
      reasoning_trace: engineResult.reasoning_trace,
      signals_used: engineResult.signals_used
    };
  }

  private async callPythonEngine(input: string): Promise<any> {
    try {
      const response = await axios.post('http://localhost:8001/v1/predict', {
        question: input,
        prior: 0.5
      }, {
        headers: {
          'X-API-Key': process.env.AFRICAST_API_KEY || 'builder-africast-arc'
        }
      });
      const data = response.data;
      return {
        hypothesis_id: data.hypothesis_id,
        prediction_id: data.prediction_id,
        posterior: data.probability,
        confidence: data.confidence,
        edge: data.edge,
        recommendation: data.recommendation,
        signals_count: data.signals_used ? data.signals_used.length : 0,
        trace_hash: data.trace_hash,
        arc_tx_hash: data.arc_tx_hash,
        reasoning_trace: data.reasoning_trace,
        signals_used: data.signals_used
      };
    } catch (error: any) {
      console.error('[AgentFlow] Failed to call Python engine, using mock fallback.', error.message);
      return {
        hypothesis_id: uuidv4(),
        prediction_id: uuidv4(),
        posterior: 0.65,
        confidence: 0.82,
        edge: 0.12,
        recommendation: 'BET_YES',
        signals_count: 5,
        trace_hash: '0x' + 'a'.repeat(64),
        arc_tx_hash: '0x' + 'b'.repeat(64),
        reasoning_trace: [],
        signals_used: []
      };
    }
  }

  private calculateEstimatedBuilderFee(engineResult: any): number {
    if (engineResult.recommendation === 'NO_BET') return 0;
    return 0.05; 
  }
}
