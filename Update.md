# AfricaCast — Final System Document
> Multi-Agent African Alpha Intelligence · On-Chain Reasoning · Arc Settlement · Agora Agents Hackathon

---

## Table of Contents

1. [System Identity](#1-system-identity)
2. [Architecture Overview](#2-architecture-overview)
3. [Five-Agent System](#3-five-agent-system)
4. [Package Layer: agent-flow-js + agent-intel-core](#4-package-layer)
5. [Bayesian Engine (Complete)](#5-bayesian-engine-complete)
6. [On-Chain Integration — Arc + USDC](#6-on-chain-integration)
7. [Trace Publication Protocol](#7-trace-publication-protocol)
8. [UI State Machine + Latency Architecture](#8-ui-state-machine--latency-architecture)
9. [Demo Flow (Localhost + Mainnet)](#9-demo-flow)
10. [Africast Question Library](#10-africast-question-library)
11. [Monetization — Builder Codes](#11-monetization--builder-codes)
12. [Kenya Gov API Dataset Registry](#12-kenya-gov-api-dataset-registry)
13. [npm Package Specifications](#13-npm-package-specifications)
14. [Deployment Topology](#14-deployment-topology)

---

## 1. System Identity

AfricaCast is not a trading bot. It is not a dashboard. It is:

> **A multi-agent system that turns African information asymmetry into tradable, verifiable alpha — with every reasoning step published on-chain.**

**Positioning statement:**
```
"We turn African information asymmetry into tradable, verifiable alpha.
 Our agents don't output signals. They publish proof of thought."
```

**The four edges:**

| Edge | What it is | Why others miss it |
|---|---|---|
| Data Edge | CBK, KNBS, FAO, local Swahili news | Non-English, delayed, fragmented |
| Processing Edge | Translation → structured market questions | Language + domain model required |
| Execution Edge | Arc (~$0.01 fees, sub-second finality) | Other chains too expensive per trace |
| Reasoning Edge | Full trace published on-chain | Nobody else stores *why*, only *what* |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         AFRICAST SYSTEM                              │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐    ┌─────────────┐  │
│  │ RESEARCH │    │HYPOTHESIS│    │  BAYESIAN  │    │   TRADER    │  │
│  │  AGENT   │───▶│  AGENT   │───▶│   ENGINE   │───▶│   AGENT     │  │
│  └──────────┘    └──────────┘    └────────────┘    └─────────────┘  │
│       │                │               │                  │         │
│       └────────────────┴───────────────┴──────────────────┘         │
│                                        │                            │
│                              ┌─────────▼──────────┐                 │
│                              │  ORCHESTRATOR AGENT │                 │
│                              │  (agent-flow-js)    │                 │
│                              └─────────┬──────────┘                 │
│                                        │                            │
│                              ┌─────────▼──────────┐                 │
│                              │   TRACE AGENT       │                 │
│                              │  hash → Arc → IPFS  │                 │
│                              └─────────────────────┘                │
└──────────────────────────────────────────────────────────────────────┘

        ▲                                                   ▼
   L1/L2 SIGNALS                               ARC CHAIN + USDC
   (CBK, KNBS, FAO,                            (trace hash stored,
    news, weather)                              USDC settlement)
```

**Data → Intelligence → Market → Chain:**

```
L1 Raw Signals
    │ ingest + sanitize
L2 Derived Dynamics
    │ agent-intel-core
L3 Probabilistic Markets
    │ Bayesian engine
L4 Execution + Settlement
    │ Arc / USDC
L5 Published Reasoning Trace
    │ IPFS + Arc hash
```

---

## 3. Five-Agent System

### Agent 1 — Orchestrator (agent-flow-js core)

```typescript
class OrchestratorAgent {
  /**
   * Entry point for the full prediction cycle.
   * Decides routing, manages state, coordinates agents.
   */
  
  async run(input: string): Promise<SystemOutput> {
    const intent = await this.classifyIntent(input);
    // intent: "macro" | "agriculture" | "energy" | "fx" | "multi"

    const hypothesis = await this.generateHypothesis(input, intent);

    const signals   = await this.researchAgent.gather(hypothesis);
    const challenge = await this.hypothesisAgent.challenge(hypothesis, signals);
    const belief    = await this.bayesianEngine.update(hypothesis, signals, challenge);
    const trade     = await this.traderAgent.decide(belief);
    const trace     = await this.traceAgent.publish(belief.trace);

    return {
      hypothesis,
      prediction: belief,
      challenge,
      trade,
      trace,
      latency: this.timer.report()
    };
  }

  private async classifyIntent(input: string): Promise<Intent> {
    // keyword routing (fast, no LLM call needed)
    const INTENT_MAP: Record<string, string[]> = {
      macro:       ["CBK", "interest", "rate", "inflation", "MPC", "monetary"],
      agriculture: ["maize", "tea", "harvest", "drought", "rainfall", "crop"],
      fx:          ["KES", "shilling", "dollar", "USDKES", "forex", "reserves"],
      energy:      ["KPLC", "fuel", "EPRA", "electricity", "solar"],
    };
    for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
      if (keywords.some(k => input.toLowerCase().includes(k.toLowerCase()))) {
        return intent as Intent;
      }
    }
    return "multi";
  }
}
```

---

### Agent 2 — Research Agent (agent-intel-core core)

```typescript
class ResearchAgent {
  /**
   * Fetches L1 signals, derives L2 dynamics,
   * generates Africast-style structured questions.
   */

  async gather(hypothesis: Hypothesis): Promise<Signal[]> {
    const rawSignals = await Promise.all([
      this.cbkFeed.fetch(hypothesis.category),
      this.weatherFeed.fetch(hypothesis.regions),
      this.newsFeed.fetch(hypothesis.keywords),
      this.fxFeed.fetch(),
    ]);

    const l1 = rawSignals.flat().filter(s => s !== null);
    const l2 = this.deriveL2(l1);

    return [...l1, ...l2];
  }

  private deriveL2(signals: Signal[]): Signal[] {
    return [
      this.computeMomentum(signals),
      this.computeSentimentTrend(signals),
      this.computeSupplyShockIndex(signals),
    ].filter(Boolean) as Signal[];
  }

  // Africast question generation
  async generateQuestion(signals: Signal[], category: string): Promise<MarketQuestion> {
    const dominant = signals.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];

    return {
      question: this.templates[category](dominant),
      drivers:  signals.slice(0, 3).map(s => s.name),
      horizon:  "30d",
    };
  }
}
```

---

### Agent 3 — Hypothesis Agent (The Thinker)

This is the rarest agent — it deliberately challenges the primary thesis. This is what separates AfricaCast from every "signal generator" in the hackathon.

```typescript
class HypothesisAgent {
  /**
   * Generates counter-theses and stress tests the primary prediction.
   * Produces competing probability from the skeptic's view.
   */

  async challenge(
    primary: Hypothesis,
    signals: Signal[]
  ): Promise<HypothesisChallenge> {

    // Generate counter scenario
    const counterScenario = await this.generateCounterScenario(primary, signals);

    // Estimate counter probability (independent Bayesian run)
    const counterBelief = await this.bayesianEngine.update(
      { ...primary, prior: 1 - primary.prior },  // inverted prior
      signals.filter(s => s.direction === "bearish")  // opposing signals only
    );

    const disagreement = Math.abs(
      primary.posteriorProbability - counterBelief.probability
    );

    return {
      primary_probability:   primary.posteriorProbability,
      counter_scenario:      counterScenario,
      counter_probability:   counterBelief.probability,
      disagreement_score:    disagreement,
      // HIGH disagreement = HIGH uncertainty = volatile market
      implied_volatility:    disagreement > 0.25 ? "HIGH" : "NORMAL",
      narrative: `Counter thesis: ${counterScenario}. ` +
                 `If correct, probability inverts to ${(counterBelief.probability * 100).toFixed(0)}%.`,
    };
  }

  private async generateCounterScenario(
    hypothesis: Hypothesis,
    signals: Signal[]
  ): Promise<string> {
    const COUNTER_TEMPLATES: Record<string, string> = {
      agriculture: "Surprise rainfall recovery stabilizes supply",
      fx:          "CBK FX intervention caps KES weakness",
      macro:       "MPC holds rates — inflation viewed as transitory",
      energy:      "EPRA review delays price hike",
    };
    return COUNTER_TEMPLATES[hypothesis.category] ?? "Market conditions reverse unexpectedly";
  }
}
```

---

### Agent 4 — Trader Agent (Execution + Arc Settlement)

```typescript
class TraderAgent {
  /**
   * Converts Bayesian output into an executable trade.
   * Interfaces with Arc for on-chain settlement.
   */

  async decide(belief: BeliefOutput): Promise<TradeDecision> {
    const market_price = await this.marketFeed.getPrice(belief.hypothesis.market_id);
    const edge         = belief.probability - market_price;
    const kelly        = this.computeKelly(belief.probability, market_price);

    if (Math.abs(edge) < MIN_EDGE || belief.confidence < MIN_CONFIDENCE) {
      return { recommendation: "NO_BET", edge, reason: this.explainNobet(edge, belief.confidence) };
    }

    const direction = edge > 0 ? "BET_YES" : "BET_NO";
    const sizeUSDC  = kelly * this.bankroll;

    // Prepare Arc transaction
    const arcTx = await this.arcClient.prepareTrade({
      market_id:  belief.hypothesis.market_id,
      direction,
      amount_usdc: sizeUSDC,
      wallet:      this.wallet.address,
    });

    return {
      recommendation: direction,
      edge,
      kelly_fraction: kelly,
      size_usdc:      sizeUSDC,
      arc_tx_payload: arcTx,
      market_price,
      agent_probability: belief.probability,
    };
  }

  private computeKelly(p: number, q_market: number): number {
    const odds = q_market / (1 - q_market);  // market implied odds
    const k    = (p - (1 - p) / odds) * 0.5; // half-Kelly
    return Math.max(0, Math.min(0.10, k));    // cap at 10% bankroll
  }
}
```

---

### Agent 5 — Trace Agent (Reasoning as On-Chain Asset)

This is the killer differentiator. Every prediction cycle produces a full reasoning trace that gets published.

```typescript
class TraceAgent {
  /**
   * Captures, hashes, and publishes the full reasoning trace.
   * Trace hash stored on Arc. Full trace optionally on IPFS.
   */

  async publish(trace: ReasoningStep[]): Promise<TracePublication> {
    const tracePayload = {
      version:        "1.0.0",
      system:         "africast",
      timestamp:      new Date().toISOString(),
      steps:          trace,
      signal_count:   trace.length,
      final_probability: trace[trace.length - 1]?.posterior_prob,
    };

    // 1. Serialize + hash
    const serialized  = JSON.stringify(tracePayload);
    const traceHash   = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(serialized));

    // 2. Store full trace on IPFS (optional, demo: skip)
    let ipfsCid: string | null = null;
    if (this.config.publishToIPFS) {
      ipfsCid = await this.ipfsClient.add(serialized);
    }

    // 3. Store hash on Arc chain (< $0.01 per tx)
    const arcReceipt = await this.arcClient.sendTransaction({
      to:   ARC_TRACE_REGISTRY_CONTRACT,
      data: this.encodeTraceLog(traceHash, ipfsCid),
    });

    return {
      trace_hash:   traceHash,
      ipfs_cid:     ipfsCid,
      arc_tx_hash:  arcReceipt.transactionHash,
      arc_block:    arcReceipt.blockNumber,
      published_at: new Date().toISOString(),
      verifiable:   true,
    };
  }

  private encodeTraceLog(hash: string, cid: string | null): string {
    // ABI encode: publishTrace(bytes32 hash, string cid)
    const iface = new ethers.utils.Interface([
      "function publishTrace(bytes32 traceHash, string ipfsCid)"
    ]);
    return iface.encodeFunctionData("publishTrace", [hash, cid ?? ""]);
  }
}
```

---

## 4. Package Layer

### `agent-flow-js` — Orchestration

```typescript
// Published npm package — orchestration layer

import { AgentFlow } from "agent-flow-js";

const system = new AgentFlow({
  agents: {
    research:   new ResearchAgent(intel),
    hypothesis: new HypothesisAgent(intel),
    trader:     new TraderAgent(arcClient),
    trace:      new TraceAgent(arcClient),
  },
  config: {
    min_edge:       0.08,
    min_confidence: 0.50,
    half_kelly:     true,
    trace_on_chain: true,
  }
});

const result = await system.run("Should I trade USDKES this week?");

// Full trace with latency
console.log(system.getTrace());
// {
//   steps: [...],
//   latency_ms: { research: 120, hypothesis: 80, bayesian: 40, trader: 30, trace: 200 },
//   total_ms: 470
// }
```

**API surface:**

```typescript
interface AgentFlow {
  run(input: string): Promise<SystemOutput>;
  addStep(name: string, agent: Agent): void;
  getTrace(): TraceReport;              // per-step latency + I/O
  getLatency(): LatencyReport;          // breakdown by agent
  reset(): void;
}
```

---

### `agent-intel-core` — Thinking

```typescript
// Published npm package — intelligence layer

import { AgentIntel } from "agent-intel-core";

const intel = new AgentIntel({
  datasets: ["cbk", "knbs", "fao", "chirps"],
  region:   "KE",
});

// Africast-style structured questioning
const questions = await intel.ask({
  context: "Kenya maize prices",
  goal:    "find supply shock signals",
});

// Dataset reasoning
intel.connectDataset(cbkAPI);
const analysis = await intel.query("Why is KES weakening this week?");

// Hypothesis generation
const hypothesis = await intel.hypothesize({
  event:    "CBK holds rates",
  horizon:  "30d",
  category: "macro",
});

// Full trace of the thinking process
console.log(intel.getTrace());
```

**API surface:**

```typescript
interface AgentIntel {
  ask(context: QuestionContext): Promise<MarketQuestion[]>;
  query(natural_language: string): Promise<Analysis>;
  hypothesize(event: EventContext): Promise<Hypothesis>;
  connectDataset(source: DataSource): void;
  challenge(hypothesis: Hypothesis): Promise<CounterHypothesis>;
  getTrace(): IntelTrace;
}
```

---

## 5. Bayesian Engine (Complete)

### Core Math

```python
# engine/bayesian.py

import math
from dataclasses import dataclass, field
from typing import List, Tuple
from datetime import datetime

@dataclass
class BeliefState:
    probability: float
    log_odds:    float
    confidence:  float
    trace:       List[dict] = field(default_factory=list)

# ── Primitives ──────────────────────────────────────────────────────────────

def to_logodds(p: float) -> float:
    p = max(0.001, min(0.999, p))
    return math.log(p / (1 - p))

def to_prob(lo: float) -> float:
    return 1 / (1 + math.exp(-lo))

# ── Quality-scaled impact ────────────────────────────────────────────────────

def effective_impact(signal, quality: float) -> float:
    age_h         = (datetime.utcnow() - signal.created_at).total_seconds() / 3600
    recency_boost = 1.2 if age_h < 6 else 1.0
    raw           = signal.impact * quality * recency_boost
    return max(-1.5, min(1.5, raw))  # single-signal cap

# ── Belief Update ────────────────────────────────────────────────────────────

def update_belief(
    prior:         float,
    signals:       list,
    quality_scores: dict
) -> Tuple[BeliefState, List[dict]]:
    
    log_odds = to_logodds(prior)
    trace    = []

    for i, sig in enumerate(signals):
        q      = quality_scores[sig.signal_id]
        impact = effective_impact(sig, q)

        prev_lo   = log_odds
        log_odds += impact
        posterior = to_prob(log_odds)

        trace.append({
            "step":              i + 1,
            "signal_id":         sig.signal_id,
            "signal_name":       sig.name,
            "quality":           round(q, 3),
            "raw_impact":        round(sig.impact, 3),
            "effective_impact":  round(impact, 3),
            "prior_logodds":     round(prev_lo, 4),
            "posterior_logodds": round(log_odds, 4),
            "posterior_prob":    round(posterior, 4),
            "narrative":         (
                f"{sig.name} (q={q:.2f}) "
                f"shifts belief {impact:+.3f} log-odds → "
                f"P(H) = {posterior:.1%}"
            ),
        })

    confidence = sum(quality_scores.values()) / len(quality_scores) if quality_scores else 0.0

    return BeliefState(
        probability = to_prob(log_odds),
        log_odds    = log_odds,
        confidence  = round(confidence, 3),
        trace       = trace,
    ), trace

# ── Edge + Kelly ─────────────────────────────────────────────────────────────

def compute_edge(agent_prob: float, market_prob: float) -> float:
    return round(agent_prob - market_prob, 4)

def compute_kelly(agent_prob: float, market_prob: float, fraction: float = 0.5) -> float:
    if market_prob <= 0 or market_prob >= 1:
        return 0.0
    market_odds = market_prob / (1 - market_prob)
    k = (agent_prob - (1 - agent_prob) / market_odds) * fraction
    return round(max(0.0, min(0.10, k)), 4)

# ── Decision Gate ─────────────────────────────────────────────────────────────

MIN_EDGE       = 0.08
MIN_CONFIDENCE = 0.50

def make_decision(edge: float, confidence: float) -> str:
    if abs(edge) < MIN_EDGE:
        return "NO_BET"
    if confidence < MIN_CONFIDENCE:
        return "NO_BET"
    return "BET_YES" if edge > 0 else "BET_NO"
```

### Competing Beliefs (This is What Makes It a Market)

```python
# Multiple agents produce competing beliefs — Bayesian aggregation

def aggregate_beliefs(belief_set: List[BeliefState]) -> BeliefState:
    """
    Combines beliefs from Research + Hypothesis agents.
    Disagreement = uncertainty signal.
    """
    probs      = [b.probability for b in belief_set]
    weights    = [b.confidence for b in belief_set]
    total_w    = sum(weights)

    # Weighted average probability
    weighted_p = sum(p * w for p, w in zip(probs, weights)) / total_w

    # Disagreement → implied volatility
    disagreement = max(probs) - min(probs)

    return BeliefState(
        probability = weighted_p,
        log_odds    = to_logodds(weighted_p),
        confidence  = total_w / len(belief_set),
        trace       = [{
            "step":          "AGGREGATION",
            "agent_beliefs": [round(p, 3) for p in probs],
            "weights":       [round(w, 3) for w in weights],
            "final_prob":    round(weighted_p, 3),
            "disagreement":  round(disagreement, 3),
            "implied_vol":   "HIGH" if disagreement > 0.25 else "NORMAL",
        }]
    )
```

---

## 6. On-Chain Integration — Arc + USDC

### Arc Client Setup

```typescript
// lib/arc-client.ts

import { ethers } from "ethers";

const ARC_TESTNET_RPC   = process.env.RPC;                          // from arc-canteen CLI
const ARC_CHAIN_ID      = 0x4cef52;                                 // Arc testnet
const TRACE_REGISTRY    = "0xYOUR_DEPLOYED_CONTRACT";

export class ArcClient {
  private provider: ethers.providers.JsonRpcProvider;
  private signer:   ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(ARC_TESTNET_RPC);
    this.signer   = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
  }

  // ── Trace Publication ──────────────────────────────────────────────────────

  async publishTrace(traceHash: string, ipfsCid: string = ""): Promise<ethers.ContractReceipt> {
    const registry = new ethers.Contract(
      TRACE_REGISTRY,
      ["function publishTrace(bytes32, string) external"],
      this.signer
    );

    const tx      = await registry.publishTrace(traceHash, ipfsCid);
    const receipt = await tx.wait();

    return receipt;
    // Arc: sub-second finality, ~$0.01 cost
  }

  // ── Trade Settlement (USDC) ───────────────────────────────────────────────

  async settleTrade(params: {
    market_id:   string;
    direction:   "BET_YES" | "BET_NO";
    amount_usdc: number;
  }): Promise<string> {
    
    const usdc = new ethers.Contract(
      ARC_USDC_ADDRESS,
      ["function transfer(address, uint256) returns (bool)"],
      this.signer
    );

    // USDC has 6 decimals
    const amount = ethers.utils.parseUnits(params.amount_usdc.toString(), 6);

    // For demo: transfer to market escrow contract
    const tx = await usdc.transfer(params.market_id, amount);
    return tx.hash;
  }

  // ── Balance Check ─────────────────────────────────────────────────────────

  async getUSDCBalance(): Promise<number> {
    const usdc    = new ethers.Contract(ARC_USDC_ADDRESS, ERC20_ABI, this.provider);
    const balance = await usdc.balanceOf(this.signer.address);
    return parseFloat(ethers.utils.formatUnits(balance, 6));
  }

  // ── RPC Utilities ─────────────────────────────────────────────────────────

  async blockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async getGasPrice(): Promise<string> {
    const price = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(price, "gwei") + " gwei";
  }
}
```

### Smart Contract — TraceRegistry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AfricaCastTraceRegistry
 * @notice Stores keccak256 hashes of AfricaCast reasoning traces on Arc.
 *         Full traces stored on IPFS; only the hash lives on-chain.
 *         Verifiable, immutable, and costs ~$0.01 per publication on Arc.
 */
contract AfricaCastTraceRegistry {

    struct TraceRecord {
        bytes32 traceHash;
        string  ipfsCid;
        address publisher;
        uint256 blockNumber;
        uint256 timestamp;
    }

    mapping(bytes32 => TraceRecord) public traces;
    bytes32[]                       public traceIndex;

    event TracePublished(
        bytes32 indexed traceHash,
        address indexed publisher,
        string          ipfsCid,
        uint256         blockNumber
    );

    function publishTrace(bytes32 traceHash, string calldata ipfsCid) external {
        require(traces[traceHash].timestamp == 0, "Trace already exists");

        traces[traceHash] = TraceRecord({
            traceHash:   traceHash,
            ipfsCid:     ipfsCid,
            publisher:   msg.sender,
            blockNumber: block.number,
            timestamp:   block.timestamp
        });

        traceIndex.push(traceHash);

        emit TracePublished(traceHash, msg.sender, ipfsCid, block.number);
    }

    function verify(bytes32 traceHash) external view returns (bool, uint256) {
        TraceRecord memory r = traces[traceHash];
        return (r.timestamp > 0, r.blockNumber);
    }

    function totalTraces() external view returns (uint256) {
        return traceIndex.length;
    }
}
```

### Arc CLI Integration

```bash
# From arc-canteen CLI (installed via uv)

# Check balance + block
arc-canteen rpc eth_blockNumber
arc-canteen rpc eth_getBalance '["0xYOUR_WALLET", "latest"]'

# After deploying contract, verify on testnet.arcscan.app
forge verify-contract \
  --chain-id 0x4cef52 \
  --rpc-url $RPC \
  0xYOUR_CONTRACT \
  src/AfricaCastTraceRegistry.sol:AfricaCastTraceRegistry

# Submit traction updates
arc-canteen update-traction
arc-canteen update-product
```

---

## 7. Trace Publication Protocol

### Trace Schema (Complete)

```typescript
interface PublishedTrace {
  // Identity
  trace_id:   string;           // UUID v4
  version:    string;           // "1.0.0"
  system:     "africast";
  
  // Market
  hypothesis: {
    question:         string;
    market_id:        string;
    platform:         string;
    resolution_date:  string;
  };
  
  // Signals used
  signals: Array<{
    name:      string;
    source:    string;
    quality:   number;
    impact:    number;
    region:    string[];
  }>;
  
  // Bayesian steps
  steps: Array<{
    step:              number;
    signal_name:       string;
    quality:           number;
    effective_impact:  number;
    posterior_prob:    number;
    narrative:         string;
  }>;
  
  // Outputs
  final_probability:  number;
  market_price:       number;
  edge:               number;
  recommendation:     string;
  kelly_fraction:     number;
  
  // Challenge
  counter_scenario:   string;
  counter_prob:       number;
  disagreement:       number;
  
  // Latency (ms per agent)
  latency: {
    research:   number;
    hypothesis: number;
    bayesian:   number;
    trader:     number;
    total:      number;
  };
  
  // On-chain proof
  trace_hash:  string;    // keccak256 of this payload
  ipfs_cid:    string;    // full trace on IPFS
  arc_tx_hash: string;    // Arc chain tx
  arc_block:   number;
  
  timestamp: string;      // ISO 8601 UTC
}
```

### Verification Flow

```typescript
async function verifyTrace(traceHash: string): Promise<VerificationResult> {
  // 1. Check Arc chain
  const [exists, blockNumber] = await registry.verify(traceHash);
  
  // 2. Fetch from IPFS
  const record   = await arcClient.getTraceRecord(traceHash);
  const fullTrace = await ipfs.cat(record.ipfsCid);
  
  // 3. Recompute hash
  const recomputed = keccak256(toUtf8Bytes(fullTrace));
  const valid      = recomputed === traceHash;
  
  return {
    valid,
    on_chain:    exists,
    block:       blockNumber,
    published_at: new Date(record.timestamp * 1000).toISOString(),
  };
}
```

---

## 8. UI State Machine + Latency Architecture

### State Machine

```typescript
// The UI has exactly 6 states. Every transition is tracked with timestamps.

type UIState =
  | "IDLE"                // waiting for input
  | "RESEARCHING"         // Research Agent running (signal fetch)
  | "CHALLENGING"         // Hypothesis Agent running (counter-thesis)
  | "COMPUTING"           // Bayesian Engine running (belief update)
  | "DECIDING"            // Trader Agent running (edge + Kelly)
  | "PUBLISHING"          // Trace Agent publishing to Arc
  | "COMPLETE";           // full output ready

interface StateTransition {
  from:      UIState;
  to:        UIState;
  timestamp: number;     // Date.now()
  duration?: number;     // ms, computed on transition out
}

class UIStateMachine {
  private state:       UIState = "IDLE";
  private transitions: StateTransition[] = [];
  private startTimes:  Record<string, number> = {};

  transition(to: UIState): void {
    const now      = Date.now();
    const duration = this.startTimes[this.state]
      ? now - this.startTimes[this.state]
      : undefined;

    this.transitions.push({ from: this.state, to, timestamp: now, duration });
    this.startTimes[to] = now;
    this.state = to;

    // Emit for UI binding
    this.emit("stateChange", { state: to, duration });
  }

  getLatencyReport(): LatencyReport {
    return {
      research:   this.getDuration("RESEARCHING"),
      hypothesis: this.getDuration("CHALLENGING"),
      bayesian:   this.getDuration("COMPUTING"),
      trader:     this.getDuration("DECIDING"),
      publishing: this.getDuration("PUBLISHING"),
      total:      this.getTotalDuration(),
    };
  }

  private getDuration(state: UIState): number {
    return this.transitions.find(t => t.from === state)?.duration ?? 0;
  }
}
```

### State → UI Mapping

```typescript
const STATE_UI_CONFIG: Record<UIState, StateConfig> = {
  IDLE: {
    label:       "Ready",
    color:       "#4B5563",
    indicator:   "dot-idle",
    panel_left:  "empty_trace",
    panel_right: "empty_market",
  },
  RESEARCHING: {
    label:       "Gathering Signals",
    color:       "#3B82F6",
    indicator:   "pulse-blue",
    panel_left:  "trace_streaming",
    panel_right: "loading_skeleton",
    message:     "Research Agent → Fetching CBK, KNBS, weather signals...",
  },
  CHALLENGING: {
    label:       "Stress Testing",
    color:       "#F59E0B",
    indicator:   "pulse-amber",
    panel_left:  "trace_streaming",
    panel_right: "counter_thesis_forming",
    message:     "Hypothesis Agent → Generating counter-thesis...",
  },
  COMPUTING: {
    label:       "Updating Beliefs",
    color:       "#8B5CF6",
    indicator:   "pulse-purple",
    panel_left:  "trace_live",
    panel_right: "probability_computing",
    message:     "Bayesian Engine → Aggregating 8 signals...",
  },
  DECIDING: {
    label:       "Computing Edge",
    color:       "#10B981",
    indicator:   "pulse-green",
    panel_left:  "trace_complete",
    panel_right: "trade_forming",
    message:     "Trader Agent → Edge = agent_prob − market_price...",
  },
  PUBLISHING: {
    label:       "Publishing to Arc",
    color:       "#EF4444",
    indicator:   "pulse-red",
    panel_left:  "trace_complete",
    panel_right: "arc_pending",
    message:     "Trace Agent → Hashing reasoning → Arc chain...",
  },
  COMPLETE: {
    label:       "Complete",
    color:       "#10B981",
    indicator:   "dot-green",
    panel_left:  "trace_final",
    panel_right: "trade_final",
    message:     null,
  },
};
```

### Latency Display Component

```tsx
// components/LatencyPanel.tsx

interface LatencyReport {
  research:   number;   // ms
  hypothesis: number;
  bayesian:   number;
  trader:     number;
  publishing: number;
  total:      number;
}

const LatencyPanel = ({ report }: { report: LatencyReport }) => {
  const bars = [
    { label: "Research",   ms: report.research,   color: "#3B82F6", icon: "🔍" },
    { label: "Hypothesis", ms: report.hypothesis, color: "#F59E0B", icon: "🧪" },
    { label: "Bayesian",   ms: report.bayesian,   color: "#8B5CF6", icon: "⚖️" },
    { label: "Trader",     ms: report.trader,     color: "#10B981", icon: "📊" },
    { label: "Arc Publish",ms: report.publishing, color: "#EF4444", icon: "⛓️" },
  ];

  const max = Math.max(...bars.map(b => b.ms));

  return (
    <div className="latency-panel">
      <div className="panel-header">
        <span className="label">Step Latency</span>
        <span className="total">{report.total}ms total</span>
      </div>
      {bars.map(bar => (
        <div key={bar.label} className="latency-row">
          <span className="step-icon">{bar.icon}</span>
          <span className="step-label">{bar.label}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width:      `${(bar.ms / max) * 100}%`,
                background: bar.color,
              }}
            />
          </div>
          <span className="step-ms">{bar.ms}ms</span>
        </div>
      ))}
    </div>
  );
};
```

### Demo UI Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  AfricaCast              [●] COMPUTING   470ms total             │
├────────────────────────────────────┬─────────────────────────────┤
│  INPUT                             │  MARKET OUTPUT              │
│  ┌──────────────────────────────┐  │                             │
│  │ "Will KES weaken this week?" │  │  USDKES > 158 by May 20     │
│  └──────────────────────────────┘  │                             │
│                                    │  Agent:  68%                │
├────────────────────────────────────│  Market: 55%                │
│  TRACE PANEL          [LIVE ●]     │  Edge:   +13%  ← BET YES    │
│                                    │                             │
│  Step 1 · Research     [120ms]     │  Kelly: 0.052               │
│  → CBK reserves ↓ 2.1%           │  Size:  $52 USDC            │
│    impact: +0.62 · q=0.85        │                             │
│  → Rainfall deficit -1.8σ        │─────────────────────────────│
│    impact: +0.48 · q=0.79        │  COUNTER THESIS             │
│                                    │  "CBK intervenes"           │
│  Step 2 · Hypothesis   [80ms]      │  Counter prob: 41%          │
│  → Counter: CBK caps weakness     │  Disagreement: 0.27 HIGH    │
│    counter_prob: 0.41             │                             │
│    disagreement: 0.27 → HIGH VOL  │─────────────────────────────│
│                                    │  [Execute — USDC on Arc]    │
│  Step 3 · Bayesian     [40ms]      │  [Publish Trace → Arc ⛓️]   │
│  → Prior: 0.50                    │                             │
│  → Posterior: 0.68                │  Arc tx: 0xabc1...          │
│  → Log-odds shift: +0.74          │  Block: #1,847,221          │
│                                    │  Trace: 0x9f3d...           │
│  Step 4 · Trader       [30ms]      │                             │
│  → Edge: +0.13 ✓                  │─────────────────────────────│
│  → Kelly: 0.052                   │  LATENCY                    │
│  → Decision: BET_YES              │  Research   [████░] 120ms   │
│                                    │  Hypothesis [███░░]  80ms   │
│  Step 5 · Arc Publish  [200ms]     │  Bayesian   [██░░░]  40ms   │
│  → Trace hash: 0x9f3d...          │  Trader     [█░░░░]  30ms   │
│  → Arc tx: 0xabc1...              │  Arc Pub    [████░] 200ms   │
│  → Block: #1,847,221              │  ─────────────────────      │
│                                    │  Total:            470ms    │
└────────────────────────────────────┴─────────────────────────────┘
```

---

## 9. Demo Flow

### Localhost Demo (Phase 1 — No real chain)

```bash
# 1. Install dependencies
npm install
pip install -r requirements.txt

# 2. Seed mock data (CBK CSVs, CHIRPS rainfall, FX rates)
python scripts/seed_demo_data.py

# 3. Start agent backend
uvicorn main:app --reload --port 8000

# 4. Start frontend
npm run dev

# 5. Navigate to http://localhost:3000
```

**Demo input sequence (3 questions that show all three verticals):**

```
Q1: "Will CBK raise rates by ≥50bps next MPC meeting?"
    → Shows: macro signals, interest rate research, moderate confidence

Q2: "Will maize prices rise >5% this quarter?"
    → Shows: agricultural signals, weather data, high edge scenario

Q3: "Will USD/KES exceed 158 within 30 days?"
    → Shows: FX signals, counter-thesis, competing probabilities
```

### Mainnet Demo (Phase 2 — Arc testnet)

```typescript
// 1. Install arc-canteen CLI
// uv tool install git+https://github.com/the-canteen-dev/ARC-cli

// 2. Login + get RPC endpoint
// arc-canteen login
// arc-canteen shell-init >> ~/.zshrc

// 3. Deploy TraceRegistry contract
// forge create src/AfricaCastTraceRegistry.sol:AfricaCastTraceRegistry \
//   --rpc-url $RPC --private-key $PRIVATE_KEY

// 4. Run one full prediction cycle with trace publication
const result = await system.run("Will CBK raise rates by ≥50bps?");

// 5. Verify on testnet.arcscan.app
console.log(`Verify: https://testnet.arcscan.app/tx/${result.trace.arc_tx_hash}`);
```

### 2-Minute Demo Script

```
0:00 — Show the input box
  Say: "AfricaCast finds mispriced prediction markets using African data."

0:10 — Type: "Will USD/KES exceed 158 within 30 days?"
  Hit enter.

0:15 — Trace panel starts streaming, state = RESEARCHING
  Say: "Research Agent is gathering CBK reserves, FX sentiment, local news."

0:35 — State = CHALLENGING
  Say: "Hypothesis Agent now challenges the thesis — it generates a counter scenario."

0:50 — State = COMPUTING
  Say: "Bayesian Engine updates beliefs across 8 signals. Watch the log-odds shift."

1:10 — State = DECIDING
  Say: "Trader Agent computes edge: agent says 68%, market says 55%. That's +13%."

1:25 — State = PUBLISHING, Arc tx appears
  Say: "Every reasoning step gets hashed and stored on Arc. Under a cent. Immutable."

1:40 — State = COMPLETE
  Say: "This is not a signal. This is proof of thought."

1:50 — Click "Verify Trace"
  Show testnet.arcscan.app with the tx.
  Say: "Anyone can verify why this trade was made, not just that it was made."

2:00 — Done.
```

---

## 10. Africast Question Library

### Macro — CBK / KNBS

```typescript
const MACRO_QUESTIONS = [
  // Interest rates
  "Will CBK raise rates by ≥50bps in next MPC meeting?",
  "Will CBK hold rates unchanged this quarter?",
  "Will the CBK rate decision surprise markets (deviation from consensus)?",

  // Inflation
  "Will Kenya CPI inflation exceed 6% in next release?",
  "Will food inflation increase MoM next print?",
  "Will core inflation (excl. food+energy) diverge from headline?",

  // Liquidity
  "Will interbank overnight rate exceed 12% this month?",
  "Will Kenya T-Bill 91-day yield rise above 15%?",

  // Reserves
  "Will CBK FX reserves fall below 4 months import cover?",
  "Will CBK intervene in the FX market this week?",
];
```

### Agriculture — The Secret Weapon

```typescript
const AGRICULTURE_QUESTIONS = [
  // Crops
  "Will maize production drop by >10% this season?",
  "Will tea export volumes increase QoQ?",
  "Will NCPB maize price floor be breached?",

  // Weather impact
  "Will drought conditions reduce Rift Valley yield by >10%?",
  "Will rainfall exceed seasonal averages in the long rains?",
  "Will La Niña conditions extend into Q3?",

  // Food prices
  "Will maize flour (2kg) prices rise in Nairobi next month?",
  "Will vegetable prices spike due to supply disruption?",
  "Will EPRA fuel increase pass through to food transport costs?",
];
```

### FX + Trade

```typescript
const FX_QUESTIONS = [
  "Will USD/KES exceed 158 within 30 days?",
  "Will KES strengthen after next CBK rate decision?",
  "Will EAC intra-regional trade volumes drop this quarter?",
  "Will Mombasa Port throughput decline due to shilling weakness?",
  "Will remittance inflows slow due to USD strength?",
];
```

### INFUSE (Energy Questions)

```typescript
const ENERGY_QUESTIONS = [
  "Will EPRA increase fuel prices next review cycle?",
  "Will KPLC experience load shedding >4 hours/day this week?",
  "Will peak electricity tariffs increase this quarter?",
  "Will energy credit demand exceed supply in Ruiru nodes today?",
  "Will solar irradiance in Nairobi support >85% generation efficiency this week?",
];
```

### IMARA AI Meta-Questions (Agent Self-Evaluation)

```typescript
const META_QUESTIONS = [
  "Is this prediction +EV given current signal confidence?",
  "Should position size increase given low disagreement between agents?",
  "Is market in a high volatility regime (disagreement > 0.25)?",
  "Has CBK data source maintained >0.80 reliability this month?",
  "Should the agent reduce exposure pending next MPC announcement?",
  "Is the CHIRPS rainfall dataset fresher than 6 hours?",
];
```

### Structured Output Format (All Questions)

```typescript
interface AfroCastQuestion {
  question:       string;
  probability:    number;        // agent estimate
  confidence:     number;        // signal quality aggregate
  time_horizon:   string;        // "7d" | "30d" | "90d"
  data_sources:   string[];      // ["CBK", "KNBS", "CHIRPS"]
  signals_used:   number;        // count of signals in this prediction
  action:         "BUY" | "SELL" | "HOLD" | "NO_BET";
  edge:           number;        // agent_prob - market_price
  kelly_fraction: number;
  reasoning_hash: string;        // 0x... keccak256 trace hash
  arc_tx_hash:    string;        // on-chain proof
  counter_thesis: string;        // competing hypothesis
  counter_prob:   number;
}
```

---

## 11. Monetization — Builder Codes

### How It Works

From Polymarket V2 docs: builder codes allow any agent that recommends a trade to earn USDC on every fill originating from that recommendation. No custody, no token — pure on-chain attribution.

```typescript
// Monetization layer: AfricaCast as a Polymarket V2 builder

class BuilderCodeLayer {
  private BUILDER_ADDRESS = process.env.BUILDER_WALLET;

  // Wrap trade recommendation with builder attribution
  async createSignedFeed(prediction: Prediction): Promise<SignedFeed> {
    const payload = {
      market_id:    prediction.hypothesis.market_id,
      outcome:      prediction.recommendation === "BET_YES" ? "YES" : "NO",
      probability:  prediction.posterior,
      edge:         prediction.edge,
      trace_hash:   prediction.trace.trace_hash,   // verifiable reasoning
      builder:      this.BUILDER_ADDRESS,
      timestamp:    Date.now(),
    };

    const signature = await this.signer.signMessage(
      JSON.stringify(payload)
    );

    return { ...payload, signature };
  }

  // Builder fee accrues per fill on Polymarket
  // AfricaCast earns USDC every time a user acts on a recommendation
}
```

### Revenue Model

```
Tier 1 — FREE
  ↳ Delayed predictions (24h lag)
  ↳ Basic signal count
  ↳ No trace verification

Tier 2 — KES 2,500/month (Decision Layer)
  ↳ Real-time predictions
  ↳ Full reasoning trace
  ↳ Agent recommendations
  ↳ 3 verticals (macro, agri, fx)

Tier 3 — Performance-based
  ↳ Builder codes: % of USDC earned per Polymarket fill
  ↳ Signal API: per-call pricing for funds/bots
  ↳ Trace market: earn when others trade your hypothesis

Performance alignment:
  AfricaCast only earns when the user earns.
```

---

## 12. Kenya Gov API Dataset Registry

| Source | Dataset | URL / Access | Format | Update Freq | Credibility |
|---|---|---|---|---|---|
| CBK | Monetary Policy Rate | cbk.go.ke/monetary-policy | PDF/CSV | MPC meeting (~8x/yr) | 0.90 |
| CBK | Forex Reserves | cbk.go.ke/statistics | CSV | Weekly | 0.90 |
| CBK | Interbank Rate | cbk.go.ke/statistics | CSV | Daily | 0.88 |
| CBK | M-Pesa Volume | cbk.go.ke/statistics | Monthly PDF | Monthly | 0.85 |
| KNBS | CPI / Inflation | knbs.or.ke/statistics | CSV | Monthly | 0.88 |
| KNBS | Maize Production | knbs.or.ke/agriculture | Annual report | Seasonal | 0.82 |
| EPRA | Fuel Pump Prices | epra.go.ke/petroleum | PDF | Bi-monthly | 0.87 |
| KMD | Rainfall Forecast | meteo.go.ke | API/RSS | Daily | 0.80 |
| CHIRPS | Satellite Rainfall | chc.ucsb.edu/CHIRPS-2.0 | GeoTIFF/API | Daily | 0.82 |
| FAO | Maize/Crop Prices | fao.org/giews | API | Weekly | 0.85 |
| WFP | Food Price Monitor | dataviz.vam.wfp.org | API | Weekly | 0.83 |
| World Bank | Pink Sheet Commodities | worldbank.org/commodities | CSV | Monthly | 0.85 |
| NSE | Equity Index Data | nse.co.ke/market-data | API | Daily | 0.80 |
| Open Exchange | USD/KES, USD/TZS | openexchangerates.org | REST API | Hourly | 0.85 |
| RSS (Nation) | Local News | nation.africa/feed | RSS | Continuous | 0.55 |
| RSS (Standard) | Local News | standardmedia.co.ke/rss | RSS | Continuous | 0.52 |
| RSS (BD) | Business News | businessdailyafrica.com/rss | RSS | Continuous | 0.60 |

### Dataset Connection Pattern

```python
# Each dataset follows the same connector interface

class CBKMonetaryPolicyConnector:
    source_id         = "cbk-mpc-rate"
    base_credibility  = 0.90
    decay_half_life_hours = 720   # rate holds for ~30 days

    async def fetch(self) -> list[Signal]:
        # 1. Download latest CBK press release PDF
        # 2. Extract rate decision (regex or LLM)
        # 3. Return Signal with impact calibrated to hypothesis
        rate_change_bps = self._parse_rate_change(pdf_text)
        return [Signal(
            name      = "CBK Rate Decision",
            value     = rate_change_bps,
            impact    = self._calibrate_impact(rate_change_bps),
            direction = "bullish" if rate_change_bps > 0 else "bearish",
            source_id = self.source_id,
        )]
```

---

## 13. npm Package Specifications

### `agent-flow-js` — v0.1.0

```
/packages/agent-flow-js/
  src/
    AgentFlow.ts         ← main orchestrator class
    Timer.ts             ← per-step latency tracking
    StateMachine.ts      ← UI state machine
    MessageBus.ts        ← inter-agent protocol
    types.ts             ← shared type definitions
  examples/
    trading-agent.ts     ← AfricaCast usage example
    email-agent.ts       ← generic usage example
  README.md
  package.json
```

```json
{
  "name": "agent-flow-js",
  "version": "0.1.0",
  "description": "Transparent multi-agent orchestration with step-level tracing",
  "keywords": ["agents", "LLM", "tracing", "orchestration", "AI"],
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

### `agent-intel-core` — v0.1.0

```
/packages/agent-intel-core/
  src/
    AgentIntel.ts        ← main intelligence class
    QuestionEngine.ts    ← Africast-style question generation
    HypothesisEngine.ts  ← counter-thesis generation
    DatasetConnector.ts  ← pluggable data source interface
    IntelTrace.ts        ← reasoning trace capture
  datasets/
    templates/
      macro.ts           ← CBK/KNBS question templates
      agriculture.ts     ← crop/weather templates
      fx.ts              ← currency templates
  README.md
  package.json
```

### Monorepo Structure

```
/africast/
  apps/
    web/                 ← Next.js frontend (AfricaCast dashboard)
    api/                 ← FastAPI backend (agents + Bayesian engine)
  packages/
    agent-flow-js/       ← npm package: orchestration
    agent-intel-core/    ← npm package: intelligence
  contracts/
    AfricaCastTraceRegistry.sol
    foundry.toml
  agents/
    orchestrator.py
    research.agent.py
    hypothesis.agent.py
    trader.agent.py
    trace.agent.py
  engine/
    bayesian.py
    quality.py
    signals.py
  scripts/
    seed_demo_data.py
    deploy_contract.sh
  package.json          ← Turborepo workspace root
  turbo.json
```

---

## 14. Deployment Topology

```
LOCAL DEMO (localhost)
  ├── Next.js :3000          ← demo UI
  ├── FastAPI :8000          ← agent backend
  ├── PostgreSQL :5432       ← signal store
  └── Redis :6379            ← inter-agent bus (mock)

TESTNET (Arc testnet)
  ├── Same local stack
  ├── Arc RPC via $RPC       ← from arc-canteen login
  ├── Deployed TraceRegistry ← testnet.arcscan.app
  └── USDC faucet            ← testnet tokens

PRODUCTION (future)
  ├── Vercel                 ← frontend
  ├── Railway / Fly.io       ← FastAPI backend
  ├── Neon                   ← PostgreSQL + TimescaleDB
  ├── Upstash                ← Redis
  └── Arc mainnet            ← trace publication + settlement
```

### Environment Variables

```bash
# .env.local (never commit)

# Arc
RPC=https://...           # from arc-canteen rpc-url
PRIVATE_KEY=0x...         # agent wallet
TRACE_REGISTRY=0x...      # deployed contract address
ARC_USDC_ADDRESS=0x...    # USDC on Arc

# Data sources
CBK_ENDPOINT=https://cbk.go.ke/...
OPEN_EXCHANGE_APP_ID=...
CHIRPS_API_KEY=...

# Agent config
MIN_EDGE=0.08
MIN_CONFIDENCE=0.50
HALF_KELLY=true
PUBLISH_TO_IPFS=true

# Polymarket builder
BUILDER_WALLET=0x...
BUILDER_CODE=...
```

---

## Quick Reference — Hackathon Checklist

### Agentic Sophistication (30%)
- [x] 5-agent system with distinct roles
- [x] Hypothesis Agent generating counter-theses (rare)
- [x] Bayesian belief aggregation across competing agents
- [x] Dynamic routing (intent classification → agent selection)
- [x] Confidence gate preventing low-quality trades

### Traction (30%)
- [ ] 5 users interacting with demo by Day 7
- [ ] 20+ predictions generated on Arc testnet
- [ ] 1 blog/Twitter post showing live trace
- [ ] Arc CLI `update-traction` submitted

### Circle Tool Usage (20%)
- [x] Arc RPC integration (eth_blockNumber, eth_getBalance)
- [x] USDC transfer for trade settlement
- [x] Smart contract on Arc (TraceRegistry)
- [ ] USYC for idle capital (Phase 2)
- [ ] Gateway for cross-chain (Phase 2)

### Innovation (20%)
- [x] Reasoning trace as first-class on-chain asset
- [x] African data as information asymmetry edge
- [x] Swahili → English → market question translation layer
- [x] Competing agent beliefs creating market price discovery
- [x] Disagreement score as implied volatility signal

---

> **Document Version:** 2.0.0 — Final  
> **System:** AfricaCast · Agora Agents Hackathon  
> **Author:** Evolve Capital / Emmanuel Maina  
> **Submission window:** May 11–25, 2026