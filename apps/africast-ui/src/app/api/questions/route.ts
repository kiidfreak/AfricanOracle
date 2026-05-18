import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';
const API_KEY = process.env.AFRICAST_API_KEY ?? 'dev-key';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/v1/questions`, {
      headers: { 'X-API-Key': API_KEY },
      next: { revalidate: 60 }, // Cache for 60s — questions don't change often
    });

    if (!res.ok) throw new Error(`Backend ${res.status}`);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[questions proxy] backend unavailable, returning mock:', err.message);
    // Return mock so the UI still renders without the backend
    return NextResponse.json({
      total: 3,
      questions: [
        {
          question: 'Will CBK cut rates at the next MPC meeting (June 2026)?',
          category: 'macro',
          drivers: ['CBK 12-month inflation (5.59%)', '91-day T-Bill yield', 'KES exchange rate'],
          horizon: '28d',
          current_crowd_prob: 0.44,
          source_ids: ['cbk-inflation', 'cbk-tbills'],
          data_coverage: 0.90,
          ready: true,
        },
        {
          question: 'Will Kenya 12-month inflation exceed 6% by August 2026?',
          category: 'macro',
          drivers: ['CBK CPI trend (currently 5.59%)', 'Food price seasonality', 'KES depreciation'],
          horizon: '90d',
          current_crowd_prob: 0.31,
          source_ids: ['cbk-inflation'],
          data_coverage: 0.85,
          ready: true,
        },
        {
          question: 'Will Safaricom (SCOM) close above KES 20 before end of Q3 2026?',
          category: 'equity',
          drivers: ['NSE SCOM daily close', 'M-Pesa revenue signals', 'CBK rates direction'],
          horizon: '90d',
          current_crowd_prob: 0.38,
          source_ids: ['nse-equity', 'cbk-inflation', 'cbk-tbills'],
          data_coverage: 0.75,
          ready: true,
        },
        {
          question: 'Will USD/KES breach 140 within 30 days?',
          category: 'fx',
          drivers: ['CBK reserves', 'Diaspora remittances', 'T-Bill demand (foreign)'],
          horizon: '30d',
          current_crowd_prob: 0.22,
          source_ids: ['cbk-tbills', 'cbk-inflation'],
          data_coverage: 0.40,
          ready: false,
        },
        {
          question: 'Will Unga Group maize flour retail price exceed KSh 185/2kg by end of Q3?',
          category: 'agriculture',
          drivers: ['KNBS maize wholesale prices', 'CHIRPS rainfall deficit', 'DAP fertilizer costs'],
          horizon: '90d',
          current_crowd_prob: 0.53,
          source_ids: [],
          data_coverage: 0.10,
          ready: false,
        },
      ],
    });
  }
}
