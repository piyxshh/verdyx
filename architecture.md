# Verdyx — Architecture Document

> **Version:** 1.0  
> **Last Updated:** 2026-08-20  
> **Status:** Approved for MVP build

---

## 1. System Overview

Verdyx is an ML-powered multi-agent system for predictive enterprise decision intelligence. The core architectural invariant is:

> **Prediction is architecturally prior to interpretation.**  
> The ML model produces a distress probability *before* any LLM agent runs. Agents interpret — they never generate the predictio```
┌─────────────────────────────────────────────────────────────────────┐
│                        VERDYX SYSTEM                                │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐  │
│  │ Frontend │───▶│ Backend  │───▶│  ML Predictor │───▶│  Agents  │  │
│  │ (Next.js)│◀───│ (FastAPI)│◀───│  (sklearn RF) │◀───│(LangGraph│  │
│  └────┬─────┘    └────┬─────┘    └──────────────┘    └──────────┘  │
│       │               │                                             │
│       ▼               ▼                                             │
│  ┌──────────┐   ┌──────────┐                                        │
│  │  Browser │   │In-Memory │                                        │
│  │ LocalStg │   │ DictStore│                                        │
│  └──────────┘   └──────────┘                                        │
│       ┆               ┆ (Optional Cloud Stretch Goal)               │
│       └···············┼·············································┘
│                       ▼
│               ┌──────────────┐
│               │  PostgreSQL  │ (Future SaaS Extension)
│               │  (Supabase)  │
│               └──────────────┘
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Layers

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                   │
│  Next.js 14+ │ Tailwind CSS │ Lucide │ Recharts     │
│  Interactive 10-Ratio Form │ Risk Gauge │ Agent Deck │
│  Client-side LocalStorage Persistence               │
├─────────────────────────────────────────────────────┤
│                   API GATEWAY                        │
│  Next.js API Client (lib/api.ts) → FastAPI Backend   │
│  REST endpoints │ CORS │ Fallback Simulation Engine │
├─────────────────────────────────────────────────────┤
│                 APPLICATION LAYER                    │
│  FastAPI │ Pydantic models │ In-memory store         │
│  Routes: POST /predict │ GET /predict/{id}          │
├─────────────────────────────────────────────────────┤
│                 PREDICTION LAYER                     │
│  RandomForestClassifier (scikit-learn)               │
│  predict_proba() │ feature_importances_ (MDI)        │
│  Loads predictor.pkl & medians via joblib/JSON       │
├─────────────────────────────────────────────────────┤
│              AGENT ORCHESTRATION LAYER               │
│  LangGraph StateGraph                                │
│  Nodes: Predictor → Finance ─┐                      │
│                     Market  ─┼─→ Risk → Decision     │
│                              │                       │
├─────────────────────────────────────────────────────┤
│                  DATA LAYER                          │
│  MVP: Browser LocalStorage + FastAPI In-Memory Store │
│  Production Stretch: Supabase (PostgreSQL + Auth)    │
└─────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Technology |
|---|---|---|
| Presentation | User input form, results display, risk gauge, agent reports | Next.js, Tailwind, Recharts, Lucide |
| API Gateway | Route frontend requests to backend, handle CORS & offline fallback | Fetch API, `lib/api.ts` |
| Application | Request validation, orchestration dispatch, response formatting | FastAPI, Pydantic |
| Prediction | ML inference — distress probability + feature importances | scikit-learn RandomForestClassifier |
| Agent Orchestration | Multi-agent interpretation pipeline | LangGraph, Groq / Gemini / OpenAI |
| Data (MVP) | Instant scenario history without cloud dependencies | Browser `localStorage` + FastAPI in-memory store |
| Data (SaaS Extension) | Multi-tenant auth, cloud scenario sync | Supabase (PostgreSQL + Auth) |           │
├─────────────────────────────────────────────────────┤
│              AGENT ORCHESTRATION LAYER               │
│  LangGraph StateGraph                                │
│  Nodes: Predictor → Finance ─┐                      │
│                     Market  ─┼─→ Risk → Decision     │
│                              │                       │
├─────────────────────────────────────────────────────┤
│                  DATA LAYER                          │
│  PostgreSQL (Supabase) │ Supabase Auth               │
│  Tables: users │ scenarios │ predictions             │
└─────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Responsibility | Technology |
|---|---|---|
| Presentation | User input form, results display, auth UI | Next.js, Tailwind, shadcn/ui, Recharts |
| API Gateway | Route frontend requests to backend, handle CORS | Next.js API routes / direct fetch |
| Application | Request validation, orchestration dispatch, response formatting | FastAPI, Pydantic |
| Prediction | ML inference — distress probability + feature importances | scikit-learn RandomForestClassifier |
| Agent Orchestration | Multi-agent interpretation pipeline | LangGraph, Gemini/OpenAI |
| Data | User auth, scenario persistence, prediction history | Supabase (PostgreSQL + Auth) |

---

## 3. Data Flow — End-to-End Pipeline

### 3.1 Request Flow (Happy Path)

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend (Next.js)
    participant BE as Backend (FastAPI)
    participant ML as ML Predictor
    participant FA as Finance Agent
    participant MA as Market Agent
    participant RA as Risk Agent
    participant DA as Decision Agent
    participant DB as Supabase (PostgreSQL)

    U->>FE: Submit financial ratios form
    FE->>BE: POST /predict {company_features}
    BE->>DB: Create scenario record (status: processing)
    BE->>ML: predict(company_features + median-filled)
    ML-->>BE: distress_probability, top_factors
    
    par Agent Interpretation (parallel)
        BE->>FA: interpret(probability, top_factors, debt/liquidity features)
        FA-->>BE: finance_report
        BE->>MA: interpret(probability, top_factors, margin/revenue features)
        MA-->>BE: market_report
    end
    
    BE->>RA: analyze(probability, top_factors, finance_report, market_report)
    RA-->>BE: risk_report
    
    BE->>DA: synthesize(probability, all reports)
    DA-->>BE: final_verdict, confidence, reasoning_summary
    
    BE->>DB: Update scenario (status: completed, results)
    BE-->>FE: 200 OK {prediction_id}
    FE->>BE: GET /predict/{id}/result
    BE-->>FE: Full result payload
    FE-->>U: Render verdict + agent reports
```

