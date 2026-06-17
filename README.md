# Meridian

### The Operating System for Global Money Networks

Meridian is a compliance-native treasury intelligence platform that creates a real-time digital twin of stablecoin payment networks. It ingests verified identity signals, compliant asset flows, and compliance evaluations from the Cleanverse stack to forecast settlement failures, liquidity constraints, and compliance congestion before transactions are executed.

The core insight: every financial crisis has leading indicators. They are only visible at the network level.

---

## The Problem

Financial institutions, payment service providers, remittance operators, and enterprise treasury teams operate reactively. They discover liquidity shortages, compliance bottlenecks, and settlement failures only after transactions are blocked or funds become trapped. Existing payment infrastructure provides visibility into what happened, not what is likely to happen next.

Current tools answer: how do we move money?

Meridian answers: how do we understand, predict, and coordinate an entire financial network?

---

## The Solution

Meridian introduces a live operational model of a payment network that continuously analyzes verified participants, compliant asset flows, settlement paths, and compliance signals to forecast risk before money moves.

This is weather forecasting for money movement. Institutions gain the ability to proactively manage treasury operations, improve settlement reliability, reduce compliance friction, and optimize capital efficiency across global stablecoin networks.

---

## Cleanverse Integration

Meridian is built entirely around three Cleanverse primitives. It would not be possible without them.

### A-Pass (Identity Layer)

Every participant within Meridian's digital twin is represented using verified A-Pass identity signals. The platform reads each participant's tier, subGroup, status, expiration time, and validator state via the Cooperate API. This allows the platform to understand the structure of payment relationships and counterparty exposure with cryptographic confidence.

A-Pass DIDs serve as the canonical anchor for the network graph. Every node in the twin maps to a verified identity rather than a self-reported address.

### A-Token (Asset Intelligence Layer)

Meridian continuously analyzes compliant aUSDC asset movements via `query_txs`, `query_deposit_atoken_list`, and `query_deposit_address`. Treasury balances, settlement activity, corridor-level liquidity conditions, and 24-hour volume figures are all derived from A-Token transaction data.

The Wrapped A-Token mechanism (native USDC deposited to a whitelist address, locked by `access_core`, aUSDC minted at 1:1) is modeled explicitly in the liquidity layer so the platform can distinguish between native and compliant settlement flows.

### CCP Protocol (Compliance Signal Layer)

Compliance evaluations, Travel Rule outcomes, and transaction screening results power the cascade model. The platform tracks CCP timeout rates per corridor using a rolling 100-event window. Rising timeout rates are the primary early-warning signal for Sunrise-triggered blocks.

The Sunrise Problem (counterparty jurisdiction has no enforcement mechanism, so CCP handshake times out and funds block) is the primary demo failure mode because it is the most common real-world stablecoin failure.

### Validator Module

The Validator compliance pool API is used for edge-level compliance checking. Before any simulated transaction traverses an edge, `validator/verify` is called to confirm the destination wallet satisfies the pool's compliance rules. A paused or non-registered pool is treated as a compliance failure, triggering edge degradation.

---

## Architecture: Five Layers

### Layer 1: Network Graph

Every entity in the payment network becomes a node. Banks, PSPs, exchanges, wallets, and AI agents are all first-class participants. Payment relationships become directed edges. Money becomes quantified flow with capacity, volume, and latency attributes.

The graph is built with NetworkX and rendered via Sigma.js WebGL. The live twin updates every 3 seconds via WebSocket push from the backend state manager.

Nodes carry:
- Verified identity (A-Pass tier, subGroup, status, expiration)
- Compliance state (active, degraded, frozen, blocked)
- Liquidity position in USD
- 24-hour throughput in USD
- Geographic country and chain

Edges carry:
- Status (healthy, congested, degraded, blocked)
- 24-hour volume vs. capacity utilisation
- Settlement latency in milliseconds
- Corridor identifier (e.g. US-NG)

