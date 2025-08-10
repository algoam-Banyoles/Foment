#!/usr/bin/env python3
"""Sync link data from a public Google Sheet to enllacos.json.

Fetches data via the OpenSheet service and writes a JSON file only if
content changed. Environment variables allow customisation, similar to
`update_sheets.py`.

Required env vars:
  • LINKS_SHEET_ID – Google Sheet identifier

Optional env vars:
  • LINKS_SHEET_TAB – sheet tab name or index (default: "1")
  • OUTPUT_FILE     – path of the JSON file (default: "enllacos.json")
  • HTTP_TIMEOUT    – request timeout in seconds (default: 30)
  • HTTP_RETRIES    – number of fetch retries (default: 5)
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

BASE = "https://opensheet.elk.sh"
SHEET_ID = os.getenv("LINKS_SHEET_ID", "").strip()
SHEET_TAB = os.getenv("LINKS_SHEET_TAB", "1").strip() or "1"
OUTPUT_FILE = pathlib.Path(os.getenv("OUTPUT_FILE", "enllacos.json"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
MAX_RETRIES = int(os.getenv("HTTP_RETRIES", "5"))

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; LinkSync/1.0; +https://github.com/<repo>)"
    ),
    "Accept": "application/json",
}


def fetch_json(url: str, tries: int = MAX_RETRIES, timeout: int = TIMEOUT) -> Any:
    """GET helper with custom headers and exponential backoff."""
    last_err: Exception | None = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                return json.loads(resp.read().decode(charset))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            last_err = e
            # stop on explicit 403 from service
            if isinstance(e, urllib.error.HTTPError) and e.code == 403:
                break
            time.sleep(2**i)
    raise RuntimeError(f"Failed to GET {url}: {last_err}") from last_err


def write_if_changed(path: pathlib.Path, data_obj: Any) -> bool:
    """Write JSON file only when content changes (SHA-256 check)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    new_bytes = json.dumps(data_obj, ensure_ascii=False, sort_keys=True).encode(
        "utf-8"
    )
    if path.exists() and hashlib.sha256(path.read_bytes()).digest() == hashlib.sha256(
        new_bytes
    ).digest():
        return False
    path.write_bytes(new_bytes)
    return True


def main() -> None:
    if not SHEET_ID:
        print(
            "ERROR: variable d'entorn LINKS_SHEET_ID no definida.",
            file=sys.stderr,
        )
        sys.exit(2)

    url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(SHEET_TAB, safe='')}"
    try:
        payload = fetch_json(url)
    except Exception as e:
        print(f"Avís: error baixant dades: {e}", file=sys.stderr)
        sys.exit(1)

    if write_if_changed(OUTPUT_FILE, payload):
        print(f"Fitxer actualitzat: {OUTPUT_FILE}")
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()
