# Verdyx — Product Requirements Document & Implementation Plan

> **Version:** 1.0  
> **Last Updated:** 2026-08-20  
> **Author:** AI Assistant  
> **Status:** Ready for review

---

## 1. Product Vision

### 1.1 Problem Statement
Enterprise decision-makers lack tools that combine quantitative ML predictions with qualitative expert interpretation. Existing financial health tools either provide opaque scores (no explanation) or qualitative assessments (no data-backed confidence). Verdyx bridges this gap by using ML to predict and AI agents to interpret.

### 1.2 Solution
Verdyx is an ML-powered multi-agent system that:
1. Accepts structured financial data from a user form (8-10 key ratios)
2. Predicts financial distress probability using a trained RandomForestClassifier
3. Routes the prediction through 3 specialized AI agents for domain-specific interpretation
4. Synthesizes a final verdict with confidence score and plain-English reasoning

### 1.3 Core Differentiator
**Prediction is architecturally prior to interpretation.** Unlike systems where an LLM estimates a score, Verdyx's ML model produces the prediction *before* any LLM runs. Agents explain, they never generate the number. This is defensible because:
- The LLM has no access to raw features until after the model has scored them
- The prediction is reproducible (same input → same probability)
- Feature importances from the model directly guide agent interpretation

---

## 2. Target Users

| Persona | Description | Use Case |
|---|---|---|
| University Evaluator | Professor/jury evaluating the project | Needs to see clear ML + agent architecture separation, understand the "why" |
| Demo Audience | Conference/presentation viewers | Needs a polished UI showing the pipeline visually |
| Financial Analyst (stretch) | Professional assessing company health | Would use the tool to get quick, interpreted risk assessments |

---

## 3. Functional Requirements

### 3.1 Authentication & User Management
| ID | Requirement | Priority |
|---|---|---|
| AUTH-1 | User can sign up with email/password via Supabase | Must Have |
| AUTH-2 | User can log in and maintain session | Must Have |
| AUTH-3 | User can only see their own prediction history | Must Have |
| AUTH-4 | OAuth (Google) sign-in | Nice to Have |

### 3.2 Scenario Input
| ID | Requirement | Priority |
|---|---|---|
| INPUT-1 | Form with 8-10 numeric financial ratio fields | Must Have |
| INPUT-2 | Each field has label, description, valid range, step size | Must Have |
| INPUT-3 | Client-side validation (min/max/required) | Must Have |
| INPUT-4 | Fields determined by trained model's top feature importances | Must Have |
| INPUT-5 | Tooltips explaining what each ratio means | Should Have |
| INPUT-6 | Pre-filled example scenarios (high risk, low risk) for demo | Should Have |

### 3.3 ML Prediction
| ID | Requirement | Priority |
|---|---|---|
| ML-1 | RandomForestClassifier trained on Taiwanese Bankruptcy dataset | Must Have |
| ML-2 | class_weight='balanced' for handling 3.23% class imbalance | Must Have |
| ML-3 | Evaluation with precision, recall, F1, AUC (not raw accuracy) | Must Have |
| ML-4 | predict_proba() returns distress probability (0.0-1.0) | Must Have |
| ML-5 | feature_importances_ identifies top contributing factors | Must Have |
| ML-6 | Unexposed features filled with dataset medians | Must Have |
| ML-7 | Model serialized with joblib, loaded once at backend startup | Must Have |

### 3.4 Agent Pipeline
| ID | Requirement | Priority |
|---|---|---|
| AGENT-1 | Predictor node runs BEFORE any LLM agent, no exceptions | Must Have |
| AGENT-2 | Finance Agent interprets solvency/liquidity from debt-related features | Must Have |
| AGENT-3 | Market Agent interprets operating position from margin-related features | Must Have |
| AGENT-4 | Risk Agent identifies concrete failure modes from all features + reports | Must Have |
| AGENT-5 | Decision Agent synthesizes final verdict (risk tier + confidence + reasoning) | Must Have |
| AGENT-6 | Finance and Market agents run in parallel | Should Have |
| AGENT-7 | Each agent prompt explicitly states the ML probability as fact, not suggestion | Must Have |
| AGENT-8 | Support both Gemini and OpenAI as LLM providers (configurable) | Should Have |