### 3.2 Data Transformation Pipeline

```
User Input (8-10 fields)
    │
    ▼
Feature Vector Construction
    │  Merge user input with dataset medians
    │  Result: 95-dimension feature vector
    │
    ▼
ML Prediction (NO LLM involved)
    │  RandomForestClassifier.predict_proba()
    │  Output: float (0.0–1.0)
    │  + sorted feature_importances_ top 5
    │
    ▼
Agent Context Assembly
    │  Package: probability + top_factors + raw features
    │  Split features by domain:
    │    - Debt/liquidity → Finance Agent
    │    - Margin/revenue → Market Agent
    │    - Full set → Risk Agent
    │
    ▼
LLM Interpretation (3 agents, parallel where possible)
    │  Each agent receives ML output as FACT, not suggestion
    │  Agents explain, they do NOT re-estimate
    │
    ▼
Decision Synthesis
    │  Decision Agent reads all 3 reports + probability
    │  Outputs: risk_tier, confidence, reasoning_summary
    │
    ▼
Structured Response → Frontend
```

---

## 4. Component Architecture (Monorepo Layout)

Verdyx is structured as a unified full-stack monorepo:

### 4.1 Monorepo Root & Serverless Gateway
```
JU-project/ (Root Monorepo)
├── api/
│   └── index.py                    # Vercel Python serverless entrypoint (@vercel/python)
├── vercel.json                     # Unified Vercel build & route rules
├── package.json                    # Root scripts (run frontend & backend concurrently)
├── architecture.md                 # System architecture & ADRs
├── AGENTS.md                       # LLM agent context & project progress log
├── TASKS.md                        # Project roadmap & completion tracker
└── VERDYX_ARCHITECTURE_AND_ML_GUIDE.html # Master educational & technical guide
```

### 4.2 Frontend Components (`frontend/`)

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout with dark theme & SEO metadata
│   ├── page.tsx                    # Main unified executive decision dashboard
│   └── globals.css                 # Styling tokens & scrollbars
├── components/
│   ├── navbar.tsx                  # Minimal header with status indicators
│   ├── scenario-form.tsx           # 10-ratio financial form + 1-click presets
│   ├── risk-gauge.tsx              # Animated radial distress probability gauge
│   ├── feature-importance-chart.tsx # Recharts horizontal bar chart (Top Gini factors)
│   ├── agent-report-card.tsx       # 4-Agent Deck (Finance, Market, Risk, Decision)
│   ├── what-if-sandbox.tsx         # Real-time sensitivity sliders
│   └── history-log.tsx             # LocalStorage scenario evaluation history
├── lib/
│   ├── types.ts                    # TypeScript schema definitions
│   ├── constants.ts                # Form ratio configs & demo presets
│   └── api.ts                      # Backend connector with local simulation fallback
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