### Layer 2: Compliance State Engine

Every node maintains a live compliance state derived from A-Pass signals:

- Tier below 30: DEGRADED
- Tier below 10: BLOCKED
- A-Pass expired: BLOCKED
- Validator check failed: BLOCKED
- Expiry within 1 hour: DEGRADED
- Status explicitly frozen: FROZEN

Edge states cascade from their endpoint node states. A blocked source or target produces a blocked edge. A degraded endpoint produces a degraded edge. Throughput above 85% of capacity produces a congested edge.

The engine tracks a rolling window of CCP events per corridor (last 100 events, success or failure, latency in milliseconds). This window feeds directly into the prediction layer.

### Layer 3: Liquidity Layer

A-Token flow aggregation across all corridors. The layer pulls transaction data from `query_txs` per node address and computes approximate running balances from inflow and outflow sums. Corridor-level 24-hour volume is aggregated across all addresses belonging to that corridor.

The layer exposes a `apply_liquidity_shock` function used by the simulation engine to model instant liquidity drain scenarios.

### Layer 4: Simulation Engine

The Eisenberg-Noe clearing model is a fixed-point iteration algorithm from systemic risk research. Applied to payment networks, it models how a shock at one node propagates to its creditors based on bilateral exposure.

Implementation: given a set of initially blocked nodes, the engine iterates through the network graph. At each step, any unblocked node whose inbound stress (sum of volume from blocked predecessors) exceeds 80% of its liquidity becomes blocked. The cascade continues until the network reaches a stable state (no new blockages) or a depth limit is reached.

Five pre-built scenarios:

**Sunrise Block**
Injects a jurisdiction enforcement action that marks Flutterwave Nigeria as BLOCKED. Both the US-NG and EU-NG corridor edges become blocked immediately. Downstream entities that depend on Nigeria settlement begin degrading.

**Liquidity Drain**
Reduces Nubank Brazil's liquidity to 20% of its seed value. Triggers stress propagation to any entity that receives settlement from Brazil. Models the scenario where a local banking partner pulls a credit line.

**Sanctions Hit**
Sets EU Paysafe to FROZEN with validator_valid=False. All edges touching the EU Paysafe node become blocked. Models a live sanctions designation arriving during business hours.

**Rule Change**
Raises the effective compliance floor by setting all nodes with tier below 60 to DEGRADED. Models a platform-wide rule change or regulatory guidance update.

**Agent Flood**
Sets all agent-origin edges to 98% capacity utilisation, producing CONGESTED status. Downstream edges from the US Fed node that exceed 85% utilisation also become congested. Models 50 treasury agents executing simultaneously.

The route recommendation system uses NetworkX shortest-path with weighted edges (weight=1 for healthy, weight=3 for degraded) and skips all blocked or frozen nodes entirely. This surfaces the lowest-friction compliant route after any incident.

### Layer 5: Prediction Layer

Transparent rule-based risk scoring. No claimed ML. The scoring is honest about what requires live data to calibrate.

Four signals per corridor:

1. **CCP timeout rate** (from rolling event window): above 15% adds 0.2 to score, above 30% adds 0.4
2. **Edge status**: each blocked edge adds 0.5, each degraded edge adds 0.25, each congested edge adds 0.15
3. **Throughput utilisation**: above 80% capacity adds 0.15
4. **Node compliance states**: each blocked node in the corridor's country set adds 0.3, each degraded or frozen node adds 0.15

Scores are clamped to 1.0 and mapped to four levels: LOW (below 0.25), ELEVATED (0.25 to 0.5), HIGH (0.5 to 0.75), CRITICAL (above 0.75).

Settlement delay estimates: above 0.5 score maps to 15-minute delay, above 0.25 maps to 5 minutes.

---

## Pages

### Landing (`/`)

Full marketing page with animated terminal showing a live simulation run, an SVG corridor flow diagram with animated edges, a 2x4 stats grid, a comparison table against reactive monitoring, the five-layer architecture card grid, and a CTA section with GridCanvas particle background.

