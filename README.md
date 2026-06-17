# Meridian

**The Operating System for Global Money Networks.**

A compliance-native treasury intelligence platform that creates a real-time digital twin of stablecoin payment networks, built on the Cleanverse API stack.

---

## What is Meridian?

Financial institutions, payment service providers, and remittance operators currently discover liquidity shortages, compliance bottlenecks, and settlement failures only after transactions are blocked or funds become trapped. Existing infrastructure shows what happened -- not what is about to happen.

Meridian introduces a predictive intelligence layer: a continuously updating digital replica of a payment network that forecasts risk before money moves.

---

## How It Works

Meridian ingests three Cleanverse primitives and builds a live network model from them:

- **A-Pass** -- verified identity signals for every network participant
- **A-Token** -- compliant aUSDC asset flows across global corridors
- **CCP Protocol** -- compliance evaluations, Travel Rule outcomes, and screening results

The platform models 10 nodes across 5 geographic hubs (US, EU, Brazil, Nigeria, Vietnam) connected by 11 payment corridors, and runs continuous risk analysis across all of them.

---

## Architecture: Five Layers

### Layer 1: Network Graph
Every entity is a node (banks, PSPs, exchanges, wallets, AI agents). Payment relationships are edges. Money becomes flow. Built with NetworkX and visualised via Sigma.js WebGL rendering.

### Layer 2: Compliance State Engine
Every node maintains a live compliance state derived from A-Pass tier, validator status, and expiration signals. Nodes transition between ACTIVE, DEGRADED, FROZEN, and BLOCKED states in real time.

### Layer 3: Liquidity Layer
A-Token flow aggregation across all corridors. Tracks balances, treasury positions, corridor capacity, and settlement availability from `query_txs` and `query_deposit_atoken_list`.

### Layer 4: Simulation Engine
Eisenberg-Noe cascade model. Five pre-built incident scenarios:
- **Sunrise Block** -- US to Nigeria jurisdiction enforcement
- **Liquidity Drain** -- Brazil corridor loses 80% of liquidity
- **Sanctions Hit** -- EU gateway receives sanctions designation
- **Rule Change** -- global min_tier raised to 60
- **Agent Flood** -- 50 AI treasury agents execute simultaneously

### Layer 5: Prediction Layer
Rule-based risk scoring across CCP timeout rates, corridor throughput utilisation, and compliance event frequency. Transparent signals -- no black-box ML. Honest about what requires live calibration data.

---

## Demo Flow

1. Open the app at `http://localhost:5173`
2. The live network twin loads: 10 nodes, money flowing across 5 corridors
3. Navigate to **Simulate** and click **Sunrise Block**
4. Watch the US-NG and EU-NG corridors turn red as the cascade propagates
5. Use the frame scrubber to replay the cascade step by step
6. Run **Find Best Compliant Route** to see the alternative path
7. Navigate to **Audit** and click **Generate PDF** for a full compliance report
8. Use the **Time Slider** on the Network page to scrub through history

---

## Tech Stack

### Backend
| Component | Choice |
|---|---|
| API framework | FastAPI 0.111 |
| Encryption | PyCryptodome -- AES-CBC/PKCS5, 16-byte zero IV |
| Graph model | NetworkX 3.3 |
| Cleanverse client | httpx async |
| PDF generation | ReportLab |
| Live events | FastAPI WebSocket |
| Settings | pydantic-settings |

### Frontend
| Component | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Graph rendering | Sigma.js 3 + Graphology |
| State | Zustand |
| Routing | React Router 6 |
| Styling | Tailwind CSS + custom CSS design system |

---

## Cleanverse API Integration

All encrypted endpoints use AES-256-CBC with PKCS5 padding, a 16-byte zero IV, and the base64-decoded `api-key` as the encryption key. The key is never sent over the wire.

| Endpoint | Usage |
|---|---|
| `POST /generate_apass` | Register synthetic corridor participants |
| `POST /query_apass` | Pull tier and status for compliance engine |
| `POST /verify_apass` | Check A-Token transfer eligibility per node |
| `POST /query_txs` | Aggregate A-Token flows for liquidity layer |
| `POST /query_deposit_atoken_list` | Discover aUSDC contract addresses |
| `POST /validator/verify` | Edge-level compliance check |
| `POST /faucet` | Seed testnet aUSDC for demo |
| `POST /download_travel_rule` | Export compliance report for a transaction |

---

## Project Structure

```
meridian/
  backend/
    app/
      api/          -- FastAPI routers (graph, simulation, cleanverse, audit, ws)
      core/         -- AES crypto, pydantic-settings config
      models/       -- Pydantic graph models (Node, Edge, NetworkSnapshot)
      services/     -- Cleanverse client, compliance engine, liquidity layer,
                       prediction layer, seed data, state manager
      simulation/   -- Eisenberg-Noe cascade engine + 5 scenarios
    .env            -- API credentials (not committed in production)
  frontend/
    src/
      components/   -- Nav, NetworkGraph, GridCanvas, RiskPanel, TimeSlider,
                       NodeDetail, ScenarioPanel
      pages/        -- Landing, Network, Simulate, Corridors, Agents, Audit
      lib/          -- API client, TypeScript types
      store/        -- Zustand global state
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install fastapi uvicorn httpx pycryptodome networkx python-dotenv reportlab "pydantic>=2.7" pydantic-settings
uvicorn app.main:app --reload --port 8000
```

The `.env` file contains the Cleanverse sandbox credentials. These are hackathon credentials that will be revoked after the event -- do not commit them publicly.

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` if the backend runs on a different host.

---

## API Reference

Once the backend is running, interactive docs are available at `http://localhost:8000/docs`.

Key endpoints:

```
GET  /graph/snapshot          -- live network state
GET  /graph/risk              -- full risk report
POST /simulation/run          -- inject a scenario
POST /simulation/route        -- recommend compliant route
POST /simulation/reset        -- restore seed state
GET  /audit/report.pdf        -- generate compliance PDF
WS   /ws                      -- live state stream
```

---

## Corridors

| Corridor | From | To | Capacity |
|---|---|---|---|
| US-US | US Fed PSP | Circle US | $20M |
| US-EU | Circle US | SEBA Bank EU | $15M |
| US-BR | Circle US | Nubank Brazil | $10M |
| US-NG | US Fed PSP | Flutterwave Nigeria | $8M |
| EU-NG | SEBA Bank EU | Flutterwave Nigeria | $6M |
| EU-VN | SEBA Bank EU | MoMo Vietnam | $5M |
| US-VN | US Fed PSP | MoMo Vietnam | $4M |
| VN-VN | MoMo Vietnam | TPBank Vietnam | $3M |

---

## Hackathon Context

Built for the Cleanverse Build: Verified Finance Hackathon (June 12-17, 2026).

Track positioning: while all other projects build payment applications that answer "how do we move money?", Meridian answers "how do we understand, predict, and coordinate an entire financial network?" -- infrastructure, not an application.

The weather forecasting analogy: every financial crisis has leading indicators. They are only visible at the network level.
