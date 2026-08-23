# Verdyx — Task List

> **Last Updated:** 2026-08-23  
> **Legend:** `[ ]` = TODO, `[/]` = In Progress, `[x]` = Done

---

## Phase 0: Project Setup & Scaffolding
- [x] Read and analyze AGENTS.md thoroughly
- [x] Create architecture.md
- [x] Create PRD/implementation plan
- [x] Create task list (this file)
- [x] Scaffold project directory structure
- [x] Create backend boilerplate files
- [x] Create ML directory and boilerplate
- [x] Create frontend boilerplate (Next.js)
- [x] Create environment variable templates
- [x] Update AGENTS.md with progress

---

## Phase 1: ML Foundation
- [x] Download Taiwanese Bankruptcy Prediction dataset
  - [x] From UCI ML Repository or Kaggle mirror
  - [x] Place in `ml/data/taiwanese_bankruptcy.csv`
- [x] Create `ml/DATA_SOURCES.md` with citation + license
- [x] Build training script / pipeline (`ml/train_model.py`)
  - [x] Load and explore dataset (6,819 rows × 96 columns)
  - [x] Check class distribution (verified: 96.77% not bankrupt, 3.23% bankrupt)
  - [x] Train/test split (80/20, stratified, random_state=42)
  - [x] Train RandomForestClassifier(n_estimators=200, class_weight='balanced')
  - [x] Evaluate: classification_report + roc_auc_score (Achieved AUC = 0.9506)
  - [x] Identify top 10 features by feature_importances_
  - [x] Export model: `joblib.dump()` → `ml/models/predictor.pkl`
  - [x] Export medians: `ml/models/feature_medians.json`
  - [x] Export metrics: `ml/evaluation/metrics.json`
- [x] Verify model AUC > 0.80 (Achieved AUC: 0.9506)

---

## Phase 2: Backend Core
- [x] Set up Python virtual environment (`backend/venv`)
- [x] Install dependencies (requirements.txt: scikit-learn 1.9.0, langgraph, langchain-groq, fastapi)
- [x] Implement `backend/prediction/predictor.py`
  - [x] Predictor class: load .pkl + medians
  - [x] predict() method: merge user input + medians → full vector → predict_proba
  - [x] Return distress_probability + top_factors
- [x] Implement `backend/prediction/feature_config.py`
  - [x] FORM_FIELDS dict with label, description, ranges
  - [x] FINANCE_FEATURES and MARKET_FEATURES lists
  - [x] DATASET_MEDIANS loaded from JSON
- [x] Implement `backend/models/schemas.py`
  - [x] PredictionRequest (Pydantic)
  - [x] PredictionResultResponse (Pydantic)
  - [x] PredictionStatus enum
- [x] Implement `backend/routers/predict.py`
  - [x] POST /predict (runs full 5-node LangGraph pipeline inline)
  - [x] GET /predict/{id}
  - [x] GET /predict/{id}/result
  - [x] GET /predict (in-memory history)
- [x] In-Memory Persistence Layer (FastAPI `predictions_store`)
- [x] Implement `backend/main.py`
  - [x] FastAPI app with CORS
  - [x] Lifespan: load model + compile LangGraph StateGraph at startup
  - [x] Include routers
  - [x] Health check endpoint (`GET /health`)

---

## Phase 3: Agent Pipeline
- [x] Implement `backend/orchestrator/state.py`
  - [x] ScenarioState TypedDict (strict population order)
- [x] Implement `backend/orchestrator/config.py`
  - [x] LLM provider selection (Groq `openai/gpt-oss-120b`, fallback `openai/gpt-oss-20b` / Gemini)
  - [x] Environment-based configuration (`.env.local`)
- [x] Implement `backend/agents/base_agent.py`
  - [x] Shared prompt template pattern (ML result as established fact)
  - [x] Async LLM call wrapper with error handling
- [x] Implement `backend/agents/finance_agent.py`
  - [x] Prompt: interpret solvency/liquidity
  - [x] Input: probability + debt-related features
  - [x] Output: finance_report
- [x] Implement `backend/agents/market_agent.py`
  - [x] Prompt: interpret operating position & profitability
  - [x] Input: probability + margin/ROA features
  - [x] Output: market_report
- [x] Implement `backend/agents/risk_agent.py`
  - [x] Prompt: identify compound failure modes
  - [x] Input: all data + finance_report + market_report
  - [x] Output: risk_report
- [x] Implement `backend/agents/decision_agent.py`
  - [x] Prompt: synthesize final executive verdict
  - [x] Input: probability + all reports
  - [x] Output: final_verdict + confidence + reasoning_summary
- [x] Implement `backend/orchestrator/graph.py`
  - [x] LangGraph StateGraph with 5 nodes
  - [x] Edge wiring: predictor → [finance, market] (parallel) → risk → decision
  - [x] Compile graph into FastAPI `app.state.graph`

---

## Phase 4: Frontend
- [x] Initialize Next.js project
  - [x] TypeScript + Tailwind CSS
  - [x] Install Recharts, Lucide Icons, clsx, tailwind-merge
- [x] Build dashboard layout
  - [x] Executive minimal dark navbar & context header
  - [x] Model accuracy & agent status badges
  - [x] Responsive layout
- [x] Build scenario input form
  - [x] 10 numeric ratios grouped into Solvency vs. Operations
  - [x] Sliders + number inputs with dataset median reference indicators
  - [x] 1-Click Demo Presets (High Risk, Low Risk, Moderate Risk)
  - [x] Loading state with multi-agent progression steps
- [x] Build results view
  - [x] Radial distress probability gauge with color-coded risk tiers
  - [x] Recharts horizontal bar chart for top Gini feature importances
  - [x] 4-Agent Report Deck (Finance, Market, Risk, Decision)
  - [x] What-If sensitivity analysis sandbox
  - [x] Architecture modal with theoretical invariant explanations
- [x] Client-Side Data & History (LocalStorage)
  - [x] Persist recent scenario predictions locally in browser
  - [x] Instant scenario reload
- [x] Build verification: `npm run build` compiled with 0 errors

---

## Phase 5: Integration, Testing & Deployment
- [ ] End-to-end integration & smoke testing
  - [ ] Start FastAPI backend (`.\venv\Scripts\uvicorn main:app --reload --port 8000`)
  - [ ] Start Next.js frontend (`npm run dev`)
  - [ ] Test live form submission against real backend
- [ ] Verify Demo Presets
  - [ ] Acute Distress Profile (~70%+ distress probability)
  - [ ] Resilient Corporate Profile (~10-20% distress probability)
  - [ ] Marginal Solvency Profile (~35-50% distress probability)
- [ ] Optional Future Stretch: Cloud Database & Deployment
  - [ ] Deploy backend (Railway / Render)
  - [ ] Deploy frontend (Vercel)
  - [ ] Optional: Supabase cloud sync for multi-user accounts

---

## Documentation
- [ ] Update architecture.md with final details
- [ ] Write README.md
- [ ] Document API endpoints in detail
- [ ] Prepare presentation notes
  - [ ] Explain why prediction before interpretation matters
  - [ ] Explain class imbalance handling
  - [ ] Explain feature selection methodology
  - [ ] Show evaluation metrics (not raw accuracy)

---

*Update this task list as work progresses. Check off items as they are completed.*