### Network (`/network`)

The primary dashboard. Left panel contains the full Sigma.js WebGL graph twin with node colors indicating compliance status (lime=active, amber=degraded, indigo=frozen, red=blocked) and edge colors indicating corridor health. Right sidebar contains the live risk panel (network health bar, corridor risk bars, active alert signals) and node detail panel for the selected node. Bottom bar contains the time-travel slider. Header shows live node/edge/blocked counts.

### Simulate (`/simulate`)

Incident injection interface. Left column lists all five scenarios with metadata, descriptions, and one-click run buttons. Right column shows cascade results with a frame scrubber to replay the propagation step by step, a state-change diff per frame, and the route recommendation tool with node-pair dropdowns.

### Corridors (`/corridors`)

Corridor intelligence view. Each corridor gets a risk bar with color-coded score, signal tags, and settlement delay estimate. Updates every 5 seconds. Right sidebar shows network health, critical alerts, and per-edge volume figures.

### Agents (`/agents`)

AI agent monitoring. Agent cards display against animated GridCanvas backgrounds with full compliance attributes. Below the cards: agent risk scenario descriptions and a full participant compliance table sorted by node type.

### Audit (`/audit`)

Compliance reporting hub. Shows live network health score, full corridor risk table with signals and delay estimates, full node snapshot table with liquidity and status. One-click PDF generation hits `GET /audit/report.pdf` which returns a ReportLab-generated document.

---

## API Reference

