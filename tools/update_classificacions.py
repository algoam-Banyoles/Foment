#!/usr/bin/env python3
"""Sync classification data from a public Google Sheet to ``classificacions.json``.

Fetches data via the OpenSheet service using ``CLAS_ID`` and writes the
resulting JSON only when the content changes. Mitjana fields are
normalised to dot-based decimals. Inspired by ``update_ranquing.py``.
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, List

BASE = os.getenv("OPENSHEET_BASE", "https://opensheet.elk.sh").rstrip("/")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ClasSync/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}

SHEET_ID = os.getenv("CLAS_ID", "").strip()
SHEET_TAB = os.getenv("CLAS_TAB", "1").strip() or "1"
OUTPUT_FILE = pathlib.Path(os.getenv("OUTPUT_FILE", "classificacions.json"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
RETRIES = int(os.getenv("HTTP_RETRIES", "5"))
MITJANA_RE = re.compile(r"^\d+(\.\d+)?$")


def fetch_json(url: str, timeout: int, retries: int) -> Any:
    """GET JSON with headers and retry/backoff. Stops on 403."""
    delay = 1.0
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 403:
                    raise urllib.error.HTTPError(url, 403, "Forbidden", resp.headers, None)
                charset = resp.headers.get_content_charset() or "utf-8"
                return json.loads(resp.read().decode(charset))
        except urllib.error.HTTPError as e:
            if e.code == 403:
                raise
            err = e
        except Exception as e:  # noqa: BLE001 - broad for retry
            err = e
        if attempt == retries - 1:
            raise err
        time.sleep(delay)
        delay *= 2


def write_if_changed(path: pathlib.Path, data: Any) -> bool:
    """Write JSON file only if content changed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(data, ensure_ascii=False, sort_keys=True).encode("utf-8")
    new_hash = hashlib.sha256(content).digest()
    try:
        old_hash = hashlib.sha256(path.read_bytes()).digest()
        if new_hash == old_hash:
            return False
    except FileNotFoundError:
        pass
    path.write_bytes(content)
    return True


def normalise_rows(rows: List[dict[str, str]]) -> List[dict[str, str]]:
    """Ensure required fields and normalise ``Mitjana*`` to dot decimals."""
    out: List[dict[str, str]] = []
    for row in rows:
        mitjana_general = str(row.get("Mitjana General", "")).replace(",", ".")
        if mitjana_general:
            try:
                mitjana_general = str(float(mitjana_general))
            except ValueError:
                pass
        mitjana_particular = str(row.get("Mitjana Particular", "")).replace(",", ".")
        if mitjana_particular:
            try:
                mitjana_particular = str(float(mitjana_particular))
            except ValueError:
                pass
        record = {
            "Any": row.get("Any", ""),
            "Modalitat": row.get("Modalitat", ""),
            "Categoria": row.get("Categoria", ""),
            "Posició": row.get("Posició", ""),
            "Jugador": row.get("Jugador", ""),
            "Punts": row.get("Punts", ""),
            "Caramboles": row.get("Caramboles", ""),
            "Entrades": row.get("Entrades", ""),
            "MitjanaGeneral": mitjana_general,  # Mitjana fields use dot decimals
            "MitjanaParticular": mitjana_particular,
        }
        out.append(record)
    return out


def main() -> None:
    if not SHEET_ID:
        print("Falta CLAS_ID", file=sys.stderr)
        sys.exit(2)

    url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(SHEET_TAB, safe='')}"
    try:
        data = fetch_json(url, TIMEOUT, RETRIES)
    except Exception as e:
        print(f"Avís: error baixant dades: {e}", file=sys.stderr)
        sys.exit(1)

    rows = normalise_rows(data if isinstance(data, list) else [])
    assert all((not r["MitjanaGeneral"]) or MITJANA_RE.match(r["MitjanaGeneral"]) for r in rows), "MitjanaGeneral format error"
    assert all((not r["MitjanaParticular"]) or MITJANA_RE.match(r["MitjanaParticular"]) for r in rows), "MitjanaParticular format error"
    if write_if_changed(OUTPUT_FILE, rows):
        print(f"Fitxer actualitzat: {OUTPUT_FILE}")
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()
