"""
Vercel Serverless Function Entry Point for Verdyx FastAPI Backend

Exposes the FastAPI application to Vercel's @vercel/python runtime.
"""

import sys
from pathlib import Path

# Add backend directory to Python path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
sys.path.insert(0, str(backend_dir))

from main import app