All endpoints are under `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Graph

```
GET  /graph/snapshot
```
Returns the full live NetworkSnapshot including all nodes and edges with current compliance states, liquidity values, and edge statuses.

```
GET  /graph/risk
```
Returns the full risk report: network health score, per-corridor risk scores with signals, per-node risk scores, critical corridor list, at-risk node count.

```
GET  /graph/history?since=<unix_ts>
```
Returns historical snapshots since the given timestamp. Powers the time-travel slider.

### Simulation

```
POST /simulation/run
Body: { "scenario_id": "sunrise_block" }
```
Runs the named scenario against the current live state. Returns all cascade frames. Applies the final frame as the new live state.

Available scenario IDs: `sunrise_block`, `liquidity_drain`, `sanctions_hit`, `rule_change`, `agent_flood`

```
POST /simulation/route
Body: { "from_node": "us-fed", "to_node": "ng-flutterwave" }
```
Returns the lowest-risk compliant path between two nodes, avoiding all blocked and frozen nodes and edges.

```
POST /simulation/reset
```
Restores the network to the original seed state.

```
GET  /simulation/scenarios
```
Returns metadata for all available scenarios.

### Cleanverse Proxy

```
POST /cleanverse/query_apass
Body: { "chain": "base", "address": "0x..." }
```

```
POST /cleanverse/query_txs
Body: { "chain": "base", "address": "0x...", "symbol": "ausdc" }
```

```
POST /cleanverse/faucet
Body: { "chain": "base", "symbol": "usdc", "deposit_address": "0x...", "amount": "10" }
```

```
POST /cleanverse/validator/verify
Body: { "chain": "base", "contract_address": "0x...", "user_address": "0x..." }
```

```
POST /cleanverse/atoken_list?chain=base
```

### Audit

```
GET /audit/report.pdf
```
Generates and streams a PDF containing: network health score, corridor risk assessment table, node compliance snapshot, active alert signals, and timestamp.

### WebSocket

```
WS /ws
```
On connect: immediately receives the current NetworkSnapshot as JSON. On each 3-second tick: receives `{ "type": "tick", ...snapshot }`. On simulation result: receives `{ "type": "simulation_result", "scenario_id": "...", "frames": N }`.

---

## Data Model

### Node

| Field | Type | Description |
|---|---|---|
| id | string | Unique node identifier |
| label | string | Display name |
| type | enum | bank, psp, exchange, wallet, agent |
| country | string | ISO 3166-1 alpha-2 |
| chain | string | Blockchain network |
| wallet_address | string | On-chain address |
| compliance | ComplianceState | Live compliance attributes |
| liquidity_usd | float | Current treasury position in USD |
| throughput_24h | float | 24-hour volume in USD |
| x, y | float | Canvas layout coordinates |

### ComplianceState

| Field | Type | Description |
|---|---|---|
| tier | int | A-Pass tier (0 to 99) |
| status | enum | active, frozen, degraded, blocked |
| apass_verified | bool | Whether A-Pass is registered |
| validator_valid | bool | Last validator/verify result |
| expiration_time | int or null | Unix timestamp seconds |

### Edge

| Field | Type | Description |
|---|---|---|
| id | string | Unique edge identifier |
| source | string | Source node ID |
| target | string | Target node ID |
| status | enum | healthy, congested, degraded, blocked |
| volume_24h | float | 24-hour flow in USD |
| capacity | float | Maximum corridor capacity in USD |
| latency_ms | int | Settlement latency in milliseconds |
| corridor | string | Corridor identifier e.g. US-NG |

---

## Network Seed Data

Ten nodes across five geographic hubs connected by eleven payment corridors.

| Node | Type | Country | Liquidity | Tier |
|---|---|---|---|---|
| US Federal Reserve PSP | bank | US | $50M | 90 |
| Circle US Gateway | psp | US | $30M | 80 |
| SEBA Bank EU | bank | DE | $40M | 85 |
| Paysafe EU | psp | GB | $20M | 70 |
| Nubank Brazil | psp | BR | $15M | 60 |
| Flutterwave Nigeria | psp | NG | $8M | 55 |
| MoMo Vietnam | psp | VN | $6M | 50 |
| TPBank Vietnam | bank | VN | $5M | 45 |
| Treasury Agent (US) | agent | US | $2M | 40 |
| Settlement Agent (EU) | agent | DE | $1.5M | 40 |

---

## Encryption

All Cleanverse write endpoints require AES-encrypted request bodies per the Cooperate API specification.

Algorithm: AES-256-CBC with PKCS5 padding
IV: 16 zero bytes (fixed)
Key: base64-decoded api-key
Encoding: Base64

The api-key is never sent in HTTP headers or request bodies. It is used only locally to encrypt plaintext JSON before transmission. The encrypted ciphertext is sent as `{ "data": "<base64_ciphertext>" }`.

Python implementation in `backend/app/core/crypto.py`.

---

## Project Structure

```
meridian/
  README.md
  .gitignore

  backend/
    pyproject.toml
    .env                         (not committed)
    app/
      main.py                    FastAPI app, lifespan, CORS, routes
      core/
        config.py                pydantic-settings: API ID, key, base URL
        crypto.py                AES encrypt/decrypt/wrap
      models/
        graph.py                 Node, Edge, NetworkSnapshot, ComplianceState Pydantic models
      services/
        cleanverse.py            Async Cleanverse API client
        compliance.py            Compliance state engine, CCP event tracking, history
        liquidity.py             A-Token flow aggregation, corridor utilisation
        prediction.py            Rule-based corridor and node risk scoring
        seed.py                  10-node synthetic corridor seed data
        state.py                 Live state singleton, tick loop, subscriber callbacks
      simulation/
        engine.py                Eisenberg-Noe cascade model, 5 scenarios, route finder
      api/
        graph.py                 GET /graph/snapshot, /graph/risk, /graph/history
        simulation.py            POST /simulation/run, /route, /reset
        cleanverse.py            Cleanverse proxy endpoints
        audit.py                 GET /audit/report.pdf
        ws.py                    WebSocket handler and broadcast bus

  frontend/
    package.json
    vite.config.ts
    tailwind.config.js
    tsconfig.json
    index.html
    src/
      main.tsx                   React entry point
      App.tsx                    BrowserRouter + all 6 routes
      index.css                  Design system: variables, typography, buttons,
                                 cards, badges, animations
      lib/
        types.ts                 TypeScript interfaces for all data models
        api.ts                   Fetch-based API client + WebSocket URL helper
      store/
        index.ts                 Zustand store: snapshot, history, risk, scenarios,
                                 simulation frames, selected node
      hooks/
        useLiveGraph.ts          WebSocket connection with auto-reconnect
      components/
        Nav.tsx                  Sticky nav with hexagon logo, live indicator
        GridCanvas.tsx           Animated particle + grid canvas background
        NetworkGraph.tsx         Sigma.js WebGL graph with compliance colors
        RiskPanel.tsx            Network health bar, corridor risk bars, alerts
        TimeSlider.tsx           Frame scrubber for simulation and history
        NodeDetail.tsx           Selected node attributes + route finder button
        ScenarioPanel.tsx        Scenario list with one-click injection
      pages/
        Landing.tsx              Hero, terminal, corridor SVG, stats, comparison,
                                 architecture cards, CTA
        Network.tsx              Full graph twin dashboard with sidebar
        Simulate.tsx             Scenario injection, frame scrubber, route finder
        Corridors.tsx            Per-corridor risk view with live refresh
        Agents.tsx               AI agent monitor and participant table
        Audit.tsx                Compliance report preview and PDF download
