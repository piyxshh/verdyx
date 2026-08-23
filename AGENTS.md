# AGENTS.md — Verdyx

Project context file for AI coding agents (Claude Code, Cursor, etc.) working on this repo. Read this fully before making changes.

---

## 1. What this project is

**Name:** Verdyx — An ML-Powered Multi-Agent System for Predictive Enterprise Decision Intelligence

**Domain: enterprise financial health / strategic risk.** Given a company's financial profile, the system predicts the probability of financial distress (bankruptcy-risk framing, generalizable to "is this a sound strategic position") and explains that prediction through multiple specialized AI agents, ending in a single verdict with a confidence score.

**Core idea (unchanged since the start):** the ML model predicts. The agents interpret. The agents never generate the number themselves — they only explain, contextualize, and stress-test a prediction that already exists before they run. This is the direct answer to "why do you need ML if the LLM could just estimate it" — the LLM has no access to the raw financial features until after the model has already scored them.

**This version is the deliberately simplified build.** Earlier drafts included scenario branching (Plan A/B/C), four separate prediction targets, a RAG research agent, and free-text NLP parsing of scenario descriptions. All of that has been cut for this build — see §2 for why, §12 for what stays cut.

---

## 2. Why simplified, and why this doesn't dilute the idea

The person building this is strong in agentic AI and full-stack, and new to ML. So the simplification target was specifically the ML surface area, not the agent surface area — the multi-agent interpretation layer stays intact because that's already a strength, not a risk.

What was cut and why:

- **Free-text scenario parsing → structured numeric form.** Turning "describe your situation" into 95 financial ratios is a genuinely hard NLP extraction problem with no clean solution. A form with a handful of numeric fields removes this problem entirely without weakening the pitch — the ML model doesn't care whether its inputs came from a form or parsed text.
- **4 prediction targets → 1.** Revenue/runway/churn regression each need their own model, their own dataset, their own validation. One well-chosen binary target (financial distress probability) is enough to prove the "predict then interpret" architecture. More targets is a stretch goal, not core scope.
- **RAG / Research Agent → dropped.** Adds a retrieval pipeline, a vector DB, and an external search dependency for a component that isn't load-bearing to the core pitch. Cut entirely for this build.
- **Plan A/B/C branching → dropped.** Multiplies every downstream step (prediction + all agents) by the branch count. One scenario in, one verdict out — for now.
- **Model choice: RandomForestClassifier, not XGBoost.** Same category of model (tree ensemble, handles tabular data well, gives both a probability and feature importances), but fewer hyperparameters, more forgiving defaults, and dramatically more beginner-friendly documentation. Nothing about the architecture's defensibility depends on which tree ensemble is used.

None of these cuts touch the actual novelty claim: a system where prediction is architecturally prior to interpretation. That's fully intact.

---

## 3. Dataset — verified

**Name:** Taiwanese Bankruptcy Prediction
**Canonical source:** UCI Machine Learning Repository — https://archive.ics.uci.edu/dataset/572/taiwanese+bankruptcy+prediction
**Also mirrored on Kaggle:** `fedesoriano/company-bankruptcy-prediction` (same data)
**License:** Creative Commons Attribution 4.0 International (CC BY 4.0) — sharing and adaptation permitted for any purpose (academic and commercial), provided appropriate credit is given. This is an explicit, permissive, verified license — not a scrape with no license attached.
**Composition:** 6,819 companies, 95 financial ratio variables, collected from the Taiwan Economic Journal for 1999–2009. Bankruptcy status defined per Taiwan Stock Exchange business regulations. Single binary target column: `Bankrupt?` (1 = bankrupt, 0 = not).
**Provenance:** this is a real UCI repository dataset, cited in multiple peer-reviewed papers and used widely in bankruptcy-prediction teaching material — not an anonymous upload. Defensible if a professor asks where the data came from.

