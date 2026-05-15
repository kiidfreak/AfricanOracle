export type AgentRole = 'orchestrator' | 'research' | 'hypothesis' | 'trader' | 'trace';

export interface RevenueReport {
  builder_fee_usdc: number;      // USDC earned from builder code attribution
  trade_profit_usdc: number;    // Realized/Unrealized profit from agent's own trades
  total_revenue_usdc: number;
  currency: string;             // Always "USDC" on Arc
}

export interface ReasoningStep {
  step: number;
  agent: AgentRole;
  signal_id?: string;
  signal_name?: string;
  impact?: number;
  posterior_prob: number;
  narrative: string;
  latency_ms: number;
  revenue?: RevenueReport;      // Optional revenue impact of this step
  arc_tx_hash?: string;        // Transaction hash for trace steps
}

export interface SystemOutput {
  hypothesis_id: string;
  prediction_id: string;
  probability: number;
  confidence: number;
  recommendation: 'BET_YES' | 'BET_NO' | 'NO_BET';
  edge: number;
  trace: ReasoningStep[];
  revenue_summary: RevenueReport;
  trace_hash: string;
  arc_tx_hash: string;
}

export interface AgentConfig {
  min_edge: number;
  min_confidence: number;
  builder_address: string;
  rpc_url: string;
}