### 4.3 Backend Components (`backend/`)

```
backend/
├── main.py                         # FastAPI app factory, CORS, lifespan
├── routers/
│   └── predict.py                  # /predict endpoints
├── orchestrator/
│   ├── graph.py                    # LangGraph StateGraph definition
│   ├── state.py                    # ScenarioState TypedDict
│   └── config.py                   # LLM provider selection + config
├── agents/
│   ├── base_agent.py               # Shared agent utilities
│   ├── finance_agent.py            # Solvency/liquidity interpreter
│   ├── market_agent.py             # Operating/competitive position interpreter
│   ├── risk_agent.py               # Failure mode identifier
│   └── decision_agent.py           # Final verdict synthesizer
├── prediction/
│   ├── predictor.py                # Loads .pkl, runs inference
│   └── feature_config.py           # Feature names, medians, form field mapping
├── models/
│   └── schemas.py                  # Pydantic request/response models
├── db/
│   └── supabase_client.py          # Supabase Python client
├── requirements.txt
└── .env.example
```

### 4.3 ML Components

```
ml/
├── train_model.ipynb               # End-to-end training notebook
├── train_model.py                  # Script version for reproducibility
├── data/
│   └── taiwanese_bankruptcy.csv    # UCI dataset (6,819 × 96)
├── models/
│   ├── predictor.pkl               # Trained RandomForestClassifier
│   └── feature_medians.json        # Median values for all 95 features
├── evaluation/
│   └── metrics.json                # Precision, recall, F1, AUC scores
└── DATA_SOURCES.md                 # Citation + license
```

---

## 5. State Management

### 5.1 ScenarioState (LangGraph Shared State)

This is the single state object that flows through the entire agent pipeline:

```python
from typing import TypedDict

class ScenarioState(TypedDict):
    # --- Input (populated from form submission) ---
    scenario_id: str                    # UUID, assigned at creation
    user_id: str                        # From Supabase auth
    company_features: dict[str, float]  # 8-10 user fields + median-filled remainder
    
    # --- ML Prediction (populated by predictor node — FIRST) ---
    distress_probability: float         # 0.0 to 1.0, from predict_proba
    top_factors: list[tuple[str, float]] # (feature_name, importance_score), top 5
    
    # --- Agent Reports (populated sequentially) ---
    finance_report: str                 # From Finance Agent
    market_report: str                  # From Market Agent
    risk_report: str                    # From Risk Agent
    
    # --- Final Verdict (populated by Decision Agent — LAST) ---
    final_verdict: str                  # "Low Risk" | "Medium Risk" | "High Risk"
    confidence: float                   # 0.0 to 1.0
    reasoning_summary: str              # Plain-English explanation
```

### 5.2 LangGraph Execution Graph

```mermaid
graph TD
    START([Start]) --> PREDICT[Predictor Node<br/>RandomForestClassifier]
    PREDICT --> FINANCE[Finance Agent<br/>Solvency & Liquidity]
    PREDICT --> MARKET[Market Agent<br/>Operations & Margins]
    FINANCE --> RISK[Risk Agent<br/>Failure Modes]
    MARKET --> RISK
    RISK --> DECISION[Decision Agent<br/>Final Verdict]
    DECISION --> END([End])
    
    style PREDICT fill:#4CAF50,color:#fff
    style FINANCE fill:#2196F3,color:#fff
    style MARKET fill:#2196F3,color:#fff
    style RISK fill:#FF9800,color:#fff
    style DECISION fill:#F44336,color:#fff
```

**Execution order constraints:**
1. **Predictor** always runs first (no LLM calls, pure ML)
2. **Finance Agent** and **Market Agent** can run in parallel (no dependency on each other)
3. **Risk Agent** runs after both Finance and Market (reads their reports)
4. **Decision Agent** runs last (reads everything)

---

## 6. API Contract

### 6.1 Endpoints

#### `POST /predict` — Submit a new prediction

**Request:**
```json
{
  "company_features": {
    "debt_ratio": 0.62,
    "current_ratio": 1.1,
    "net_income_to_total_assets": 0.02,
    "operating_margin": 0.04,
    "retained_earnings_to_total_assets": 0.05,
    "revenue_per_share": 0.15,
    "total_asset_turnover": 0.8,
    "working_capital_to_total_assets": 0.12
  }
}
```

