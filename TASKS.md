# Verdyx — Task List

> **Last Updated:** 2026-08-20  
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
- [ ] Set up Python virtual environment
- [ ] Install dependencies (requirements.txt)
- [ ] Implement `backend/prediction/predictor.py`
  - [ ] Predictor class: load .pkl + medians
  - [ ] predict() method: merge user input + medians → full vector → predict_proba
  - [ ] Return distress_probability + top_factors
- [ ] Implement `backend/prediction/feature_config.py`
  - [ ] FORM_FIELDS dict with label, description, ranges
  - [ ] FINANCE_FEATURES and MARKET_FEATURES lists
  - [ ] DATASET_MEDIANS loaded from JSON
- [ ] Implement `backend/models/schemas.py`
  - [ ] PredictionRequest (Pydantic)
  - [ ] PredictionResponse (Pydantic)
  - [ ] PredictionStatus enum
- [ ] Implement `backend/routers/predict.py`
  - [ ] POST /predict
  - [ ] GET /predict/{id}
  - [ ] GET /predict/{id}/result
  - [ ] GET /predict (history)
- [ ] Implement `backend/db/supabase_client.py`
  - [ ] Initialize Supabase client
  - [ ] CRUD for predictions table
- [ ] Implement `backend/main.py`
  - [ ] FastAPI app with CORS
  - [ ] Lifespan: load model at startup
  - [ ] Include routers
  - [ ] Health check endpoint
- [ ] Test prediction endpoint with curl/Postman
  - [ ] Test with high-risk input
  - [ ] Test with low-risk input

---

## Phase 3: Agent Pipeline
- [ ] Implement `backend/orchestrator/state.py`
  - [ ] ScenarioState TypedDict
- [ ] Implement `backend/orchestrator/config.py`
  - [ ] LLM provider selection (Gemini/OpenAI)
  - [ ] Environment-based configuration
- [ ] Implement `backend/agents/base_agent.py`
  - [ ] Shared prompt template pattern
  - [ ] LLM call wrapper with error handling
- [ ] Implement `backend/agents/finance_agent.py`
  - [ ] Prompt: interpret solvency/liquidity
  - [ ] Input: probability + debt-related features
  - [ ] Output: finance_report
- [ ] Implement `backend/agents/market_agent.py`
  - [ ] Prompt: interpret operating position
  - [ ] Input: probability + margin-related features
  - [ ] Output: market_report
- [ ] Implement `backend/agents/risk_agent.py`
  - [ ] Prompt: identify failure modes
  - [ ] Input: all data + finance_report + market_report
  - [ ] Output: risk_report
- [ ] Implement `backend/agents/decision_agent.py`
  - [ ] Prompt: synthesize final verdict
  - [ ] Input: probability + all reports
  - [ ] Output: final_verdict + confidence + reasoning_summary
- [ ] Implement `backend/orchestrator/graph.py`
  - [ ] LangGraph StateGraph with 5 nodes
  - [ ] Edge wiring: predictor → [finance, market] → risk → decision
  - [ ] Compile graph
- [ ] Test full pipeline end-to-end (backend only)
  - [ ] Test with Finance Agent first
  - [ ] Add Market Agent
  - [ ] Add Risk Agent
  - [ ] Add Decision Agent
  - [ ] Verify output format matches API contract

---

## Phase 4: Frontend
- [ ] Initialize Next.js project
  - [ ] TypeScript + Tailwind CSS + shadcn/ui
  - [ ] Install Recharts
  - [ ] Configure Supabase client
- [ ] Build authentication
  - [ ] Login page
  - [ ] Signup page
  - [ ] Auth callback
  - [ ] Protected routes middleware
- [ ] Build dashboard layout
  - [ ] Sidebar navigation
  - [ ] Header with user info
  - [ ] Responsive design
- [ ] Build scenario input form
  - [ ] 8-10 numeric fields (from model's top features)
  - [ ] Labels + descriptions + tooltips
  - [ ] Client-side validation (min/max/required)
  - [ ] Submit button → POST /predict
  - [ ] Loading state during submission
- [ ] Build results page
  - [ ] Risk gauge / probability meter (Recharts)
  - [ ] Feature importance bar chart
  - [ ] Agent report cards (expandable)
  - [ ] Final verdict display (prominent, color-coded)
  - [ ] Pipeline order: prediction → agents → verdict
- [ ] Build history page
  - [ ] Table: date, risk tier, probability
  - [ ] Click to view full result
  - [ ] Pagination
- [ ] Build landing page
  - [ ] Hero section with project description
  - [ ] Architecture diagram
  - [ ] CTA to sign up/login
- [ ] Polish UI
  - [ ] Dark mode support
  - [ ] Smooth animations and transitions
  - [ ] Loading skeletons
  - [ ] Error states

---

## Phase 5: Integration, Testing & Deployment
- [ ] End-to-end integration
  - [ ] Frontend form → Backend API → Full pipeline → Results display
  - [ ] Error handling across the stack
  - [ ] Timeout handling (15s max)
- [ ] Create demo scenarios
  - [ ] High-risk example (expect ~70%+ distress probability)
  - [ ] Low-risk example (expect ~10-20% distress probability)
  - [ ] Verify agents produce meaningful interpretations for both
- [ ] Set up Supabase
  - [ ] Create tables (profiles, predictions)
  - [ ] Configure Row Level Security
  - [ ] Test auth flow
- [ ] Deploy backend
  - [ ] Railway or Render
  - [ ] Configure environment variables
  - [ ] Upload predictor.pkl
  - [ ] Test deployed API
- [ ] Deploy frontend
  - [ ] Vercel
  - [ ] Configure environment variables
  - [ ] Test deployed site
- [ ] Final testing
  - [ ] Full end-to-end on deployed version
  - [ ] Both demo scenarios run cleanly
  - [ ] Record demo run for presentation

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
