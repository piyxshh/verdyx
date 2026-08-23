# Verdyx

**An ML-Powered Multi-Agent System for Predictive Enterprise Decision Intelligence**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF6F00?style=flat)](https://langchain-ai.github.io/langgraph/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-RandomForest-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[![ROC-AUC](https://img.shields.io/badge/ROC--AUC-0.9506-emerald?style=flat)]()

---

## 🏛️ System Overview

**Verdyx** is an enterprise risk and strategic decision intelligence platform that unifies empirical Machine Learning with qualitative Multi-Agent LLM reasoning. 

### The Core Invariant
> **Prediction is architecturally prior to interpretation.**  
> The trained Machine Learning model computes the probability of financial distress *first* directly from balance sheet ratios. The specialized LLM agents only interpret, contextualize, and stress-test the statistical prediction — they **never** estimate the number themselves.

```
Structured Input Form (10 Key Financial Ratios)
       │
       ▼
RandomForestClassifier (In-Memory Inference) ───► Distress Probability: 71.4%
       │                                     ───► Top Factors: Gini MDI Weights
       ▼
LangGraph Multi-Agent Domain Interpretations:
  ├── 💰 Finance Agent  ──► Solvency, debt load & liquidity buffer analysis
  ├── 📈 Market Agent   ──► Operating margins, asset turnover & ROA efficiency
  └── ⚡ Risk Agent     ──► Compound failure modes & macroeconomic stress-testing
       │
       ▼
⚖️ Decision Agent ─────► Final Executive Verdict + Confidence Score
```

---

## 🚀 Key Features

1. **Empirical ML Prior:** `RandomForestClassifier` trained on 6,819 verified corporate financial profiles from the Taiwan Economic Journal (UCI Machine Learning Repository).
2. **4 Specialized AI Agents:**
   - **Finance Agent:** Analyzes leverage, borrowing dependency, and debt-to-equity ratios against dataset median reference bands.
   - **Market Agent:** Interprets operational efficiency, return on assets (ROA), and persistent earnings.
   - **Risk Agent:** Identifies cross-domain compound vulnerabilities (e.g., *"Gearing Trap"*).
   - **Decision Agent:** Synthesizes all domain reports into an actionable executive verdict (`High Risk`, `Medium Risk`, `Low Risk`).
3. **Interactive Decision Dashboard:**
   - **1-Click Presets:** *Acute Distress Profile*, *Marginal Solvency Profile*, and *Resilient Corporate Profile*.
   - **Radial Distress Gauge:** Animated color-coded probability arc with model confidence.
   - **Feature Attribution:** Recharts horizontal bar chart visualizing top Gini MDI factor contributions.
   - **What-If Sensitivity Sandbox:** Real-time lever sliders to test scenario resilience under varying financial conditions.
   - **LocalStorage History:** Evaluated scenarios automatically saved in browser storage for instant reload without cloud dependencies.
4. **Full-Stack Monorepo:** Zero-CORS development and seamless 1-click Vercel deployment with `@vercel/python` serverless routing.

---

## 📊 Model Performance Metrics

Trained with `class_weight='balanced'` to explicitly handle severe class imbalance (3.23% distressed companies):

| Metric | Score | Evaluation Context |
|---|---|---|
| **ROC-AUC** | **`0.9506`** | Top-tier discriminative capability |
| **Precision (Distressed)** | **`0.5263`** | Minimizes false insolvency flags |
| **Recall (Distressed)** | **`0.4545`** | Captures true pre-distress signals |
| **F1 Score** | **`0.4878`** | Balanced harmonic mean on minority class |

---

## 🛠️ Full-Stack Monorepo Structure

```
JU-project/
├── api/
│   └── index.py                    # Vercel Serverless Function entrypoint (@vercel/python)
├── backend/                        # FastAPI Backend & Multi-Agent Orchestration
│   ├── main.py                     # App factory, CORS, lifespan model loader
│   ├── requirements.txt            # Python dependencies (scikit-learn 1.9.0, langgraph)
│   ├── agents/                     # Finance, Market, Risk, Decision agent nodes
│   ├── orchestrator/               # LangGraph 5-node StateGraph & LLM config
│   ├── prediction/                 # ML Predictor service & 10-ratio feature config
│   └── routers/                    # POST /predict and GET /predict endpoints
├── frontend/                       # Next.js 16 App Router (TypeScript + Tailwind CSS)
│   ├── app/                        # Executive Dashboard page & dark layout
│   ├── components/                 # Scenario form, risk gauge, Recharts, agent deck
│   ├── lib/                        # API client, constants & TypeScript definitions
│   └── next.config.ts
├── ml/                             # Machine Learning Pipeline
│   ├── train_model.py              # Reproducible training & evaluation pipeline
│   ├── data/                       # Dataset storage
│   └── models/                     # Exported predictor.pkl & feature_medians.json
├── vercel.json                     # Vercel unified monorepo routing configuration
├── package.json                    # Root scripts for full-stack management
└── architecture.md                 # In-depth architectural specifications & ADRs
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js `v18+` & npm
- Python `3.10+`
- Groq API Key (or Gemini / OpenAI API key)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/piyxshh/verdyx.git
cd verdyx

# Create .env.local at root
cp .env.example .env.local
```
Add your API key to `.env.local`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Set Up Backend
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate

# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Set Up Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ 1-Click Vercel Deployment

1. Push your repository to GitHub.
2. Import the project in **[Vercel](https://vercel.com)**.
3. Keep the **Root Directory** as `./` (Root).
4. Add environment variables:
   - `GROQ_API_KEY`: `your_groq_api_key`
   - `LLM_PROVIDER`: `groq`
5. Click **Deploy**.

Vercel will build the Next.js frontend and host the FastAPI backend via `@vercel/python` serverless functions automatically.

---

## 📖 Key Architectural Decisions

- **ADR-001 (Prediction Prior):** ML model runs before any LLM agent, preventing hallucinated probabilities.
- **ADR-002 (Random Forest Classifier):** Robust tree ensemble handling skewed non-linear financial ratios with zero feature scaling requirements.
- **ADR-003 (Median Imputation):** 10 key user inputs merged with 85 dataset medians at inference, ensuring full 95-dimensional model compatibility.
- **ADR-004 (Parallel Orchestration):** Finance and Market agents execute concurrently, reducing pipeline latency to under 10 seconds.
- **ADR-006 (Zero-Dependency Persistence):** Browser `localStorage` + FastAPI in-memory dictionary eliminate external database failure points.
- **ADR-007 (Unified Monorepo):** Next.js App Router and FastAPI serverless gateway deployed under a unified domain.

---

## 📄 License

This project is licensed under the [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) License.
