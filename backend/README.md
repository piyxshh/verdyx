# Verdyx Backend

FastAPI backend for the Verdyx predictive enterprise decision intelligence system.

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Running

```bash
uvicorn main:app --reload --port 8000
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.
