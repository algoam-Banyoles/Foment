#!/usr/bin/env python3
"""
Descarrega cada pestanya d’un Google Sheet públic via OpenSheet
i l’escriu en format JSON només si hi ha canvis.

• SHEET_ID      – ID del full (env o edita la constant per defecte)
• SHEET_TABS    – llista coma-separada de pestanyes (opcional)
• OUTPUT_DIR    – carpeta on guardar els .json (per defecte public/data)
"""

import os
import sys
import json
import time
import hashlib
import pathlib
import re
import urllib.request
import urllib.error
import urllib.parse
from typing import List

# ─── CONFIG  ───────────────────────────────────────────────────────────────────
SHEET_ID = os.getenv(
    "SHEET_ID",
    "1Dc01H5hAxPwwhyY_GnRAVFP2-uINanwJS1jhtFs2syU",   # ← posa’l buit si prefereixes obligar-lo per env
).strip()

SHEET_TABS = [
    t.strip() for t in os.environ.get("SHEET_TABS", "").split(",") if t.strip()
]  # → ['inscrits', 'partides', 'classificació']

OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "public/data")

BASE         = "https://opensheet.elk.sh"
TIMEOUT      = int(os.environ.get("HTTP_TIMEOUT", "30"))
MAX_RETRIES  = int(os.environ.get("HTTP_RETRIES", "5"))
# ──────────────────────────────────────────────────────────────────────────────


def slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s-]+", "-", name).strip("-")
    return name or "sheet"


def fetch_json(url: str, tries: int = MAX_RETRIES, timeout: int = TIMEOUT):
    """GET amb back-off exponencial i parsing JSON."""
    last_err = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=timeout) as r:
                charset = r.headers.get_content_charset() or "utf-8"
                return json.loads(r.read().decode(charset))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            last_err = e
            time.sleep(2 ** i)  # 1 s, 2 s, 4 s…
    raise RuntimeError(f"Failed to GET {url}: {last_err}") from last_err


def write_if_changed(path: pathlib.Path, data_obj) -> bool:
    """Només escriu si el contingut canvia (SHA-256)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    new_bytes = json.dumps(
        data_obj, ensure_ascii=False, sort_keys=True
    ).encode("utf-8")
    if path.exists() and hashlib.sha256(path.read_bytes()).digest() == hashlib.sha256(
        new_bytes
    ).digest():
        return False
    path.write_bytes(new_bytes)
    return True


def discover_tabs(sheet_id: str) -> List[str]:
    """Intenta llegir /worksheets per descobrir les pestanyes."""
    url = f"{BASE}/{sheet_id}/worksheets"
    try:
        data = fetch_json(url)
        if isinstance(data, list):
            if data and isinstance(data[0], dict) and "title" in data[0]:
                return [d["title"] for d in data]
            if data and isinstance(data[0], str):
                return data
        return []
    except Exception:
        return []


def main() -> None:
    if not SHEET_ID:
        print("ERROR: cal definir SHEET_ID via env.", file=sys.stderr)
        sys.exit(2)

    # Pestanyes de l’env o autodetectades
    tabs: List[str] = SHEET_TABS or discover_tabs(SHEET_ID)

    if not tabs:
        print(
            "ERROR: no s’han pogut obtenir pestanyes. Defineix SHEET_TABS.",
            file=sys.stderr,
        )
        sys.exit(3)

    changed: List[str] = []
    for tab in tabs:
        safe_tab = urllib.parse.quote(tab, safe="")       # evita “2:” → “2”
        url = f"{BASE}/{SHEET_ID}/{safe_tab}"

        try:
            payload = fetch_json(url)
        except Exception as e:
            print(f"Avís, no s’ha pogut descarregar '{tab}' {e}", file=sys.stderr)
            continue

        outpath = pathlib.Path(OUTPUT_DIR) / f"{slugify(tab)}.json"
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

