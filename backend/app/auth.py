from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import requests

from .config import settings
from .db import get_db


def verify_admin(request: Request, db: Session = Depends(get_db)) -> None:
    """Ensure the requester is an admin user.

    Reads the Supabase auth token from the ``sb-access-token`` cookie or the
    ``Authorization`` header. It retrieves the user via Supabase Auth and then
    checks admin rights by executing ``select public.is_admin(email)`` against
    the database.  HTTP exceptions are raised according to the validation
    result.
    """

    token = request.cookies.get("sb-access-token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Missing Supabase session")

    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    try:
        resp = requests.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_service_key,
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )
    except requests.RequestException as exc:  # pragma: no cover - network error
        raise HTTPException(status_code=500, detail="Error contacting Supabase") from exc

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Supabase session")

    email = resp.json().get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid Supabase session")

    try:
        result = db.execute(text("select public.is_admin(:email)"), {"email": email})
        is_admin = result.scalar()
    except Exception as exc:  # pragma: no cover - DB error path
        raise HTTPException(status_code=500, detail="Error checking admin status") from exc

    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    # function returns None if admin; FastAPI treats lack of exception as success
