import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';
const API_KEY = process.env.AFRICAST_API_KEY ?? 'dev-key';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '5';

    const res = await fetch(`${BACKEND}/v1/questions?page=${page}&limit=${limit}`, {
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
      total: 7,
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
          question: 'Will KNBS May Inflation news report a drop to 5.0% YoY?',
          category: 'macro',
          drivers: ['KNBS / Business Daily report', 'Food price index trend', 'Fuel and electricity tariffs'],
          horizon: '15d',
          current_crowd_prob: 0.52,
          source_ids: ['cbk-inflation'],
          data_coverage: 0.92,
          ready: true,
        },
        {
          question: 'Will NCBA Group approve KSh 3.00 final dividend for FY25 at the AGM?',
          category: 'equities',
          drivers: ['NSE NCBA corporate filing', 'NSE Banking Index performance', 'CBK rates direction'],
          horizon: '45d',
          current_crowd_prob: 0.65,
          source_ids: ['nse-equity'],
          data_coverage: 0.95,
          ready: true,
        },
        {
          question: 'Will Nedbank and NCBA announce a new corporate banking synergy in East Africa?',
          category: 'equities',
          drivers: ['Business Daily sentiment', 'Nedbank corporate filings', 'NSE Banking Sector Index'],
          horizon: '60d',
          current_crowd_prob: 0.58,
          source_ids: ['nse-equity', 'rss-news'],
          data_coverage: 0.90,
          ready: true,
        },
        {
          question: 'Will Crown Paints AGM notice confirm KES 4.0B revenue growth target?',
          category: 'equities',
          drivers: ['Daily Nation corporate notice', 'NSE Crown Paints daily close', 'Housing sector demand'],
          horizon: '30d',
          current_crowd_prob: 0.48,
          source_ids: ['nse-equity'],
          data_coverage: 0.85,
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