**Response (202 Accepted):**
```json
{
  "prediction_id": "uuid-here",
  "status": "processing",
  "message": "Prediction pipeline initiated"
}
```

#### `GET /predict/{id}` — Check prediction status

**Response:**
```json
{
  "prediction_id": "uuid-here",
  "status": "processing" | "completed" | "failed",
  "created_at": "2026-08-20T10:30:00Z"
}
```

#### `GET /predict/{id}/result` — Get full prediction result

**Response (200 OK):**
```json
{
  "prediction_id": "uuid-here",
  "status": "completed",
  "distress_probability": 0.71,
  "risk_tier": "High Risk",
  "top_factors": [
    {"feature": "Debt ratio", "importance": 0.18},
    {"feature": "Operating Profit Rate", "importance": 0.12},
    {"feature": "Retained Earnings to Total Assets", "importance": 0.09}
  ],
  "agent_reports": {
    "finance": "Solvency is fragile — debt ratio well above...",
    "market": "Thin operating margin suggests weak pricing...",
    "risk": "Combination of high leverage + thin margin is..."
  },
  "final_verdict": {
    "tier": "High Risk",
    "confidence": 0.85,
    "reasoning": "Primary drivers: leverage and margin, not liquidity in isolation..."
  },
  "created_at": "2026-08-20T10:30:00Z"
}
```

#### `GET /predict` — List prediction history (per user)

**Response:**
```json
{
  "predictions": [
    {
      "prediction_id": "uuid-1",
      "risk_tier": "High Risk",
      "distress_probability": 0.71,
      "created_at": "2026-08-20T10:30:00Z"
    },
    {
      "prediction_id": "uuid-2",
      "risk_tier": "Low Risk",
      "distress_probability": 0.12,
      "created_at": "2026-08-19T14:00:00Z"
    }
  ]
}
```

### 6.2 Error Responses

```json
{
  "detail": "Error message",
  "error_code": "PREDICTION_FAILED" | "AGENT_ERROR" | "VALIDATION_ERROR",
  "status_code": 400 | 500
}
```

---

## 7. Database Schema

### 7.1 Supabase Tables

```sql
-- Users table (managed by Supabase Auth, extended with profile)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenarios / Predictions
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'completed', 'failed')),
    
    -- Input
    company_features JSONB NOT NULL,
    
    -- ML Output
    distress_probability FLOAT,
    top_factors JSONB,  -- [{feature, importance}, ...]
    
    -- Agent Reports
    finance_report TEXT,
    market_report TEXT,
    risk_report TEXT,
    
    -- Final Verdict
    final_verdict TEXT,
    confidence FLOAT,
    reasoning_summary TEXT,
    risk_tier TEXT CHECK (risk_tier IN ('Low Risk', 'Medium Risk', 'High Risk')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT
);

-- Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
    ON predictions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
    ON predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

---

## 8. Agent Prompt Architecture

Each agent receives a structured prompt with the ML prediction as **established fact**, not suggestion.

### 8.1 Prompt Template Pattern

```
You are the {AGENT_ROLE} in a financial distress analysis system.

IMPORTANT: The distress probability of {distress_probability}% has already been
computed by a trained RandomForestClassifier on verified financial data.
Your job is to INTERPRET and EXPLAIN this prediction — NOT to generate your own
probability estimate. The number is a fact; your job is to explain WHY it
makes sense given the financial data below.

## Prediction Context
- Distress Probability: {distress_probability}%
- Top Contributing Factors: {top_factors}

## Company Financial Data
{relevant_features}

## Your Task
{agent_specific_instructions}
```

### 8.2 Agent-Specific Instructions

| Agent | Focus Area | Input Features | Instruction |
|---|---|---|---|
| Finance Agent | Solvency & Liquidity | Debt ratio, current ratio, retained earnings/total assets, working capital/total assets | Explain the company's solvency position and liquidity cushion. Reference specific ratios and compare to healthy ranges observed in the training dataset. |
| Market Agent | Operations & Margins | Operating margin, revenue per share, total asset turnover, net income/total assets | Explain the company's operational efficiency and competitive position. Assess pricing power and cost control. |
| Risk Agent | Failure Modes | All features + finance_report + market_report | Identify specific, named failure modes. Don't just say "risky" — say what specific scenario would cause distress. |
| Decision Agent | Synthesis | All reports + probability | Produce a final verdict: risk tier (Low/Medium/High), confidence score, and a 2-3 sentence plain-English summary of primary drivers. |

---

## 9. Feature Engineering & Form Mapping

### 9.1 Form Fields → Model Input

The user fills in 8-10 key financial ratios. The remaining ~85 features are filled with their **dataset median values** so the model always receives a complete 95-dimension vector.

```python
# feature_config.py
FORM_FIELDS = {
    "debt_ratio": {
        "label": "Debt Ratio",
        "description": "Total Debt / Total Assets",
        "dataset_column": "Debt ratio %",
        "min": 0.0, "max": 1.0, "step": 0.01,
        "default_median": 0.43  # from dataset
    },
    # ... 7-9 more fields, determined after training
}

