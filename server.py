"""Serve the front-end and expose API and update endpoints using FastAPI."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles

from backend.api import app as api_app


WEB_DIR = Path(__file__).resolve().parent


def _extract_code(request: Request) -> str | None:
    """Return the admin code supplied via header or query string."""

    code = request.headers.get("X-Admin-Code")
    if code is None:
        params = request.query_params
        code = (
            params.get("code")
            or params.get("admin_code")
            or params.get("X-Admin-Code")
        )
    return code


def verify_access(request: Request) -> bool:
    expected = os.environ.get("ADMIN_CODE")
    return expected is not None and _extract_code(request) == expected


SCRIPTS: Dict[str, str] = {
    "/update-ranking": "tools/update_ranquing.py",
    "/update-classificacions": "tools/update_classificacions.py",
    "/update-events": "tools/update_events.py",
    "/update-continu3b": "tools/update_continu3B.py",
}


app: FastAPI = api_app


async def _run_script(script: str) -> dict:
    try:
        subprocess.run(["python3", str(WEB_DIR / script)], check=True)
        return {"status": "ok"}
    except subprocess.CalledProcessError as exc:  # pragma: no cover - error path
        raise HTTPException(status_code=500) from exc


for route, script in SCRIPTS.items():
    @app.get(route)  # type: ignore[misc]
    async def _update(request: Request, script=script) -> dict:
        if not verify_access(request):
            raise HTTPException(status_code=403)
        return await _run_script(script)


app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="static")


if __name__ == "__main__":  # pragma: no cover - manual server start
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

