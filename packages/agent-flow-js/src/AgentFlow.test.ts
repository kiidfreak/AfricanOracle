import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentFlow } from './AgentFlow';
import { AgentConfig } from './types';

describe('AgentFlow Orchestrator', () => {
  let agentFlow: AgentFlow;
  const mockConfig: AgentConfig = {
    min_edge: 0.08,
    min_confidence: 0.5,
    builder_address: '0x1234567890123456789012345678901234567890',
    rpc_url: 'https://mock-rpc.com'
  };

  beforeEach(() => {
    agentFlow = new AgentFlow(mockConfig);
  });

  it('should correctly accumulate builder fees in the revenue summary', async () => {
    const input = "Will Maize prices rise?";
    
    // Run the cycle
    const result = await agentFlow.run(input);

    expect(result.revenue_summary.builder_fee_usdc).toBeGreaterThan(0);
    expect(result.revenue_summary.total_revenue_usdc).toBe(result.revenue_summary.builder_fee_usdc);
  });

  it('should record reasoning steps with valid latencies', async () => {
    const input = "Test prediction";
    const result = await agentFlow.run(input);

    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.trace[0].latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('should include the revenue report in the specific trace step', async () => {
    const result = await agentFlow.run("Revenue test");
    const traceStep = result.trace.find(s => s.agent === 'trace');

    expect(traceStep).toBeDefined();
    expect(traceStep?.revenue).toBeDefined();
    expect(traceStep?.revenue?.builder_fee_usdc).toBe(0.05);
  });
});