# At inference time:
full_vector = DATASET_MEDIANS.copy()       # 95 features, all at median
full_vector.update(user_input)              # overwrite the 8-10 user-provided
model.predict_proba([list(full_vector.values())])
```

### 9.2 Feature Domain Mapping (for agent routing)

```python
FINANCE_FEATURES = [
    "Debt ratio %", "Current Ratio", "Quick Ratio",
    "Retained Earnings to Total Assets",
    "Working Capital to Total Assets",
    "Borrowing dependency"
]

MARKET_FEATURES = [
    "Operating Profit Rate", "Net Income to Total Assets",
    "Revenue Per Share (Yen)", "Total Asset Turnover",
    "Operating Profit Per Share (Yen)"
]
```

---

## 10. Deployment & Monorepo Architecture

Verdyx is configured as a full-stack monorepo with multiple deployment topologies supported:

### 10.1 Unified Vercel Monorepo Topology (Single Deployment)

In this primary topology, Next.js and the Python ML + Agent backend are bundled and deployed together under a single Vercel project via serverless routing:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VERCEL MONOREPO DEPLOYMENT                         │
│                                                                             │
│                        Incoming Request (https://verdyx.app)                │
│                                      │                                      │
│                                      ▼                                      │
│                        ┌───────────────────────────┐                        │
│                        │    Vercel Edge Router     │                        │
│                        │       (vercel.json)       │                        │
│                        └─────────────┬─────────────┘                        │
│                                      │                                      │
│                 ┌────────────────────┴────────────────────┐                 │
│                 │                                         │                 │
│                 ▼                                         ▼                 │
│     Path: /predict, /health                    Path: /* (All UI pages)      │
│  ┌─────────────────────────────┐        ┌────────────────────────────────┐  │
│  │   Python Serverless Gateway │        │     Next.js 16 SSR & Static    │  │
│  │       (api/index.py)        │        │           (frontend/)          │  │
│  ├─────────────────────────────┤        ├────────────────────────────────┤  │
│  │ • @vercel/python runtime    │        │ • Interactive 10-Ratio Form    │  │
│  │ • In-Memory RandomForest    │        │ • Radial Probability Gauge     │  │
│  │ • LangGraph 5-Node StateDAG │        │ • Top Gini Attribution Chart   │  │
│  │ • Groq LLM Multi-Agents     │        │ • 4-Agent Domain Deck          │  │
│  │ • Fast in-memory inference  │        │ • LocalStorage History Store   │  │
│  └─────────────────────────────┘        └────────────────────────────────┘  │
│                                                                             │
│  Environment Variables:                                                     │
│  • GROQ_API_KEY / GEMINI_API_KEY                                            │
│  • LLM_PROVIDER = "groq"                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Monorepo Routing Rules (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/predict",
      "dest": "api/index.py"
    },
    {
      "src": "/predict/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/health",
      "dest": "api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

### 10.2 Distributed Deployment Topology (Alternative / Production Scaling)

For heavy concurrent enterprise workloads requiring dedicated CPU threads for continuous ML batch scoring, the backend can alternatively be deployed to Render or Railway while keeping the Next.js frontend on Vercel:

```
┌────────────────────────────┐     ┌────────────────────────────┐
│        VERCEL               │     │     RENDER / RAILWAY       │
│                             │     │                            │
│  ┌──────────────────────┐  │     │  ┌──────────────────────┐  │
│  │    Next.js App        │  │────▶│  │    FastAPI Server     │  │
│  │    (frontend/)        │  │     │  │    (uvicorn main:app) │  │
│  └──────────────────────┘  │     │  └──────────┬───────────┘  │
│                             │     │             │              │
│  Environment:               │     │  ┌──────────▼───────────┐  │
│  NEXT_PUBLIC_API_URL       │     │  │  predictor.pkl        │  │
│                             │     │  │  (loaded at startup)  │  │
│                             │     │  └────────────────────────┘  │
└────────────────────────────┘     │  Environment:              │
                                    │  GROQ_API_KEY              │
                                    └────────────────────────────┘
