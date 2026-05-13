import { v4 as uuidv4 } from 'uuid';
import { 
  AgentConfig, 
  ReasoningStep, 
  SystemOutput, 
  RevenueReport 
} from './types';

export class AgentFlow {
  private config: AgentConfig;
  private trace: ReasoningStep[] = [];
  private totalRevenue: RevenueReport = {
    builder_fee_usdc: 0,
    trade_profit_usdc: 0,
    total_revenue_usdc: 0,
    currency: 'USDC'
  };

  constructor(config: AgentConfig) {
    this.config = config;
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
    
    this.addStep({
      step: 2,
      agent: 'trace',
      posterior_prob: engineResult.posterior,
      narrative: `Attached builder code ${this.config.builder_address.slice(0, 8)}... Estimated fee: ${builderFee} USDC`,
      revenue: {
        builder_fee_usdc: builderFee,
        trade_profit_usdc: 0,
        total_revenue_usdc: builderFee,
        currency: 'USDC'
      }
    }, attributionStart);

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
      arc_tx_hash: engineResult.arc_tx_hash
    };
  }

  private async callPythonEngine(input: string): Promise<any> {
    // Mocking the call to the FastAPI backend
    // In production, this would be: await fetch('http://localhost:8000/predict', { ... })
    return {
      hypothesis_id: uuidv4(),
      prediction_id: uuidv4(),
      posterior: 0.65,
      confidence: 0.82,
      edge: 0.12,
      recommendation: 'BET_YES',
      signals_count: 5,
      trace_hash: '0x' + 'a'.repeat(64),
      arc_tx_hash: '0x' + 'b'.repeat(64)
    };
  }

  private calculateEstimatedBuilderFee(engineResult: any): number {
    // Polymarket V2 builder fees are often a % of the trade size or a flat fee per fill.
    // Assuming a 0.5% fee on a standard 10 USDC recommendation.
    if (engineResult.recommendation === 'NO_BET') return 0;
    return 0.05; // 0.05 USDC per follow
  }
}