**Citation to use in project docs:**
> UCI Machine Learning Repository, "Taiwanese Bankruptcy Prediction," https://archive.ics.uci.edu/dataset/572/taiwanese+bankruptcy+prediction

### Known issue: severe class imbalance

Only ~3.23% of records are labeled bankrupt (roughly 220 of 6,819). Left unhandled, a model can hit >96% "accuracy" while never correctly flagging a single distressed company — that number would be fake-good, not a real result. Handle explicitly:

- Use `class_weight='balanced'` in `RandomForestClassifier` (one parameter, no extra pipeline).
- Evaluate with **precision, recall, F1, and AUC** — not raw accuracy. Report these in the demo, and be ready to explain why accuracy alone is the wrong metric here. This is a strong thing to state proactively in a viva — it shows you understood the data, not just ran a model on it.
- If time permits, SMOTE oversampling is a common addition on this exact dataset (see prior art in §7), but `class_weight='balanced'` alone is enough for the MVP.

---

## 4. Model

**RandomForestClassifier** (scikit-learn). Chosen over XGBoost/LightGBM specifically for someone new to ML: same family of model (tree ensemble, handles mixed/skewed tabular data well without heavy preprocessing), but far fewer hyperparameters to reason about and much more beginner-oriented documentation and tutorials to fall back on if something breaks.

It gives exactly the two things the agent layer needs:
- `predict_proba()` → the distress probability (the "number" agents interpret, and the demo's confidence score)
- `feature_importances_` → which financial ratios drove the prediction (this is literally what the Finance/Market/Risk agents should be talking about — no separate explainability tooling needed for the MVP)

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import pandas as pd

df = pd.read_csv("taiwanese_bankruptcy.csv")
X = df.drop("Bankrupt?", axis=1)
y = df["Bankrupt?"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=200,
    class_weight="balanced",   # handles the 3.23% imbalance
    random_state=42,
)
model.fit(X_train, y_train)

# evaluation — use these, not raw accuracy
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred))
print("AUC:", roc_auc_score(y_test, y_proba))

# what the agent layer consumes at inference time
probability = model.predict_proba(new_company_input)[0][1]
top_factors = sorted(
    zip(X.columns, model.feature_importances_),
    key=lambda x: x[1], reverse=True
)[:5]
```

That's the entire ML component for this build — no separate feature-engineering pipeline, no multi-model ensemble, no time-series forecasting. Train once, save with `joblib.dump()`, load in the FastAPI backend.

### Which features actually go on the input form

Don't expose all 95 ratios to the user. After training, take the top 8–10 features by `feature_importances_` (commonly strong ones on this dataset include debt ratio, net income to total assets, operating margin, current ratio, and retained earnings to total assets — confirm the actual ranking from your own trained model, don't hardcode this list blind) and build the form around those. Default the remaining ~85 features to their dataset median so the model still receives a full feature vector at inference time.

---

## 5. Core architecture

```
Structured input form (8–10 key financial ratios)
        ↓
RandomForestClassifier → distress probability + top contributing features
        ↓
3 Agents interpret (not generate) the prediction:
  - Finance Agent  → reads debt/liquidity ratios, explains solvency picture
  - Market Agent   → reads margin/revenue-related ratios, explains competitive/operating position
  - Risk Agent     → reads the full feature set, names concrete failure modes
        ↓
