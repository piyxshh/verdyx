"""
Vercel Serverless Function Entry Point for Verdyx FastAPI Backend

Exposes the FastAPI application to Vercel's @vercel/python runtime.

Vercel Build Notes:
- Dependencies are installed from api/requirements.txt (mirrors backend/requirements.txt)
- backend/ and ml/ are bundled via vercel.json `includeFiles`
- Model path in backend/main.py resolves absolute via Path(__file__), not CWD,
  so it works both locally (backend/venv) and on Vercel (/var/task)
"""

import sys
from pathlib import Path

# Resolve project root robustly both locally and on Vercel's /var/task
# api/index.py -> api/ -> JU-project (root)
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

# Ensure backend is importable (handles both `from main import app` and
# potential Vercel flattening where api/ and backend/ are siblings)
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

try:
    from main import app  # type: ignore

    # Vercel's Python runtime expects either `app` (ASGI) or `handler`.
    # FastAPI's `app` is sufficient; Mangum is not required on Vercel's
    # native ASGI bridge, but we expose `handler` as fallback for AWS compat.
    try:
        from mangum import Mangum

        handler = Mangum(app)
    except ImportError:
        handler = app
except Exception as e:
    # Fail loudly in Vercel build logs instead of silently returning 500
    import traceback

    print(f"[verdyx] Failed to import FastAPI app from backend/main.py: {e}", file=sys.stderr)
    traceback.print_exc()

    # Expose a minimal error app so Vercel still returns a diagnosable response
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    error_app = FastAPI(title="Verdyx API (Import Error)")

    @error_app.get("/health")
    async def health_error():
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": f"Backend import failed: {e}"},
        )

    @error_app.post("/predict")
    @error_app.get("/predict")
    @error_app.get("/predict/{path:path}")
    async def predict_error():
        return JSONResponse(
            status_code=500,
            content={"status": "error", "detail": f"Backend import failed: {e}"},
        )

    app = error_app  # type: ignore
    handler = app  # type: ignore