```

---

## Setup

### Requirements

- Python 3.11 or higher
- Node.js 18 or higher
- A Cleanverse sandbox account with api-id and api-key

### Backend Setup

```bash
cd backend

pip install fastapi uvicorn httpx pycryptodome networkx python-dotenv reportlab "pydantic>=2.7" pydantic-settings

# Create .env with your credentials
cp .env.example .env   # then fill in values

uvicorn app.main:app --reload --port 8000
```

The backend starts on port 8000. Visit `http://localhost:8000/docs` for interactive API docs.

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
# Starts on http://localhost:5173
```

If the backend runs on a different host or port, set `VITE_API_URL` in `frontend/.env`:

```
VITE_API_URL=http://your-backend-host:8000
```

### Backend Environment Variables

| Variable | Description |
|---|---|
| CLEANVERSE_API_ID | Your Cleanverse app ID (sent as `api-id` header) |
| CLEANVERSE_API_KEY | Base64-encoded AES key (used locally only, never sent) |
| CLEANVERSE_BASE_URL | Cleanverse API base URL (default: UAT sandbox) |

---

## Design System

The frontend uses the same design language as the deepproof project: deep black backgrounds, #c5ff4a lime green as the primary accent color, PT Serif for headings, JetBrains Mono for labels and data, Inter Tight for body text, and zero border-radius throughout.

Custom CSS animations:
- `scanline`: vertical scan overlay across the viewport
- `glitch`: clip-path based glitch effect on hero text
- `cascade-in`: staggered horizontal slide-in for table rows
- `card-trace`: animated gradient border that traces around cards on hover
- `ticker`: horizontal scrolling marquee for the tech stack strip
- `pulse-glow`: lime glow pulse on CTA buttons
- `GridCanvas`: canvas-based animated particle network background

---

## Hackathon Context

Built for the Cleanverse Build: Verified Finance Hackathon, June 12 to 17, 2026.

Track: infrastructure. While all other submitted projects build payment applications (move money, checkout flows, escrow, remittance), Meridian builds the intelligence layer underneath them. The positioning is deliberate: financial infrastructure commands a much larger addressable market than financial applications.

The analogy that anchors the product: air traffic control does not move aircraft. It maintains a live model of where every aircraft is, where it is going, and what conflicts are emerging. Meridian is air traffic control for global money movement.

Post-hackathon, Meridian can evolve into a treasury intelligence platform for payment service providers, remittance companies, enterprise treasury teams, and stablecoin settlement networks operating on Cleanverse infrastructure.