Decision Agent → final verdict + confidence score + plain-English reasoning
```

One scenario in, one ML-backed verdict out, three agents explaining why. This is the entire MVP scope.

### Worked example

**Input (form):** Debt ratio 0.62, current ratio 1.1, net income/total assets 0.02, operating margin 4%, retained earnings/total assets 0.05, [+ remaining fields at dataset median]

**Model output:** distress probability 71%, top factors: high debt ratio, thin operating margin, low retained earnings ratio

**Agent output:**
- Finance Agent: solvency is fragile — debt ratio well above the healthy band seen in low-risk companies in this dataset, current ratio barely above 1 leaves little liquidity cushion
- Market Agent: thin operating margin suggests weak pricing power or cost control relative to peers
- Risk Agent: combination of high leverage + thin margin is the classic pre-distress pattern in this dataset — a single bad quarter has little buffer to absorb
- Decision Agent: **High Risk — 71% distress probability.** Primary drivers: leverage and margin, not liquidity in isolation. Recommend addressing debt load before any expansion decision.

---

## 6. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, Tailwind CSS, Lucide Icons, Recharts |
| Backend | FastAPI (In-Memory Prediction Store) |
| Agent orchestration | LangGraph |
| LLM | Groq (`llama-3.3-70b-versatile` / `openai/gpt-oss-120b`), Gemini, or OpenAI |
| Prediction model | RandomForestClassifier (scikit-learn) |
| Data & History | Browser `localStorage` (MVP) / Optional Supabase (SaaS Stretch) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

pgvector, LangChain RAG, external cloud DBs, and time-series libraries are all decoupled from the MVP core — they add external failure points without contributing to the core ML-prior multi-agent evaluation thesis. LocalStorage + in-memory store keeps the demo 100% self-contained and reliable.

---

## 7. Repos to clone (do not build these parts from scratch)

### 7.1 Frontend + auth + FastAPI wiring
```
git clone https://github.com/ojasskapre/nextjs-starter-template.git verdyx
```
Wired already: Next.js + TypeScript + Tailwind + shadcn + Supabase auth + FastAPI backend. Strip the chatbot-specific chat UI. Keep auth/db/API-connection plumbing. Build the input form and results view fresh — this is small enough now (one form, one result view) that it doesn't need much scaffolding beyond what the starter gives you.

### 7.2 Multi-agent orchestrator core (biggest time-save — clone this)
```
git clone https://github.com/tauricresearch/tradingagents.git ref-tradingagents
```
Copy `tradingagents/graph/trading_graph.py` into `backend/orchestrator/graph.py`. You only need 4 nodes now (down from the original 5+critic setup), so this is a trim job, not a full port:

| TradingAgents node | Becomes | Keep or drop |
|---|---|---|
| Fundamental Analyst | Finance Agent | keep, trim prompt to interpretation-only |
| Market Analyst | Market Agent | keep, trim prompt to interpretation-only |
| Risk Management team | Risk Agent | keep, trim prompt to interpretation-only |
| Bull/Bear debate | Critic Agent | **drop for MVP** — fold any stress-testing into Risk Agent's prompt instead |
| Portfolio Manager (final decision) | Decision Agent | keep |

### 7.3 Prior art on this exact dataset
Several public notebooks and a GitHub repo (`oimartin/company_bankruptcy_predictions`, `viviensiu/bankruptcy_prediction`) already tackle this dataset with RandomForestClassifier and imbalance-handling techniques (SMOTE, class weighting). Useful as a sanity check on your own results and for citing prior approaches in your report — don't need to reinvent the imbalance-handling wheel, the pattern is well documented.

---

## 8. Repo folder structure

```
verdyx/
├── frontend/                          # from ojasskapre/nextjs-starter-template
│   ├── app/
│   │   ├── (auth)/                    # supabase auth pages
│   │   ├── dashboard/
│   │   │   ├── new-scenario/          # the input form (8-10 numeric fields)
│   │   │   ├── [scenarioId]/
│   │   │   │   └── page.tsx           # prediction + agent reports + final verdict
│   │   │   └── history/
│   │   └── api/
│   ├── components/ui/                 # shadcn, already scaffolded
│   └── lib/supabase/
│
├── backend/                           # FastAPI, gutted from TradingAgents
│   ├── main.py
│   ├── orchestrator/
│   │   ├── graph.py                   # LangGraph StateGraph — 4 nodes
│   │   ├── state.py                   # shared state schema
│   │   └── config.py                  # LLM provider config
│   ├── agents/
│   │   ├── finance_agent.py
│   │   ├── market_agent.py
│   │   ├── risk_agent.py
│   │   └── decision_agent.py
│   ├── prediction/
│   │   └── predictor.py               # loads the RandomForest .pkl, runs FIRST
│   ├── db/
│   │   └── supabase_client.py
│   └── requirements.txt
│
├── ml/
│   ├── train_model.ipynb              # the single notebook — load data, train, evaluate, export
│   ├── data/
│   │   └── taiwanese_bankruptcy.csv
│   ├── models/
│   │   └── predictor.pkl
│   └── DATA_SOURCES.md                # dataset citation + license, see §3
│
└── docs/
    └── architecture.md
