import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';
const API_KEY = process.env.AFRICAST_API_KEY ?? 'dev-key';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '50';

  try {
    const res = await fetch(`${BACKEND}/v1/signals?limit=${limit}`, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      // Don't cache — we want fresh data each call
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Backend responded ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // Return mock signals if backend is down so the UI still works
    console.warn('[signals proxy] backend unavailable, returning mock data:', err.message);
    return NextResponse.json(MOCK_SIGNALS);
  }
}

// ── Mock fallback (shown when backend is offline) ─────────────────────────────
const MOCK_SIGNALS = [
  { id: 'mock-1', name: 'CBK 12-Month Inflation (April 2026)', signal_class: 'cpi_inflation',  value: 5.59,  unit: 'percent',  source_id: 'cbk-inflation', created_at: new Date().toISOString() },
  { id: 'mock-2', name: 'CBK 12-Month Inflation (March 2026)', signal_class: 'cpi_inflation',  value: 4.39,  unit: 'percent',  source_id: 'cbk-inflation', created_at: new Date().toISOString() },
  { id: 'mock-3', name: 'CBK 91-Day T-Bill Auction (18/05/2026)', signal_class: 'interest_rate', value: 91,   unit: 'days',    source_id: 'cbk-tbills',   created_at: new Date().toISOString() },
  { id: 'mock-4', name: 'CBK 182-Day T-Bill Auction (18/05/2026)', signal_class: 'interest_rate', value: 182, unit: 'days',   source_id: 'cbk-tbills',   created_at: new Date().toISOString() },
  { id: 'mock-5', name: 'CBK 364-Day T-Bill Auction (18/05/2026)', signal_class: 'interest_rate', value: 364, unit: 'days',   source_id: 'cbk-tbills',   created_at: new Date().toISOString() },
  { id: 'mock-6', name: 'NSE Equity: SCOM',  signal_class: 'equity_price', value: 17.85, unit: 'KES', source_id: 'nse-equity', created_at: new Date().toISOString() },
  { id: 'mock-7', name: 'NSE Equity: KCB',   signal_class: 'equity_price', value: 28.40, unit: 'KES', source_id: 'nse-equity', created_at: new Date().toISOString() },
  { id: 'mock-8', name: 'NSE Equity: EQTY',  signal_class: 'equity_price', value: 44.25, unit: 'KES', source_id: 'nse-equity', created_at: new Date().toISOString() },
  { id: 'mock-9', name: 'Sentiment: Daily Nation — maize prices', signal_class: 'sentiment',  value: 0.72, unit: 'score', source_id: 'rss-nation', created_at: new Date().toISOString() },
  { id: 'mock-10', name: 'Sentiment: The Standard — drought risk', signal_class: 'sentiment',  value: -0.45, unit: 'score', source_id: 'rss-standard', created_at: new Date().toISOString() },
];
