# AfriForecast Agent — Implementation Plan
> Bayesian Prediction Market Alpha Engine · African Signal Intelligence · RFB #2 Primary

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Architecture](#2-data-architecture)
   - 2.1 [Signal Taxonomy (L1/L2/L3)](#21-signal-taxonomy)
   - 2.2 [Canonical Data Schemas](#22-canonical-data-schemas)
   - 2.3 [Source Registry Format](#23-source-registry-format)
3. [Data Ingestion & Sanitization](#3-data-ingestion--sanitization)
   - 3.1 [Ingestion Pipeline](#31-ingestion-pipeline)
   - 3.2 [Sanitization Rules by Type](#32-sanitization-rules-by-type)
   - 3.3 [Quality Scoring](#33-quality-scoring)
4. [Bayesian Engine Architecture](#4-bayesian-engine-architecture)
   - 4.1 [Belief Update Model](#41-belief-update-model)
   - 4.2 [Credibility Weighting](#42-credibility-weighting)
   - 4.3 [Edge Calculation](#43-edge-calculation)
5. [Agent Architecture](#5-agent-architecture)
   - 5.1 [Agent Roles](#51-agent-roles)
   - 5.2 [Inter-Agent Protocol](#52-inter-agent-protocol)
6. [System Flows](#6-system-flows)
   - 6.1 [Full Prediction Flow](#61-full-prediction-flow)
   - 6.2 [Signal Ingestion Flow](#62-signal-ingestion-flow)
   - 6.3 [Bet Execution Decision Flow](#63-bet-execution-decision-flow)
7. [API & Integration Layer](#7-api--integration-layer)
8. [Database Schema](#8-database-schema)
9. [Implementation Phases](#9-implementation-phases)
10. [Tech Stack Reference](#10-tech-stack-reference)

---

## 1. System Overview

Dhamiri is a belief-updating system that extracts probabilistic alpha from African regional signals and competes against prediction market prices on platforms like Polymarket and Manifold Markets.

**Core premise:**

```
Information Asymmetry (African Data) → Structured Belief → Mispriced Markets → +EV Bets
```

**Three competitive advantages:**

| Advantage | Description |
|-----------|-------------|
| Signal Edge | Access to African-specific datasets most market participants ignore |
| Inference Engine | Bayesian log-odds updating with credibility-weighted sources |
| Explainability | Every prediction carries a verifiable reasoning trace |

---

## 2. Data Architecture

### 2.1 Signal Taxonomy

The system operates on three data layers, each with distinct processing requirements.

```
┌──────────────────────────────────────────────────────────┐
│  L3 · STRATEGY LAYER                                     │
│  Decisions · Alpha · Bet sizing · Kelly outputs          │
├──────────────────────────────────────────────────────────┤
│  L2 · DYNAMICS LAYER                                     │
│  Momentum · Correlation · Volatility · Sentiment trends  │
├──────────────────────────────────────────────────────────┤
│  L1 · SIGNAL LAYER                                       │
│  Raw prices · News · Weather · M-Pesa flows · Reports    │
└──────────────────────────────────────────────────────────┘
```

**L1 — Raw Signals**

| Signal Class | Examples | Update Frequency | Source Type |
|---|---|---|---|
| Commodity Prices | Maize, wheat, fuel pump prices | Daily | API / Scrape |
| Weather Data | Rainfall anomaly, drought indices | 6-hourly | CHIRPS, TAHMO |
| Currency | USD/KES, USD/UGX, USD/TZS | Hourly | Open exchange APIs |
| Mobile Money | M-Pesa transaction volume indices | Weekly | CBK reports |
| Agricultural | NDVI, harvest estimates, input prices | Weekly | FAO, KALRO |
| Political Risk | Election proximity, policy announcements | Event-driven | News scrape |
| News | Local outlets, X/Twitter sentiment | Continuous | RSS, scrape |
| Import/Export | Port of Mombasa throughput, EAC trade | Monthly | KPA, EAC |

**L2 — Derived Dynamics**

| Dynamic | Computed From | Formula |
|---|---|---|
| Price Momentum | L1 commodity prices | `(P_t - P_{t-n}) / P_{t-n}` |
| Rainfall Anomaly | L1 weather | `(observed - climatological_mean) / std_dev` |
| Sentiment Score | L1 news | NLP polarity, VADER or fine-tuned model |
| Supply Shock Index | L1 prices + L1 weather | composite z-score |
| Currency Stress | L1 FX rates | rolling 30d std dev vs mean |

**L3 — Strategy Outputs**

| Output | Description |
|---|---|
| Posterior Probability | P(H\|E), agent's belief after signal update |
| Edge | `agent_probability - market_price` |
| Kelly Fraction | Recommended bet size as fraction of bankroll |
| Reasoning Trace | Structured chain of evidence → belief updates |
| Confidence Score | Aggregate signal quality across evidence set |

---

### 2.2 Canonical Data Schemas

All internal data **must** conform to these schemas before entering the Bayesian engine.

#### Signal Schema (`Signal`)

```typescript
interface Signal {
  signal_id:    string;           // UUID v4
  created_at:   string;           // ISO 8601 UTC
  signal_class: SignalClass;      // "commodity" | "weather" | "fx" | "news" | "political" | "mobile_money" | "trade"
  layer:        "L1" | "L2";
  name:         string;           // human-readable label, e.g. "Rift Valley Rainfall Deficit"
  value:        number;           // normalized numeric value
  unit:         string;           // "z_score" | "pct_change" | "polarity" | "raw"
  direction:    "bullish" | "bearish" | "neutral";  // relative to hypothesis
  impact:       number;           // log-odds delta, range [-2.0, +2.0]
  confidence:   number;           // source credibility × data quality, range [0.0, 1.0]
  source_id:    string;           // FK → SourceRegistry
  region:       string[];         // ["KE", "TZ", "EAC"] ISO 3166 codes
  raw_payload:  Record<string, unknown>;  // original source data preserved
  quality_flags: QualityFlag[];
}
```

#### Hypothesis Schema (`Hypothesis`)

```typescript
interface Hypothesis {
  hypothesis_id:   string;
  created_at:      string;        // ISO 8601 UTC
  market_id:       string;        // FK → external prediction market
  platform:        "polymarket" | "manifold" | "kalshi" | "custom";
  question:        string;        // "Will Kenya maize prices rise >5% by end of Q3 2026?"
  resolution_date: string;        // ISO 8601 UTC
  resolution_criteria: string;   // explicit, measurable condition
  category:        string;        // "agriculture" | "macro" | "political" | "weather"
  tags:            string[];
  prior:           number;        // initial belief P(H), default 0.5
}
```

#### Prediction Schema (`Prediction`)

```typescript
interface Prediction {
  prediction_id:     string;
  hypothesis_id:     string;
  generated_at:      string;      // ISO 8601 UTC
  prior:             number;      // starting probability
  posterior:         number;      // final probability after signal updates
  market_price:      number;      // platform's current YES price
  edge:              number;      // posterior - market_price
  kelly_fraction:    number;      // recommended bet size
  confidence:        number;      // weighted average signal confidence
  signal_ids:        string[];    // signals used in this prediction
  reasoning_trace:   ReasoningStep[];
  recommendation:    "BET_YES" | "BET_NO" | "NO_BET";
  status:            "pending" | "resolved_correct" | "resolved_incorrect";
}
```

#### Reasoning Step Schema

```typescript
interface ReasoningStep {
  step:         number;
  signal_id:    string;
  signal_name:  string;
  prior_logodds:    number;
  impact:           number;
  posterior_logodds: number;
  posterior_prob:   number;
  narrative:        string;  // "Rift Valley rainfall deficit of -1.8σ increases supply shock probability"
}
```

---

### 2.3 Source Registry Format

Every data source is registered before use. Unregistered sources are rejected by the ingestion gate.

```typescript
interface SourceRegistryEntry {
  source_id:        string;       // UUID v4
  name:             string;       // "Kenya Meteorological Department"
  short_code:       string;       // "KMD"
  base_credibility: number;       // prior trustworthiness [0.0, 1.0]
  source_type:      "government_api" | "ngo_report" | "news_scrape" | "social" | "community" | "market_data";
  update_frequency: string;       // cron expression
  region:           string[];
  endpoint:         string | null;
  auth_method:      "api_key" | "oauth" | "public" | "scrape";
  decay_half_life_hours: number;  // how quickly this source's signals age
  reliability_history: number[];  // rolling 30-period accuracy rate
}
```

**Default credibility weights by source type:**

```python
CREDIBILITY_DEFAULTS = {
    "government_api":  0.85,   # CBK, KMD, KEBS
    "ngo_report":      0.75,   # FAO, WFP, IFPRI
    "market_data":     0.80,   # Reuters, Bloomberg Africa
    "news_scrape":     0.55,   # The Standard, Daily Nation
    "community":       0.40,   # local farmer networks, WhatsApp
    "social":          0.25,   # X/Twitter sentiment
}
```

---

## 3. Data Ingestion & Sanitization

### 3.1 Ingestion Pipeline

```
External Source
      │
      ▼
┌─────────────┐
│  Collector  │  HTTP polling / RSS / scrape / webhook
└──────┬──────┘
       │ raw payload
       ▼
┌─────────────┐
│  Gate       │  Source registry check → reject if unregistered
└──────┬──────┘
       │ registered payload
       ▼
┌─────────────┐
│  Normalizer │  Parse → type cast → unit standardization
└──────┬──────┘
       │ typed payload
       ▼
┌─────────────┐
│  Sanitizer  │  Null handling → outlier detection → dedup → freshness check
└──────┬──────┘
       │ clean payload
       ▼
┌─────────────┐
│  Enricher   │  L1 → L2 derivation, NLP scoring, region tagging
└──────┬──────┘
       │ enriched Signal
       ▼
┌─────────────┐
│  Store      │  Write to signal store, emit to event bus
└─────────────┘
```

---

### 3.2 Sanitization Rules by Type

#### A — Numeric Signals (prices, rates, indices)

```python
class NumericSanitizer:
    """
    Applied to: commodity prices, FX rates, rainfall mm, NDVI values.
    """

    def sanitize(self, value: float, source: SourceRegistryEntry) -> SanitizedValue:
        # 1. Null / NaN guard
        if value is None or math.isnan(value):
            return SanitizedValue(value=None, flag=QualityFlag.MISSING)

        # 2. Physical bounds check (domain-specific)
        if not self._within_physical_bounds(value, source.signal_class):
            return SanitizedValue(value=None, flag=QualityFlag.PHYSICALLY_IMPLAUSIBLE)

        # 3. Statistical outlier detection (rolling z-score)
        z = (value - self.rolling_mean) / (self.rolling_std + 1e-8)
        if abs(z) > 4.0:
            # Flag but preserve — extreme values are real signals in Africa
            return SanitizedValue(value=value, flag=QualityFlag.STATISTICAL_OUTLIER, z_score=z)

        # 4. Staleness check
        if self._hours_since_update(source) > source.decay_half_life_hours * 2:
            return SanitizedValue(value=value, flag=QualityFlag.STALE)

        return SanitizedValue(value=value, flag=QualityFlag.CLEAN)

    def _within_physical_bounds(self, value: float, signal_class: str) -> bool:
        BOUNDS = {
            "maize_price_ksh_per_90kg":  (800, 12000),
            "rainfall_mm_daily":         (0, 300),
            "usd_kes":                   (50, 250),
            "ndvi":                      (-1.0, 1.0),
            "fuel_pump_ksh_per_litre":   (80, 400),
        }
        low, high = BOUNDS.get(signal_class, (-1e9, 1e9))
        return low <= value <= high
```

#### B — News / Text Signals

```python
class TextSanitizer:
    """
    Applied to: news headlines, social media, farmer reports.
    """

    def sanitize(self, raw_text: str, source: SourceRegistryEntry) -> TextSignal:
        # 1. Encoding normalization
        text = ftfy.fix_text(raw_text)           # fix mojibake, smart quotes
        text = unicodedata.normalize("NFC", text)

        # 2. Language detection — only process if Swahili or English
        lang = langdetect.detect(text)
        if lang not in ("en", "sw"):
            return TextSignal(text=text, flag=QualityFlag.UNSUPPORTED_LANGUAGE)

        # 3. Deduplication fingerprint
        fingerprint = hashlib.sha256(text[:200].encode()).hexdigest()
        if fingerprint in self.seen_fingerprints:
            return TextSignal(text=text, flag=QualityFlag.DUPLICATE)

        # 4. Spam / low-quality filter
        if len(text.split()) < 5 or self._spam_score(text) > 0.7:
            return TextSignal(text=text, flag=QualityFlag.LOW_QUALITY)

        # 5. NLP enrichment
        sentiment_score = self.sentiment_model.predict(text)    # [-1, +1]
        entities       = self.ner_model.extract(text)           # locations, commodities
        keywords       = self.keyword_extractor.run(text)

        return TextSignal(
            text=text,
            sentiment=sentiment_score,
            entities=entities,
            keywords=keywords,
            flag=QualityFlag.CLEAN
        )
```

#### C — Deduplication Logic

```python
def deduplicate_signals(
    new_signal: Signal,
    existing_signals: list[Signal],
    window_hours: int = 24
) -> bool:
    """
    Returns True if signal is a duplicate.
    
    Duplicate conditions (ANY of):
    - Same source_id + same value + created within window_hours
    - Cosine similarity > 0.92 for text signals
    - Same market event reported by source with decay not yet expired
    """
    cutoff = datetime.utcnow() - timedelta(hours=window_hours)
    
    for existing in existing_signals:
        if existing.created_at < cutoff:
            continue
        if existing.source_id == new_signal.source_id:
            if existing.signal_class == new_signal.signal_class:
                if abs(existing.value - new_signal.value) < 0.001:
                    return True  # exact numeric duplicate
    
    return False
```

---

### 3.3 Quality Scoring

Every signal entering the Bayesian engine receives a quality score `q ∈ [0, 1]`.

```python
def compute_quality_score(signal: Signal, source: SourceRegistryEntry) -> float:
    """
    q = base_credibility × freshness_factor × completeness_factor × reliability_factor
    """
    # Freshness: exponential decay based on signal age
    age_hours = (datetime.utcnow() - signal.created_at).total_seconds() / 3600
    freshness = math.exp(-age_hours / source.decay_half_life_hours)

    # Completeness: penalize missing optional fields
    expected_fields = ["value", "region", "direction", "impact"]
    filled = sum(1 for f in expected_fields if getattr(signal, f) is not None)
    completeness = filled / len(expected_fields)

    # Reliability: source's rolling historical accuracy
    reliability = sum(source.reliability_history[-10:]) / min(len(source.reliability_history), 10)
    reliability = reliability if source.reliability_history else 0.5  # default if no history

    # Quality flag penalties
    FLAG_PENALTIES = {
        QualityFlag.CLEAN:                 1.00,
        QualityFlag.STATISTICAL_OUTLIER:   0.70,
        QualityFlag.STALE:                 0.40,
        QualityFlag.LOW_QUALITY:           0.25,
        QualityFlag.MISSING:               0.00,
    }
    flag_multiplier = FLAG_PENALTIES.get(signal.quality_flags[0], 0.5)

    return (
        source.base_credibility
        * freshness
        * completeness
        * reliability
        * flag_multiplier
    )
```

**Quality thresholds:**

| Score Range | Action |
|---|---|
| `0.70 – 1.00` | Use in prediction, full weight |
| `0.40 – 0.69` | Use in prediction, halved impact |
| `0.15 – 0.39` | Include in trace only, excluded from belief update |
| `0.00 – 0.14` | Discard |

---

## 4. Bayesian Engine Architecture

### 4.1 Belief Update Model

The engine uses a **log-odds accumulation model** — a tractable approximation of Bayes' theorem suitable for independent evidence streams.

**Derivation:**

```
P(H|E) ∝ P(E|H) × P(H)

In log-odds space:
  log_odds(posterior) = log_odds(prior) + Σ log_odds(signal_i)
```

**Implementation:**

```python
import math
from dataclasses import dataclass

@dataclass
class BeliefState:
    probability: float
    log_odds: float

def to_logodds(p: float) -> float:
    p = max(0.001, min(0.999, p))  # clamp to avoid inf
    return math.log(p / (1 - p))

def to_probability(log_odds: float) -> float:
    return 1 / (1 + math.exp(-log_odds))

def update_belief(
    prior: float,
    signals: list[Signal],
    quality_scores: dict[str, float]
) -> tuple[BeliefState, list[ReasoningStep]]:
    """
    Sequentially update belief across all signals.
    Returns final belief state and full reasoning trace.
    """
    current_logodds = to_logodds(prior)
    trace = []

    for i, signal in enumerate(signals):
        q = quality_scores[signal.signal_id]

        # Scale impact by quality score
        effective_impact = signal.impact * q

        prior_logodds = current_logodds
        current_logodds += effective_impact
        posterior_prob = to_probability(current_logodds)

        trace.append(ReasoningStep(
            step=i + 1,
            signal_id=signal.signal_id,
            signal_name=signal.name,
            prior_logodds=prior_logodds,
            impact=effective_impact,
            posterior_logodds=current_logodds,
            posterior_prob=posterior_prob,
            narrative=f"{signal.name} (quality={q:.2f}) shifts belief "
                      f"by {effective_impact:+.3f} log-odds → "
                      f"P(H)={posterior_prob:.3f}"
        ))

    return BeliefState(
        probability=to_probability(current_logodds),
        log_odds=current_logodds
    ), trace
```

---

### 4.2 Credibility Weighting

Signal impact is scaled before applying to belief:

```python
def compute_effective_impact(signal: Signal, quality_score: float) -> float:
    """
    effective_impact = raw_impact × quality_score × recency_boost
    
    Clamped to [-1.5, +1.5] to prevent single signals dominating.
    """
    # Recency boost: signals < 6 hours old get a 1.2× multiplier
    age_hours = (datetime.utcnow() - signal.created_at).total_seconds() / 3600
    recency_boost = 1.2 if age_hours < 6 else 1.0

    raw = signal.impact * quality_score * recency_boost
    return max(-1.5, min(1.5, raw))
```

**Canonical impact ranges for signal classes:**

```python
IMPACT_CALIBRATION = {
    # Format: (baseline_impact, direction_rule)
    "rainfall_deficit_zscore":   (0.8,  "negative rainfall → positive supply shock"),
    "export_demand_spike":       (0.6,  "high demand → positive price rise"),
    "currency_depreciation":     (0.4,  "KES weakness → import cost rise"),
    "news_negative_sentiment":   (0.3,  "bearish news → reinforces risk"),
    "political_instability_flag":(0.5,  "instability → uncertainty premium"),
    "mpesa_volume_drop":         (0.35, "lower flows → economic contraction signal"),
    "harvest_estimate_poor":     (0.9,  "supply shock → price rise confirmation"),
}
```

---

### 4.3 Edge Calculation

```python
def compute_prediction(
    hypothesis: Hypothesis,
    posterior: float,
    market_price: float,
    confidence: float
) -> Prediction:
    edge = posterior - market_price

    # Kelly Criterion (simplified, half-Kelly for safety)
    if edge > 0:
        kelly = (posterior - (1 - posterior) / (market_price / (1 - market_price))) * 0.5
    else:
        kelly = 0.0
    kelly = max(0.0, min(0.10, kelly))  # cap at 10% bankroll per bet

    # Decision gate
    MIN_EDGE = 0.08         # minimum 8% edge to bet
    MIN_CONFIDENCE = 0.50   # minimum 50% average signal quality

    if abs(edge) >= MIN_EDGE and confidence >= MIN_CONFIDENCE:
        recommendation = "BET_YES" if edge > 0 else "BET_NO"
    else:
        recommendation = "NO_BET"

    return Prediction(
        posterior=posterior,
        market_price=market_price,
        edge=edge,
        kelly_fraction=kelly,
        confidence=confidence,
        recommendation=recommendation
    )
```

---

## 5. Agent Architecture

### 5.1 Agent Roles

The system runs four specialized agents communicating over a shared message bus.

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                       │
│  - Routes tasks · Manages state · Triggers agent calls      │
└────────┬───────────────────┬──────────────────┬────────────┘
         │                   │                  │
         ▼                   ▼                  ▼
┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  RESEARCH AGENT │ │  BAYESIAN ENGINE │ │  TRADER AGENT    │
│                 │ │                  │ │                  │
│  Ingests L1     │ │  Receives signals│ │  Receives Pred.  │
│  Derives L2     │ │  Runs belief     │ │  Checks market   │
│  Outputs Signal │ │  update          │ │  Executes / logs │
│  objects        │ │  Outputs Pred.   │ │                  │
└─────────────────┘ └──────────────────┘ └──────────────────┘
```

**Orchestrator Agent responsibilities:**

```python
class OrchestratorAgent:
    """
    Entry point. Receives a Hypothesis → coordinates full pipeline.
    """
    async def run_prediction_cycle(self, hypothesis: Hypothesis) -> Prediction:
        # 1. Fetch relevant signals
        signals = await self.research_agent.gather_signals(
            hypothesis=hypothesis,
            lookback_hours=72
        )

        # 2. Sanitize and score
        clean_signals, quality_scores = self.sanitizer.process(signals)

        # 3. Run Bayesian update
        belief, trace = self.bayesian_engine.update_belief(
            prior=hypothesis.prior,
            signals=clean_signals,
            quality_scores=quality_scores
        )

        # 4. Fetch market price
        market_price = await self.market_feed.get_price(hypothesis.market_id)

        # 5. Generate prediction
        prediction = self.bayesian_engine.compute_prediction(
            hypothesis=hypothesis,
            posterior=belief.probability,
            market_price=market_price,
            confidence=mean(quality_scores.values())
        )
        prediction.reasoning_trace = trace

        # 6. Route to trader
        if prediction.recommendation != "NO_BET":
            await self.trader_agent.execute(prediction)

        return prediction
```

---

### 5.2 Inter-Agent Protocol

All inter-agent messages conform to the `AgentMessage` schema:

```typescript
interface AgentMessage {
  message_id:   string;
  timestamp:    string;          // ISO 8601 UTC
  from_agent:   AgentRole;
  to_agent:     AgentRole;
  message_type: "REQUEST" | "RESPONSE" | "EVENT" | "ERROR";
  payload:      Signal | Prediction | Hypothesis | ErrorPayload;
  correlation_id: string;        // ties request → response
  version:      string;          // schema version, e.g. "1.0.0"
}
```

---

## 6. System Flows

### 6.1 Full Prediction Flow

```
User / Scheduler
      │
      │ Hypothesis{ market_id, question, prior }
      ▼
┌─────────────────────────────┐
│      ORCHESTRATOR           │
│  1. validate hypothesis     │
│  2. check prediction cache  │
└────────┬────────────────────┘
         │ if not cached
         ▼
┌─────────────────────────────┐
│      RESEARCH AGENT         │
│  1. query source registry   │
│  2. fetch L1 signals        │
│  3. derive L2 dynamics      │
│  4. return Signal[]         │
└────────┬────────────────────┘
         │ Signal[]
         ▼
┌─────────────────────────────┐
│   INGESTION / SANITIZER     │
│  1. gate check (registered) │
│  2. normalize types/units   │
│  3. sanitize per type       │
│  4. compute quality scores  │
│  5. deduplicate             │
│  6. return clean Signal[]   │
└────────┬────────────────────┘
         │ clean Signal[], quality_scores{}
         ▼
┌─────────────────────────────┐
│     BAYESIAN ENGINE         │
│  1. set prior               │
│  2. for each signal:        │
│     a. scale impact by q    │
│     b. update log-odds      │
│     c. record trace step    │
│  3. compute posterior P(H)  │
│  4. fetch market price      │
│  5. compute edge + Kelly    │
│  6. apply decision gate     │
│  7. return Prediction       │
└────────┬────────────────────┘
         │ Prediction
         ▼
┌─────────────────────────────┐
│      TRADER AGENT           │
│  if recommendation != NO_BET│
│  1. verify market is open   │
│  2. check position limits   │
│  3. place bet / log intent  │
│  4. emit execution event    │
└─────────────────────────────┘
         │
         ▼
   Prediction stored
   Reasoning trace stored
   Monitoring dashboard updated
```

---

### 6.2 Signal Ingestion Flow

```
Scheduler (cron) / Webhook
      │
      ▼
┌────────────────────────────────────────────┐
│  Collector: fetch(source.endpoint)         │
│  → raw_payload: Record<string, unknown>    │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Gate: source_registry.lookup(source_id)   │
│  ├─ NOT FOUND → reject, log warning        │
│  └─ FOUND → continue                       │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Normalizer                                │
│  ├─ parse JSON / XML / CSV                 │
│  ├─ cast to typed fields                   │
│  └─ standardize units (USD, mm, z-score)   │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Sanitizer (type-specific)                 │
│  ├─ Numeric: bounds, outlier, staleness    │
│  ├─ Text: encoding, language, spam, NLP    │
│  └─ attach QualityFlag to each signal      │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Deduplicator: fingerprint check (24h)     │
│  ├─ DUPLICATE → discard, increment counter │
│  └─ UNIQUE → continue                      │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Quality Scorer: compute_quality_score()   │
│  ├─ q >= 0.70 → FULL weight                │
│  ├─ q >= 0.40 → HALF weight                │
│  ├─ q >= 0.15 → TRACE only                 │
│  └─ q < 0.15  → DISCARD                    │
└───────────┬────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────┐
│  Enricher                                  │
│  ├─ L2 derivation (momentum, z-score)      │
│  ├─ Region tagging (ISO codes)             │
│  └─ Impact calibration (IMPACT_CALIBRATION)│
└───────────┬────────────────────────────────┘
            │
            ▼
   Signal stored → event emitted → 
   Research Agent signal buffer updated
```

---

### 6.3 Bet Execution Decision Flow

```
Prediction received by Trader Agent
      │
      ▼
┌──────────────────────────────────────────┐
│  CHECK: market open?                     │
│  ├─ NO  → log "market_closed", skip      │
│  └─ YES → continue                       │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  CHECK: edge >= MIN_EDGE (0.08)?         │
│  ├─ NO  → log "insufficient_edge", skip  │
│  └─ YES → continue                       │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  CHECK: confidence >= 0.50?              │
│  ├─ NO  → log "low_confidence", skip     │
│  └─ YES → continue                       │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  CHECK: position limit not breached?     │
│  (max 10% bankroll in single market)     │
│  ├─ BREACHED → reduce kelly, or skip     │
│  └─ OK → continue                        │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  EXECUTE                                 │
│  ├─ bet_direction = YES if edge > 0      │
│  ├─ bet_size = kelly_fraction × bankroll │
│  ├─ submit to platform API               │
│  └─ record execution event               │
└──────────────────────────────────────────┘
```

---

## 7. API & Integration Layer

### Prediction Market APIs

| Platform | Integration Method | Auth |
|---|---|---|
| Polymarket | CLOB API (REST) | API key + wallet sig |
| Manifold | REST API | API key |
| Kalshi | REST API | OAuth 2.0 |

### Data Source Integrations

```python
# Weather — CHIRPS (Rainfall)
GET https://data.chc.ucsb.edu/products/CHIRPS-2.0/africa_daily/
# Returns: GeoTIFF → extract by region bounding box → aggregate to mm

# Currency — Open Exchange Rates
GET https://openexchangerates.org/api/latest.json?app_id={key}&symbols=KES,TZS,UGX

# Commodity Prices — World Bank Pink Sheet
GET https://www.worldbank.org/en/research/commodity-markets
# Parsed: monthly CSV → maize, fertilizer, fuel

# News — RSS feeds
https://nation.africa/feed/
https://www.standardmedia.co.ke/rss
https://eastafrican.co.ke/feed/

# Kenya Central Bank — M-Pesa data
GET https://www.centralbank.go.ke/statistical-releases/
# Parsed: monthly PDF → extract transaction volumes
```

---

## 8. Database Schema

```sql
-- Core tables (PostgreSQL + TimescaleDB for time-series)

CREATE TABLE source_registry (
    source_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    short_code        TEXT UNIQUE NOT NULL,
    base_credibility  DECIMAL(3,2) CHECK (base_credibility BETWEEN 0 AND 1),
    source_type       TEXT NOT NULL,
    region            TEXT[] NOT NULL,
    decay_half_life_hours INT NOT NULL DEFAULT 24,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE signals (
    signal_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signal_class      TEXT NOT NULL,
    layer             TEXT CHECK (layer IN ('L1', 'L2')),
    name              TEXT NOT NULL,
    value             DECIMAL,
    unit              TEXT,
    direction         TEXT CHECK (direction IN ('bullish', 'bearish', 'neutral')),
    impact            DECIMAL(4,3),
    confidence        DECIMAL(3,2),
    source_id         UUID REFERENCES source_registry(source_id),
    region            TEXT[],
    quality_flags     TEXT[],
    raw_payload       JSONB
);
-- Convert to hypertable for time-series queries
SELECT create_hypertable('signals', 'created_at');

CREATE TABLE hypotheses (
    hypothesis_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id         TEXT NOT NULL,
    platform          TEXT NOT NULL,
    question          TEXT NOT NULL,
    resolution_date   TIMESTAMPTZ,
    category          TEXT,
    prior             DECIMAL(4,3) DEFAULT 0.500,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE predictions (
    prediction_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id     UUID REFERENCES hypotheses(hypothesis_id),
    generated_at      TIMESTAMPTZ DEFAULT NOW(),
    prior             DECIMAL(4,3),
    posterior         DECIMAL(4,3),
    market_price      DECIMAL(4,3),
    edge              DECIMAL(4,3),
    kelly_fraction    DECIMAL(4,3),
    confidence        DECIMAL(3,2),
    recommendation    TEXT,
    status            TEXT DEFAULT 'pending',
    reasoning_trace   JSONB
);

CREATE TABLE signal_prediction_map (
    prediction_id UUID REFERENCES predictions(prediction_id),
    signal_id     UUID REFERENCES signals(signal_id),
    PRIMARY KEY (prediction_id, signal_id)
);

CREATE TABLE executions (
    execution_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id     UUID REFERENCES predictions(prediction_id),
    executed_at       TIMESTAMPTZ DEFAULT NOW(),
    platform          TEXT,
    bet_direction     TEXT,
    bet_size_usd      DECIMAL(10,2),
    market_price_at_bet DECIMAL(4,3),
    status            TEXT,
    platform_tx_id    TEXT
);
```

---

## 9. Implementation Phases

### Phase 1 — Signal Foundation (Days 1–2)

**Goal:** Reliable L1 ingestion and sanitization running.

- [ ] Source registry seeded with 5 core sources (KMD, CBK, CHIRPS, Nation RSS, World Bank)
- [ ] Collector for weather, FX, commodity price, and one news RSS
- [ ] Numeric and text sanitizers implemented and tested
- [ ] Quality scoring function running
- [ ] Signal storage (PostgreSQL + TimescaleDB) operational
- [ ] Unit tests for sanitization edge cases (nulls, outliers, staleness)

**Deliverable:** Clean `Signal[]` flowing into a queryable store.

---

### Phase 2 — Bayesian Engine (Days 2–3)

**Goal:** Belief update and prediction generation working end-to-end.

- [ ] `to_logodds`, `to_probability`, `update_belief` implemented
- [ ] `compute_quality_score` integrated with signal pipeline
- [ ] Impact calibration table populated for all L1 signal classes
- [ ] `compute_prediction` with edge and Kelly calculation
- [ ] Decision gate enforcing `MIN_EDGE` and `MIN_CONFIDENCE`
- [ ] Reasoning trace generation and serialization to JSONB
- [ ] Integration test: hypothesis → signals → prediction → trace

**Deliverable:** `Prediction` object with full reasoning trace.

---

### Phase 3 — Agent Orchestration (Days 3–4)

**Goal:** Four-agent system coordinating full prediction cycle.

- [ ] OrchestratorAgent routing hypothesis to Research → Bayesian → Trader
- [ ] ResearchAgent fetching and aggregating signals by hypothesis category
- [ ] TraderAgent with bet execution decision flow
- [ ] AgentMessage protocol enforced between all agents
- [ ] Prediction caching (skip re-compute if fresh prediction exists)
- [ ] End-to-end test: schedule → ingest → predict → execute log

**Deliverable:** Running agent loop with console/log output per cycle.

---

### Phase 4 — Demo Flow (Day 4–5)

**Goal:** Hackathon-ready demo showing the full value chain.

- [ ] Demo hypothesis: "Will Kenya maize prices rise >5% by end of Q3 2026?"
- [ ] Live signal ingestion from at least 3 real sources
- [ ] Prediction UI showing: `posterior`, `market_price`, `edge`, `recommendation`
- [ ] Reasoning trace displayed step-by-step
- [ ] Correct/incorrect resolution tracker seeded with back-test data
- [ ] Monitoring dashboard (Grafana or simple React UI)

**Deliverable:** 2-minute demo flow judges can follow without explanation.

---

## 10. Tech Stack Reference

| Layer | Technology | Purpose |
|---|---|---|
| Agent Runtime | Python 3.11+ / LangChain | Agent orchestration |
| Database | PostgreSQL 15 + TimescaleDB | Signal and prediction storage |
| Message Bus | Redis Streams | Inter-agent communication |
| NLP | VADER / Afro-XLMR | Swahili + English sentiment |
| API Framework | FastAPI | External API + webhooks |
| Scheduler | APScheduler | Cron-based signal collection |
| Frontend | React + Recharts | Prediction dashboard |
| Deployment | Docker Compose | Local + cloud parity |
| Market Integration | Polymarket CLOB API | Prediction market prices |
| Monitoring | Prometheus + Grafana | Signal health and prediction accuracy |

---

> **Document Version:** 1.0.0  
> **System:** AfriForecast Agent  
> **Author:** Evolve Capital Research  
> **Date:** May 2026