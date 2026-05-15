import { NextResponse } from 'next/server';
import { AgentFlow } from 'agent-flow-js';

export async function POST(req: Request) {
  const { question } = await req.json();

  const flow = new AgentFlow({
    min_edge: 0.08,
    min_confidence: 0.5,
    builder_address: process.env.BUILDER_WALLET || '0x1234567890123456789012345678901234567890',
    rpc_url: process.env.ARC_RPC_URL || 'https://5042002.rpc.thirdweb.com'
  });

  try {
    const result = await flow.run(question);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Prediction Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