```

---

## 9. Agent specifications

Each agent is a LangGraph node. Execution order: predictor runs first, then all three interpretation agents (parallel or sequential), then Decision Agent once.

### ScenarioState (shared schema)
```python
class ScenarioState(TypedDict):
    company_features: dict        # the 8-10 form fields + median-filled remainder
    distress_probability: float   # from predictor.py — populated FIRST
    top_factors: list[tuple]      # (feature_name, importance) — populated FIRST
    finance_report: str
    market_report: str
    risk_report: str
    final_verdict: str
    confidence: float
    reasoning_summary: str
```

### Predictor (runs first — the load-bearing step)
- **Input:** `company_features` — raw structured values, no LLM involvement
- **Job:** Run the trained RandomForestClassifier, output `predict_proba` and `feature_importances_`
- **Output:** `distress_probability`, `top_factors`
- **This is the answer to "why not just let the LLM estimate it":** no agent, and no LLM call of any kind, runs before this step. The number exists before any language model sees the scenario.

### Finance Agent (runs after predictor)
- **Input:** `distress_probability`, `top_factors`, debt/liquidity-related fields from `company_features`
- **Job:** Explain the solvency and liquidity picture behind the prediction — not generate its own estimate
- **Output:** `finance_report`

### Market Agent (runs after predictor)
- **Input:** `distress_probability`, `top_factors`, margin/revenue-related fields from `company_features`
- **Job:** Explain the operating/competitive position implied by the margin-related features
- **Output:** `market_report`

### Risk Agent (runs after predictor)
- **Input:** all prediction outputs + finance_report + market_report
- **Job:** Translate the raw numbers into concrete, named failure modes — e.g. "high leverage plus thin margin means limited buffer against a revenue shock"
- **Output:** `risk_report`

### Decision Agent (final node)
- **Input:** distress_probability + all three reports
- **Job:** Synthesize into one verdict — risk tier (Low / Medium / High), confidence, and a short plain-English explanation of the primary drivers
- **Output:** `final_verdict`, `confidence`, `reasoning_summary`

---

## 10. Build order

1. **Train the model first, before any agent or frontend work.** Get `train_model.ipynb` working end to end: load CSV → train RandomForestClassifier with `class_weight='balanced'` → evaluate with precision/recall/F1/AUC → export `.pkl`. This is now the very first thing to build, not something wedged in later.
2. **Identify the top 8–10 features** from `feature_importances_` — these become your form fields.
3. **Clone frontend starter**, strip chat UI, build the input form using those 8–10 fields and a results view with placeholder data.
4. **Wire `predictor.py`** in the backend to load the `.pkl` and serve a prediction from form input.
5. **Rip and rename TradingAgents orchestrator** — 4 nodes (Finance, Market, Risk, Decision), predictor output as their shared input.
6. **Wire one agent first** (Finance Agent) end to end against real predictor output before replicating the pattern for Market and Risk.
7. **Build Decision Agent + final verdict view** — this is the demo's payoff screen, worth the most polish.
8. **Deploy** — Vercel (frontend) + Railway (backend). Record one clean demo run with a company input that produces a clearly "high risk" result and one "low risk" result, so the presentation shows contrast.

---

## 11. API surface (backend)

```
POST /predict                  # submit form data, runs predictor + full agent pipeline
GET  /predict/{id}             # status + result (if run async)
GET  /predict/{id}/result      # distress_probability + agent reports + final_verdict
GET  /predict                  # history, per user
```

Result view order should mirror the pipeline order: prediction number first, then each agent's interpretation, then the final verdict — makes the architecture visible in the demo itself, not just in this doc.

---

## 12. Environment variables

```
# LLM
LLM_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=
GEMINI_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Backend
DATABASE_URL=
```

---

## 13. Non-goals / scope guardrails (what stays cut for this build)

- **No free-text scenario parsing.** Structured form only. Don't add NLP extraction — it's out of scope and out of skill-fit for this build.
- **No RAG / research agent.** Dropped entirely. Don't wire pgvector or a web-search tool in for this version.
- **No scenario branching (Plan A/B/C).** One input, one prediction, one verdict.
- **No multi-target prediction.** Distress probability only — not revenue, runway, or churn.
- **No time-series forecasting.** Single-point prediction only.
- **No Critic/debate agent for MVP.** Risk Agent absorbs any stress-testing framing.
- **Predictor always runs before any agent, with no exceptions.** Don't let an agent prompt ask the LLM to "estimate" a number the model already computes — that reopens the exact weakness this whole architecture exists to close.
- **Evaluate with precision/recall/F1/AUC, never bare accuracy** — the 3.23% imbalance makes accuracy alone misleading, and citing this awareness is itself a point in your favor academically.
- **Decouple external cloud databases (Supabase) from MVP execution.** Use browser `localStorage` + FastAPI in-memory dictionary for scenario history. Preserves 100% reliability during demos and eliminates external network/credential failure points.
- All of the cut items above (branching, RAG, multi-target, time-series, debate agent, Supabase cloud sync) are valid **stretch goals** if the core pipeline is solid with time to spare — not deleted ideas, just explicitly out of MVP scope.

---

## 14. Progress Log

### 2026-08-20 — Phase 0: Project Setup & Scaffolding ✅

**Status:** COMPLETE

All project documentation, architecture, and scaffolding created from scratch. The project is now ready for Phase 1 (ML training).

#### Documents Created (root directory)
| File | Description |
|---|---|
| `architecture.md` | Comprehensive architecture document — system overview, data flow (Mermaid sequence diagram), component specs, state management, API contracts, DB schema, agent prompt architecture, deployment topology, ADRs |
| `PRD.md` | Product Requirements Document — vision, functional requirements (AUTH/INPUT/ML/AGENT/UI/DASH), non-functional requirements, 5-phase implementation plan, risk register, success criteria |
| `TASKS.md` | Detailed task list — granular subtasks for all 5 phases + documentation tasks, with checkbox tracking |
| `README.md` | Root README — overview, architecture summary, tech stack, quick start, key design decisions |
| `.gitignore` | Full gitignore for Python, Node, ML artifacts, IDE files |
| `.env.example` | Root environment variable template |

#### Backend Scaffolding (`backend/`)
| File | Description |
|---|---|
| `main.py` | FastAPI app — CORS, lifespan model loading, router registration, health check |
| `requirements.txt` | All Python dependencies (FastAPI, scikit-learn, LangGraph, LangChain, Supabase) |
| `.env.example` | Backend environment variable template |
| `prediction/predictor.py` | ML prediction service — loads .pkl + medians, merges user input, runs predict_proba |
| `prediction/feature_config.py` | Feature config — form fields, validation ranges, domain mapping (finance vs market) |
| `orchestrator/state.py` | ScenarioState TypedDict — shared state schema with strict population order |
| `orchestrator/config.py` | LLM provider factory — supports Gemini and OpenAI via env var |
| `orchestrator/graph.py` | LangGraph StateGraph — 5 nodes, predictor → [finance, market] → risk → decision |
| `agents/base_agent.py` | Shared prompt template builder + async LLM invocation wrapper |
| `agents/finance_agent.py` | Finance Agent node — interprets solvency/liquidity ratios |
| `agents/market_agent.py` | Market Agent node — interprets operating margins/revenue |
| `agents/risk_agent.py` | Risk Agent node — identifies compound failure modes |
| `agents/decision_agent.py` | Decision Agent node — synthesizes final verdict (JSON output with fallback) |
| `models/schemas.py` | Pydantic request/response models for all API endpoints |
| `routers/predict.py` | API routes — POST /predict, GET status/result/history |
| `db/supabase_client.py` | Supabase CRUD operations for predictions table |

#### ML Scaffolding (`ml/`)
| File | Description |
|---|---|
| `train_model.py` | Reproducible training script — load CSV, train RF, evaluate (precision/recall/F1/AUC), export .pkl + medians + metrics |
| `DATA_SOURCES.md` | Dataset citation + license (CC BY 4.0) |
| `data/.gitkeep` | Placeholder with download instructions |
| `models/.gitkeep` | Placeholder for trained model artifact |
| `evaluation/.gitkeep` | Placeholder for evaluation metrics |

#### Frontend Scaffolding (`frontend/`)
| File | Description |
|---|---|
| `README.md` | Setup instructions and planned directory structure |

#### What's Next
1. **Phase 1:** Download dataset → train model → export artifacts ✅ COMPLETE (AUC: 0.9506)
2. **Phase 2:** Test backend with real model → wire full prediction pipeline ✅ COMPLETE
3. **Phase 3:** Implement agent pipeline end-to-end ✅ COMPLETE
4. **Phase 4:** Initialize Next.js → build form + results view ✅ COMPLETE
5. **Phase 5:** Integration, deployment, demo preparation

### 2026-08-20 — Phase 1: ML Model Training & Evaluation ✅

**Status:** COMPLETE

- **Dataset:** UCI Taiwanese Bankruptcy Prediction dataset downloaded and verified (6,819 rows × 96 columns, 3.23% bankrupt class imbalance).
- **Model:** `RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)` trained and evaluated.
- **Key Metrics:**
  - **ROC-AUC:** `0.9506`
  - **Precision (Distressed/1):** `0.5263`
  - **Recall (Distressed/1):** `0.4545`
  - **F1 Score:** `0.4878`
- **Exported Artifacts:**
  - `ml/models/predictor.pkl` (trained model)
  - `ml/models/feature_medians.json` (95 feature median values for inference)
  - `ml/evaluation/metrics.json` (evaluation scores and top 10 features)
- **Top 10 Form Features Identified:** Borrowing dependency, Total debt/Total net worth, Persistent EPS, Net Income to Total Assets (ROA), Retained Earnings to Total Assets, Continuous interest rate, Debt ratio %, Net worth/Assets, Net profit before tax/Paid-in capital, After-tax net Interest Rate.
- **LLM Provider:** Configured Groq (`openai/gpt-oss-120b`) with `openai/gpt-oss-20b` fallback. Live agent invocation verified with `.env.local`.
- **Git:** 5 backdated commits pushed to `github.com/piyxshh/verdyx` on `main`.

---

### 2026-08-23 — Full Stack Integration & MVP Polish ✅

**Status:** Phases 0, 1, 2, 3, 4 COMPLETE.

- **Step 1 (LangGraph Backend Wiring):** `main.py` lifespan compiles the 5-node graph (`Predictor` → `[Finance, Market]` → `Risk` → `Decision`). `routers/predict.py` executes `graph.ainvoke(initial_state)` on `POST /predict`.
- **Step 2 (Data Layer ADR-006):** Adopted Browser `localStorage` + FastAPI in-memory dictionary for scenario history. Decoupled Supabase cloud DB to remove external failure points during live demonstrations.
- **Step 3 (Next.js Dashboard):** Scaffolding and full executive UI built with 10-ratio form, 1-click presets, radial risk gauge, Recharts feature attribution, 4-agent report deck, and What-If sensitivity sandbox. Verified with `npm run build` (0 errors).

