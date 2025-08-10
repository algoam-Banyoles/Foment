#!/usr/bin/env python3
"""Sync ranking data from a Google Sheet via OpenSheet.

Fetches rows from the spreadsheet identified by ``RANK_ID`` and writes
``ranquing.json`` only when content changes.

Required environment variables:
    • RANK_ID       – Google Sheet identifier

Optional environment variables:
    • RANK_TAB      – sheet tab name or index (default: "1")
    • OUTPUT_FILE   – path of the JSON file (default: "ranquing.json")
    • HTTP_TIMEOUT  – request timeout in seconds (default: 30)
    • HTTP_RETRIES  – number of fetch retries (default: 5)
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
from typing import Any, Dict, List

BASE = "https://opensheet.elk.sh"
SHEET_ID = os.getenv("RANK_ID", "").strip()
SHEET_TAB = os.getenv("RANK_TAB", "1").strip() or "1"
OUTPUT_FILE = pathlib.Path(os.getenv("OUTPUT_FILE", "ranquing.json"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
MAX_RETRIES = int(os.getenv("HTTP_RETRIES", "5"))

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; RanquingSync/1.0; +https://github.com/<repo>)"
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


def normalise_rows(payload: List[Dict[str, str]]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for row in payload:
        record = {
            "Any": row.get("Any", ""),
            "Modalitat": row.get("Modalitat", ""),
            "Posició": row.get("Posició") or row.get("Posicio", ""),
            "Jugador": row.get("Jugador", ""),
            "Mitjana": row.get("Mitjana", ""),
            "Soci": row.get("Soci", ""),
            "Nom": row.get("Nom", ""),
            "Cognom1": row.get("Cognom1", ""),
            "Cognom2": row.get("Cognom2", ""),
        }
        noms = [record.get("Nom", "").strip(),
                record.get("Cognom1", "").strip(),
                record.get("Cognom2", "").strip()]
        nom_complet = " ".join([n for n in noms if n])
        record["NomComplet"] = nom_complet if nom_complet else record["Jugador"]
        if any(record.values()):
            rows.append(record)
    return rows


def main() -> None:
    if not SHEET_ID:
        print(
            "ERROR: variable d'entorn RANK_ID no definida.",
            file=sys.stderr,
        )
        sys.exit(2)

    url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(SHEET_TAB, safe='')}"
    try:
        payload = fetch_json(url)
    except Exception as e:
        print(f"Avís: error baixant dades: {e}", file=sys.stderr)
        sys.exit(1)

    data = normalise_rows(payload if isinstance(payload, list) else [])
    if write_if_changed(OUTPUT_FILE, data):
        print(f"Fitxer actualitzat: {OUTPUT_FILE}")
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()

