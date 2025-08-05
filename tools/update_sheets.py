#!/usr/bin/env python3
"""
Sync de pestanyes d’un Google Sheet públic a JSON via OpenSheet.

Cal definir en el runner una variable/secret:
  • SHEET_ID  – ID del full (obligatori)

Variables d’entorn opcionals:
  • SHEET_TABS    – pestanyes coma-separades o índexs (1,2,3,4)
  • OUTPUT_DIR    – carpeta per escriure els .json (defecte “public/data”)
  • HTTP_TIMEOUT  – timeout per petició (30)
  • HTTP_RETRIES  – intents amb back-off (5)
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
from typing import List

# ─── CONFIG ────────────────────────────────────────────────────────────────────
SHEET_ID = os.getenv("SHEET_ID", "").strip()   # ← cap valor per defecte

SHEET_TABS = [t.strip() for t in os.getenv("SHEET_TABS", "").split(",") if t.strip()]

OUTPUT_DIR   = os.getenv("OUTPUT_DIR", "public/data")
BASE         = "https://opensheet.elk.sh"
TIMEOUT      = int(os.getenv("HTTP_TIMEOUT", "30"))
MAX_RETRIES  = int(os.getenv("HTTP_RETRIES", "5"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SheetSync/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}

FILENAME_MAP = {
    "1": "inscrits", "inscrits": "inscrits",
    "2": "partides", "partides": "partides",
    "3": "classificacio", "classificació": "classificacio",
    "4": "calendari", "calendari": "calendari",
}
# ───────────────────────────────────────────────────────────────────────────────


def slugify(name: str) -> str:
    trans = str.maketrans("àèéíòóúü", "aeeioouu")
    name = name.strip().lower().translate(trans)
    name = re.sub(r"[^\w\s-]", "", name)
    return re.sub(r"[\s-]+", "-", name).strip("-") or "sheet"


def fetch_json(url: str, tries: int = MAX_RETRIES, timeout: int = TIMEOUT):
    last_err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                charset = r.headers.get_content_charset() or "utf-8"
                return json.loads(r.read().decode(charset))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            last_err = e
            if isinstance(e, urllib.error.HTTPError) and e.code == 403:
                break
            time.sleep(2**i)
    raise RuntimeError(f"Failed to GET {url}: {last_err}") from last_err


def write_if_changed(path: pathlib.Path, data_obj) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    new_bytes = json.dumps(data_obj, ensure_ascii=False, sort_keys=True).encode("utf-8")
    if path.exists() and hashlib.sha256(path.read_bytes()).digest() == hashlib.sha256(
        new_bytes
    ).digest():
        return False
    path.write_bytes(new_bytes)
    return True


def discover_tabs(sheet_id: str) -> List[str]:
    url = f"{BASE}/{sheet_id}/worksheets"
    try:
        data = fetch_json(url)
        if isinstance(data, list):
            if data and isinstance(data[0], dict) and "title" in data[0]:
                return [d["title"] for d in data]
            if data and isinstance(data[0], str):
                return data
    except Exception:
        pass
    return []


def canonical_filename(tab: str) -> str:
    key = slugify(tab)
    return FILENAME_MAP.get(key, FILENAME_MAP.get(tab, key))


def main() -> None:
    if not SHEET_ID:
        print(
            "ERROR: variable d’entorn SHEET_ID no definida. "
            "Afegeix-la als Secrets & Variables → Actions.",
            file=sys.stderr,
        )
        sys.exit(2)

    tabs: List[str] = SHEET_TABS or discover_tabs(SHEET_ID)
    if not tabs:
        print("ERROR: no s’han obtingut pestanyes (SHEET_TABS buit).", file=sys.stderr)
        sys.exit(3)

    changed: List[str] = []
    for tab in tabs:
        url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(tab, safe='')}"
        try:
            payload = fetch_json(url)
        except Exception as e:
            print(f"Avís: error baixant '{tab}': {e}", file=sys.stderr)
            continue

        outpath = pathlib.Path(OUTPUT_DIR) / f"{canonical_filename(tab)}.json"
        if write_if_changed(outpath, payload):
            changed.append(str(outpath))

    if changed:
        print("Fitxers actualitzats:")
        for p in changed:
            print(" •", p)
    else:
        print("Sense canvis.")
    sys.exit(0)


if __name__ == "__main__":
    main()
