# Verdyx

**An ML-Powered Multi-Agent System for Predictive Enterprise Decision Intelligence**

---

## Overview

Verdyx predicts financial distress probability using a trained RandomForestClassifier and interprets the prediction through multiple specialized AI agents — each explaining a different dimension of the company's financial health. The core architectural invariant: **prediction is prior to interpretation**. The ML model produces a number before any LLM runs.

## Architecture

```
User Input (8-10 financial ratios)
    → RandomForestClassifier (predict_proba + feature_importances_)
    → Finance Agent (solvency/liquidity)    ─┐
    → Market Agent (operations/margins)     ─┤ parallel
    → Risk Agent (failure modes)             ← sequential after Finance + Market
    → Decision Agent (final verdict + confidence + reasoning)
```

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI (Python) |
| ML Model | RandomForestClassifier (scikit-learn) |
| Agent Orchestration | LangGraph |
| LLM | Groq (`llama-3.3-70b-versatile`), Gemini, or OpenAI |
| Database | PostgreSQL (Supabase) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |

## Project Structure

```
verdyx/
├── frontend/          # Next.js app
├── backend/           # FastAPI + agents
│   ├── agents/        # Finance, Market, Risk, Decision agents
│   ├── orchestrator/  # LangGraph pipeline
│   ├── prediction/    # ML predictor + feature config
│   ├── routers/       # API endpoints
│   ├── models/        # Pydantic schemas
│   └── db/            # Supabase client
├── ml/                # Training notebook + data + model artifacts
└── docs/              # Architecture documentation
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env     # Fill in API keys
uvicorn main:app --reload --port 8000
```

### ML Training
```bash
cd ml
python train_model.py    # Or use train_model.ipynb
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

## Dataset

**Taiwanese Bankruptcy Prediction** — UCI Machine Learning Repository  
6,819 companies, 95 financial ratio variables, CC BY 4.0 license.  
[Dataset Link](https://archive.ics.uci.edu/dataset/572/taiwanese+bankruptcy+prediction)

## Key Design Decisions

1. **Prediction before interpretation** — ML model runs before any LLM agent
2. **class_weight='balanced'** — handles 3.23% class imbalance
3. **Evaluation: precision/recall/F1/AUC** — not raw accuracy
4. **Median-fill for unexposed features** — model always receives full 95-feature vector
5. **Parallel Finance + Market agents** — saves 2-5s latency

## Environment Variables

See `backend/.env.example` for the complete list.

## License

Academic project — Jadavpur University