### 3.5 Results Display
| ID | Requirement | Priority |
|---|---|---|
| UI-1 | Display distress probability prominently (gauge/meter visual) | Must Have |
| UI-2 | Show risk tier with color coding (Low=green, Medium=amber, High=red) | Must Have |
| UI-3 | Show top contributing features as bar chart | Must Have |
| UI-4 | Display each agent's report in separate expandable card | Must Have |
| UI-5 | Show final verdict with confidence score and reasoning | Must Have |
| UI-6 | Results view order mirrors pipeline order (prediction → agents → verdict) | Must Have |
| UI-7 | Loading states with agent-by-agent progress indication | Should Have |

### 3.6 History & Dashboard
| ID | Requirement | Priority |
|---|---|---|
| DASH-1 | List all past predictions with date, risk tier, probability | Must Have |
| DASH-2 | Click any past prediction to view full result | Must Have |
| DASH-3 | Dashboard overview shows count of predictions and distribution | Nice to Have |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Full pipeline completes in <15 seconds |
| Performance | ML prediction alone completes in <100ms |
| Availability | Deployed and publicly accessible for demo |
| Security | API keys never exposed to frontend |
| Security | Row Level Security on all user data |
| Scalability | Handles at least 10 concurrent predictions (demo scale) |
| Maintainability | Clear separation between ML, agents, API, and frontend |
| Observability | Pipeline errors logged with context for debugging |

---

## 5. Non-Goals (Explicitly Out of Scope)

- ❌ Free-text scenario parsing / NLP extraction
- ❌ RAG / research agent / web search
- ❌ Scenario branching (Plan A/B/C)
- ❌ Multi-target prediction (revenue, runway, churn)
- ❌ Time-series forecasting
- ❌ Critic/debate agent
- ❌ SMOTE oversampling (stretch goal only)
- ❌ Custom model training through the UI
- ❌ Real-time financial data ingestion

---

## 6. Implementation Plan

### Phase 1: ML Foundation (Days 1-2)

#### 1.1 Dataset Setup
- Download Taiwanese Bankruptcy Prediction dataset from UCI/Kaggle
- Place in `ml/data/taiwanese_bankruptcy.csv`
- Create `DATA_SOURCES.md` with citation and license

#### 1.2 Model Training (`ml/train_model.ipynb` + `ml/train_model.py`)
- Load dataset, explore class distribution
- Train/test split with stratification (80/20, random_state=42)
- Train `RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)`
- Evaluate: classification_report + roc_auc_score
- Export top 8-10 features by importance → determines form fields
- Save model: `joblib.dump(model, 'ml/models/predictor.pkl')`
- Save medians: `ml/models/feature_medians.json`
- Save metrics: `ml/evaluation/metrics.json`

#### 1.3 Deliverables
- Trained model artifact (`.pkl`)
- Feature importance ranking (determines form fields)
- Evaluation metrics (precision, recall, F1, AUC)
- Feature medians JSON for inference-time filling

---

### Phase 2: Backend Core (Days 3-5)

#### 2.1 FastAPI Setup (`backend/main.py`)
- Initialize FastAPI with CORS, lifespan events
- Load model and medians at startup
- Health check endpoint

#### 2.2 Prediction Service (`backend/prediction/predictor.py`)
- `Predictor` class that loads `.pkl` and medians
- `predict(features: dict) → (probability: float, top_factors: list)`
- Feature vector assembly: merge user input with medians

#### 2.3 Feature Config (`backend/prediction/feature_config.py`)
- Map form field names to dataset column names
- Define validation ranges for each form field
- Feature domain mapping (finance vs market features)

#### 2.4 Pydantic Models (`backend/models/schemas.py`)
- `PredictionRequest`: validates form input
- `PredictionResponse`: full result payload
- `PredictionStatus`: processing/completed/failed

#### 2.5 API Routes (`backend/routers/predict.py`)
- `POST /predict` — create prediction, run pipeline
- `GET /predict/{id}` — check status
- `GET /predict/{id}/result` — full result
- `GET /predict` — user's prediction history

#### 2.6 Supabase Client (`backend/db/supabase_client.py`)
- Initialize Supabase Python client
- CRUD operations for predictions table

---

### Phase 3: Agent Pipeline (Days 5-8)

