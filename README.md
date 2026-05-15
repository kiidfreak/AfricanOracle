# 🌍 AfricaCast

> **On-chain reasoning infrastructure for emerging market intelligence.**

Markets exist — Kalshi, Polymarket, Spreadhit. What they lack is **local data**, **structured reasoning**, and **transparent decision logic** for African events.

AfricaCast fills that gap. We ingest signals that global markets ignore, run Bayesian belief updates, and publish every reasoning step on-chain.

---

## What we actually do

```
🧱 Data Layer           → KNBS, CBK, CHIRPS, FAO, news feeds
🧠 Intelligence Layer   → 5-agent pipeline + Bayesian engine
🔗 Output Layer          → Probabilities + reasoning traces
💰 Consumers            → Prediction markets, traders, hedge funds, protocols
```

**Example:**

> "Will Unga maize flour price hit KSh 185 by Q3?"

Current prediction market answer: **53%** (crowd opinion, no analysis).

AfricaCast answer: **67%** — backed by:
- KNBS maize wholesale +12.3% YoY
- CHIRPS rainfall deficit −1.8σ
- DAP fertilizer imports +18%
- Counter-thesis: gov subsidy (Hypothesis Agent)

Every step is traceable. Every trace is on-chain.

---

## Architecture

```
        ┌─────────────────────────────────┐
        │         API GATEWAY              │
        │   /v1/predict                    │
        │   /v1/datasets                   │
        │   /v1/traces                     │
        │   /v1/questions                  │
        └────────────┬────────────────────┘
                     │
         ┌───────────▼───────────────┐
         │    5-AGENT ORCHESTRATOR    │
         └───┬────┬────┬────┬────┬───┘
             │    │    │    │    │
          Research Hypothesis Bayes Trader Trace
             │                        │
     ┌───────▼────────┐        ┌─────▼──────┐
     │  Data Ingestion │        │ Arc Testnet │
     │  KNBS CBK CHIRPS│        │  On-chain   │
     └────────────────┘        └────────────┘
```

### The Three Layers

**1. Agent Layer (The Brain)**
- **Bayesian Engine**: Log-odds accumulation with quality-weighted signals. Emits a mathematical proof of every probability shift.
- **Hypothesis Agent**: Generates counter-theses to stress-test predictions. This is what separates us from signal generators.
- **Arbitrage Engine**: Detects logical inconsistencies across related markets.

**2. Identity Layer (The Trust)**
- **Arc Network (ERC-8004)**: Every trace is published on-chain. Builder codes attribute alpha.
- **Verifiable Feedback**: Successes build on-chain reputation over time.

**3. Venue Layer (The Market)**
- **Polymarket V2**: Native CLOB integration.
- **pUSD Routing**: Just-in-time USDC → pUSD conversion for trade settlement.

---

## Quick Start

### Run the backend

```bash
cd dhamiri-backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
```

### Run the dashboard

```bash
cd apps/africast-ui
npm install
npm run dev
```

### Try the API

```bash
# Get loaded datasets
curl http://localhost:8001/v1/datasets

# Run an intelligence cycle
curl -X POST http://localhost:8001/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"question": "Will Unga price hit KSh 185 by Q3?"}'

# Get question library
curl http://localhost:8001/v1/questions

# Retrieve a reasoning trace
curl http://localhost:8001/v1/traces/0xabc123
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/predict` | Run intelligence cycle → probability + reasoning trace |
| `GET` | `/v1/datasets` | List loaded data sources with freshness |
| `GET` | `/v1/questions` | Pre-built market question library |
| `GET` | `/v1/traces/{hash}` | Retrieve full reasoning trace by hash |
| `GET` | `/health` | Service health check |
| `GET` | `/docs` | Interactive API documentation (Swagger) |

---

## Monorepo Structure

```
├── dhamiri-backend/          # Python backend (FastAPI)
│   ├── app/
│   │   ├── agents/           # 5-agent system
│   │   ├── api/v1/           # Production API routes
│   │   ├── engine/           # Bayesian math
│   │   ├── ingestion/        # Data collectors
│   │   ├── strategy/         # Arbitrage engine
│   │   └── models/           # DB models + schemas
│   └── docker-compose.yml
├── apps/
│   └── africast-ui/          # Next.js dashboard
├── packages/
│   ├── agent-flow-js/        # JS orchestration layer (npm)
│   ├── agent-intel-core/     # Question engine (npm)
│   └── africast-cli/         # Headless CLI
└── .env                      # Arc Testnet + Circle config
```

---

## Data Sources

| Source | Type | Refresh | Region |
|--------|------|---------|--------|
| KNBS Maize Prices | Government API | 6h | Kenya |
| CBK Interest Rates | Government API | 24h | Kenya |
| CHIRPS Rainfall | Satellite | 7d | East Africa |
| Open Exchange Rates | FX API | 1h | Global |
| KNBS CPI/Inflation | Government API | 30d | Kenya |
| EAGC Retail Flour | Market Survey | 12h | Kenya |
| DAP Fertilizer Costs | Trade Data | 14d | Kenya |

---

## On-Chain Integration

- **Network**: Arc Testnet (Chain ID: 5042002)
- **RPC**: `https://5042002.rpc.thirdweb.com`
- **Trace Storage**: Reasoning hashes published via self-send transactions
- **Explorer**: [testnet.arcscan.app](https://testnet.arcscan.app)

---

## Why this matters

> "We're not building a trading bot. We're building a **verifiable intelligence layer** for underpriced markets."

Global prediction markets price African events using incomplete data. AfricaCast makes local knowledge investable — by turning it into structured, verifiable signals for global markets.

---

**Built for the Agora Agents Hackathon** by Emmanuel Maina / Evolve Capital Research.
