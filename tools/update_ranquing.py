#!/usr/bin/env python3
"""Sync ranking data from a public Google Sheet to ``ranquing.json``.

Fetches data via the OpenSheet service using ``RANK_ID`` and writes the
resulting JSON only when the content changes.  Inspired by
``update_sheets.py``.
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
from typing import Any, List

BASE = os.getenv("OPENSHEET_BASE", "https://opensheet.elk.sh").rstrip("/")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; RankSync/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}

SHEET_ID = os.getenv("RANK_ID", "").strip()
SHEET_TAB = os.getenv("RANK_TAB", "1").strip() or "1"
OUTPUT_FILE = pathlib.Path(os.getenv("OUTPUT_FILE", "ranquing.json"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
RETRIES = int(os.getenv("HTTP_RETRIES", "5"))


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
    """Ensure required fields and compute ``NomComplet``."""
    out: List[dict[str, str]] = []
    for row in rows:
        record = {
            "Any": row.get("Any", ""),
            "Modalitat": row.get("Modalitat", ""),
            "Posició": row.get("Posició", ""),
            "Jugador": row.get("Jugador", ""),
            "Mitjana": row.get("Mitjana", ""),
            "Soci": row.get("Soci", ""),
            "Nom": row.get("Nom", ""),
            "Cognom1": row.get("Cognom1", ""),
            "Cognom2": row.get("Cognom2", ""),
        }
        noms = [record["Nom"].strip(), record["Cognom1"].strip(), record["Cognom2"].strip()]
        nom_complet = " ".join(n for n in noms if n)
        record["NomComplet"] = nom_complet if nom_complet else record["Jugador"]
        out.append(record)
    return out


def main() -> None:
    if not SHEET_ID:
        print("Falta RANK_ID", file=sys.stderr)
        sys.exit(2)

    url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(SHEET_TAB, safe='')}"
    try:
        data = fetch_json(url, TIMEOUT, RETRIES)
    except Exception as e:
        print(f"Avís: error baixant dades: {e}", file=sys.stderr)
        sys.exit(1)

    rows = normalise_rows(data if isinstance(data, list) else [])
    if write_if_changed(OUTPUT_FILE, rows):
        print(f"Fitxer actualitzat: {OUTPUT_FILE}")
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()

