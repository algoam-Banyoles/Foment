#!/usr/bin/env python3
"""Sync Continu3B sheet tabs to JSON files.

Fetches up to eight tabs from the Google Sheet identified by
``CONTINU_ID`` using the OpenSheet service.  Each tab is written to a JSON
file named ``continu3b_<tab>.json`` inside the ``data`` directory.  Fields
named ``Mitjana`` are normalised to dot-based decimals, and files are only
updated when content changes.

Inspired by ``tools/update_sheets.py``.
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, List

BASE = os.getenv("OPENSHEET_BASE", "https://opensheet.elk.sh").rstrip("/")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Continu3B/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}
MITJANA_RE = re.compile(r"^\d+(\.\d+)?$")
TABS = [
    "Paràmetres",
    "Jugadors",
    "RankingActiu",
    "Reptes",
    "LlistaEspera",
    "Partides",
    "Historic",
    "Auditoria",
]


def slugify(text: str) -> str:
    """Return ASCII slug of text."""
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if ch.isalnum()).lower()


def normalise_mitjana_fields(obj: Any) -> None:
    """Normalise ``Mitjana`` keys to dot-based decimals."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if "Mitjana" in k:
                mitjana = str(v).replace(",", ".")
                if mitjana:
                    try:
                        mitjana = str(float(mitjana))
                    except ValueError:
                        pass
                if mitjana and not MITJANA_RE.match(mitjana):
                    raise AssertionError("Mitjana format error")
                obj[k] = mitjana
            else:
                normalise_mitjana_fields(v)
    elif isinstance(obj, list):
        for item in obj:
            normalise_mitjana_fields(item)


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


def main() -> None:
    sheet_id = os.getenv("CONTINU_ID", "").strip()
    if not sheet_id:
        print("Falta CONTINU_ID", file=sys.stderr)
        sys.exit(2)

    output_dir = pathlib.Path(os.getenv("OUTPUT_DIR", "data"))
    timeout = int(os.getenv("HTTP_TIMEOUT", "30"))
    retries = int(os.getenv("HTTP_RETRIES", "5"))

    updated: List[str] = []
    for tab in TABS:
        url = f"{BASE}/{sheet_id}/{urllib.parse.quote(tab, safe='')}"
        try:
            data = fetch_json(url, timeout, retries)
        except Exception as e:
            print(f"Avís: error baixant '{tab}': {e}", file=sys.stderr)
            continue
        normalise_mitjana_fields(data)
        filename = output_dir / f"continu3b_{slugify(tab)}.json"
        if write_if_changed(filename, data):
            updated.append(filename.name)

    if updated:
        print("Fitxers actualitzats:", ", ".join(updated))
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()