#### 3.1 LangGraph State (`backend/orchestrator/state.py`)
- Define `ScenarioState` TypedDict
- All fields with proper types

#### 3.2 Agent Base (`backend/agents/base_agent.py`)
- Shared prompt template pattern
- LLM call wrapper with error handling
- Response parsing utilities

#### 3.3 Finance Agent (`backend/agents/finance_agent.py`)
- Prompt: interpret debt/liquidity ratios in context of the ML prediction
- Input: probability, top_factors, debt/liquidity features
- Output: finance_report string

#### 3.4 Market Agent (`backend/agents/market_agent.py`)
- Prompt: interpret margin/revenue ratios in context of the ML prediction
- Input: probability, top_factors, margin/revenue features
- Output: market_report string

#### 3.5 Risk Agent (`backend/agents/risk_agent.py`)
- Prompt: identify concrete failure modes from full context
- Input: probability, top_factors, ALL features, finance_report, market_report
- Output: risk_report string

#### 3.6 Decision Agent (`backend/agents/decision_agent.py`)
- Prompt: synthesize final verdict from all context
- Input: probability, all three reports
- Output: final_verdict, confidence, reasoning_summary

#### 3.7 LangGraph Orchestrator (`backend/orchestrator/graph.py`)
- Define StateGraph with 5 nodes (predictor + 4 agents)
- Wire edges: predictor → [finance, market] → risk → decision
- Compile graph with parallel execution for finance/market

#### 3.8 LLM Config (`backend/orchestrator/config.py`)
- Support both Gemini and OpenAI
- Environment variable based selection
- Temperature, max_tokens defaults

---

### Phase 4: Frontend (Days 8-12)

#### 4.1 Next.js Project Setup
- Initialize Next.js with TypeScript
- Install and configure Tailwind CSS
- Install and configure shadcn/ui
- Install Recharts for visualizations
- Configure Supabase client

#### 4.2 Authentication Pages
- Login page with email/password
- Signup page
- Auth callback handler
- Protected route middleware

#### 4.3 Dashboard Layout
- Sidebar navigation
- Header with user info
- Main content area

#### 4.4 New Scenario Page
- Form component with 8-10 numeric fields
- Validation (client-side)
- Submit handler → POST /predict
- Loading/processing state

#### 4.5 Results Page
- Prediction display (probability gauge)
- Feature importance chart (Recharts bar chart)
- Agent report cards (expandable)
- Final verdict display (prominent)
- Back to dashboard link

#### 4.6 History Page
- Table of past predictions
- Click to view full result
- Pagination

#### 4.7 Landing Page
- Project description
- Architecture diagram
- CTA to sign up

---

### Phase 5: Integration & Polish (Days 12-14)

#### 5.1 End-to-End Wiring
- Connect frontend form → backend API → full pipeline → results display
- Handle loading states, errors, timeouts
- Test with example scenarios (high risk + low risk)

#### 5.2 Demo Preparation
- Pre-populate example scenarios
- Ensure pipeline runs cleanly end-to-end
- Polish results view layout and animations

#### 5.3 Deployment
- Deploy frontend to Vercel
- Deploy backend to Railway/Render
- Configure environment variables
- Test deployed version end-to-end

---

## 7. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| LLM API rate limits during demo | High | Medium | Cache agent responses for demo scenarios |
| Model accuracy too low for convincing demo | High | Low | class_weight='balanced' + proper evaluation; dataset is well-studied |
| Agent responses too slow (>15s) | Medium | Medium | Parallel finance/market agents; stream responses if needed |
| Supabase free tier limits | Low | Low | Demo scale is well within free tier |
| LLM generates probability instead of interpreting | Medium | Medium | Prompt engineering with explicit "do not estimate" instructions |

---

## 8. Success Criteria

1. ✅ Model trained with AUC > 0.80 on test set
2. ✅ Full pipeline (form → prediction → agents → verdict) works end-to-end
3. ✅ Demo shows clear contrast between high-risk and low-risk inputs
4. ✅ Architecture separation visible in both code and demo (prediction first, then interpretation)
5. ✅ Evaluation metrics shown in demo are precision/recall/F1/AUC (not raw accuracy)
6. ✅ Deployed and accessible via public URL

---

*This PRD should be updated as requirements evolve and implementation progresses.*
