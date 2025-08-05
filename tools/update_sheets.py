#!/usr/bin/env python3
"""
Sync de pestanyes d’un Google Sheet públic a fitxers JSON via OpenSheet.

Variables d’entorn (totes opcionals):
  • SHEET_ID      – ID del full (per defecte l’exemple que veus a sota)
  • SHEET_TABS    – pestanyes coma-separades (si no es defineix, es fa autodiscovery)
  • OUTPUT_DIR    – carpeta on escriure els .json (per defecte “public/data”)
  • HTTP_TIMEOUT  – timeout en segons per petició (30)
  • HTTP_RETRIES  – intents màxims amb back-off exponencial (5)
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
SHEET_ID = os.getenv(
    "SHEET_ID",
    "1Dc01H5hAxPwwhyY_GnRAVFP2-uINanwJS1jhtFs2syU",  # • posa'l buit per forçar que vingui d'env
).strip()

SHEET_TABS = [
    t.strip() for t in os.getenv("SHEET_TABS", "").split(",") if t.strip()
]  # → ['inscrits', 'partides', ...]

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "public/data")

BASE = "https://opensheet.elk.sh"

TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
MAX_RETRIES = int(os.getenv("HTTP_RETRIES", "5"))

HEADERS = {
    # Cloudflare acostuma a bloquejar User-Agents “urllib/3.x”.
    # Fem-nos passar per un navegador, i afegim el nostre “product” per cortesia.
    "User-Agent": "Mozilla/5.0 (compatible; SheetSync/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}
# ───────────────────────────────────────────────────────────────────────────────


def slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s-]+", "-", name).strip("-")
    return name or "sheet"


def fetch_json(url: str, tries: int = MAX_RETRIES, timeout: int = TIMEOUT):
    """GET amb capçaleres personalitzades, back-off exponencial i parseig JSON."""
    last_err = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                charset = resp.headers.get_content_charset() or "utf-8"
                return json.loads(resp.read().decode(charset))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            # Si és 403 és probable que sigui un bloqueig definitiu → no insistim gaire
            last_err = e
            if isinstance(e, urllib.error.HTTPError) and e.code == 403:
                break
            time.sleep(2 ** i)  # 1 s, 2 s, 4 s…
    raise RuntimeError(f"Failed to GET {url}: {last_err}") from last_err


def write_if_changed(path: pathlib.Path, data_obj) -> bool:
    """Només escriu el fitxer si el contingut ha canviat (hash SHA-256)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    new_bytes = json.dumps(data_obj, ensure_ascii=False, sort_keys=True).encode("utf-8")
    if path.exists() and hashlib.sha256(path.read_bytes()).digest() == hashlib.sha256(
        new_bytes
    ).digest():
        return False
    path.write_bytes(new_bytes)
    return True


def discover_tabs(sheet_id: str) -> List[str]:
    """Intenta descobrir les pestanyes via /worksheets d’OpenSheet."""
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


def main() -> None:
    if not SHEET_ID:
        print("ERROR: cal definir SHEET_ID via env.", file=sys.stderr)
        sys.exit(2)

    tabs: List[str] = SHEET_TABS or discover_tabs(SHEET_ID)

    if not tabs:
        print(
            "ERROR: no s’han pogut obtenir pestanyes. Defineix SHEET_TABS.",
            file=sys.stderr,
        )
        sys.exit(3)

    changed: List[str] = []
    for tab in tabs:
        safe_tab = urllib.parse.quote(tab, safe="")  # evita caràcters problemàtics
        url = f"{BASE}/{SHEET_ID}/{safe_tab}"

        try:
            payload = fetch_json(url)
        except Exception as e:
            print(f"Avís: no s’ha pogut descarregar '{tab}': {e}", file=sys.stderr)
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