```

### 10.3 Local Monorepo Development (Zero-CORS)

A single root command starts both the FastAPI Python backend and the Next.js frontend concurrently:

```bash
# In Monorepo Root:
npm run dev
```
- **Backend:** Starts FastAPI on `http://127.0.0.1:8000` with hot-reload.
- **Frontend:** Starts Next.js on `http://localhost:3000`.
- **Client Fallback:** If the backend is booting up, `frontend/lib/api.ts` automatically executes high-fidelity local simulation, preventing UI crashes.

### 10.4 Performance Considerations

| Component | Expected Latency | Notes |
|---|---|---|
| ML Prediction | <100ms | In-memory model, zero disk I/O |
| Finance Agent | 1.5-3s | Groq `openai/gpt-oss-120b` inference |
| Market Agent | 1.5-3s | Concurrently executed with Finance Agent |
| Risk Agent | 1.5-3s | Sequential after Finance + Market outputs |
| Decision Agent | 1.5-3s | Final synthesized verdict |
| **Total Pipeline** | **6-10s** | Parallel execution on Groq LPU hardware |
| History Read/Write | <1ms | Client-side `localStorage` |

---

## 11. Security Considerations

1. **API Keys:** LLM keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) are stored server-side only in Vercel environment variables and never exposed to client bundles.
2. **Input Clamping & Validation:** Pydantic models validate data types, while feature range bounds protect the model against extreme out-of-distribution values.
3. **CORS:** Configured with specific allowed origins in FastAPI, eliminated completely when deployed under unified Vercel monorepo routing.

---

## 12. Architectural Decision Records (ADRs)

### ADR-001: Prediction before interpretation
**Decision:** ML model runs before any LLM agent, with no exceptions.  
**Rationale:** This is the core novelty claim. If agents could estimate the probability themselves, the ML model becomes redundant and the architecture loses its defensibility.

### ADR-002: RandomForest over XGBoost
**Decision:** Use `RandomForestClassifier` instead of `XGBoostClassifier`.  
**Rationale:** Same model family (tree ensemble), but RF has fewer hyperparameters, more forgiving defaults, and better beginner documentation. The architecture doesn't depend on which tree ensemble is used.

### ADR-003: Median-fill for unexposed features
**Decision:** Features not on the input form are filled with their dataset median.  
**Rationale:** The model requires all 95 features. Dataset median is a neutral default that doesn't bias the prediction toward distress or health. More sophisticated imputation is a stretch goal.

### ADR-004: Parallel Finance + Market, sequential Risk → Decision
**Decision:** Finance and Market agents run in parallel; Risk depends on both; Decision depends on Risk.  
**Rationale:** Risk Agent needs Finance and Market reports to identify compound failure modes. Decision Agent needs all context for final synthesis. Parallelizing Finance + Market saves 2-5s.

### ADR-005: class_weight='balanced' over SMOTE
**Decision:** Use `class_weight='balanced'` for handling class imbalance.  
**Rationale:** Single parameter, no additional pipeline complexity. SMOTE is a valid stretch goal but `class_weight='balanced'` is sufficient for the MVP and well-documented for this dataset.

### ADR-006: LocalStorage + In-Memory Store for MVP (Decoupled from Supabase)
**Decision:** Use browser `localStorage` on the frontend and an in-memory dictionary on the FastAPI backend for scenario history persistence during the MVP/demo phase. Supabase (PostgreSQL + Auth) is retained as an optional future SaaS extension.  
**Rationale:** The core novelty of Verdyx is the ML-Prior multi-agent decision intelligence architecture. Requiring cloud database credentials, row-level security setups, and user authentication adds external failure points without contributing to the machine learning or agentic reasoning thesis. LocalStorage + in-memory store provides instant, reliable, zero-latency persistence suitable for live executive demonstrations and offline presentations.

### ADR-007: Unified Full-Stack Monorepo with Vercel Serverless Gateway
**Decision:** Organize the project as a unified monorepo with `api/index.py` serving as the serverless bridge for FastAPI under `@vercel/python`, paired with Next.js App Router under `@vercel/next`.  
**Rationale:** A unified monorepo simplifies deployment to a single `git push`, eliminates cross-origin resource sharing (CORS) complexity in production by routing `/predict` under the same domain, and ensures that ML model weights, multi-agent logic, and frontend components remain version-synchronized.

---

*This document should be updated as architectural decisions evolve during development.*
