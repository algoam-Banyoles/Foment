#!/usr/bin/env python3
"""Sync events from a Google Sheet to ``data/events.json``.

Fetches data via the OpenSheet service and writes the resulting JSON file
only when content changes. Mitjana fields, if present, are normalised to
dot-based decimals. Inspired by ``update_sheets.py``.

Required environment variables:
    AGENDA_ID – Google Sheet identifier.

Optional environment variables:
    AGENDA_TAB      – sheet tab name or index (default: "1")
    OUTPUT_FILE     – path of the JSON file (default: "data/events.json")
    HTTP_TIMEOUT    – request timeout in seconds (default: 30)
    HTTP_RETRIES    – number of fetch retries (default: 5)
    FORCE_IPV4      – set to "1" to force IPv4 DNS resolution
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
from datetime import datetime, timedelta
from typing import Any

# Disable proxies unless explicitly re-enabled
if os.getenv("DISABLE_PROXY", "1") != "0":
    for key in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY"):
        os.environ.pop(key, None)

# Allow overriding the OpenSheet endpoint, e.g. via a caching worker
BASE = os.getenv("OPENSHEET_BASE", "https://opensheet.elk.sh").rstrip("/")

# Sheet configuration
SHEET_ID = os.getenv("AGENDA_ID", "").strip()
SHEET_TAB = (os.getenv("AGENDA_TAB") or "1").strip() or "1"

# Output and HTTP settings
OUTPUT_FILE = pathlib.Path(os.getenv("OUTPUT_FILE", "data/events.json"))
TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
MAX_RETRIES = int(os.getenv("HTTP_RETRIES", "5"))

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EventSync/1.0; +https://github.com/<repo>)",
    "Accept": "application/json",
}
MITJANA_RE = re.compile(r"^\d+(\.\d+)?$")


def force_ipv4() -> None:
    import socket

    orig = socket.getaddrinfo

    def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
        return orig(host, port, socket.AF_INET, type, proto, flags)

    socket.getaddrinfo = getaddrinfo_ipv4  # type: ignore[assignment]


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
    content = json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2).encode(
        "utf-8"
    )
    new_hash = hashlib.sha256(content).digest()
    try:
        old_hash = hashlib.sha256(path.read_bytes()).digest()
        if new_hash == old_hash:
            return False
    except FileNotFoundError:
        pass
    path.write_bytes(content)
    return True


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


def to_iso_date(value: str) -> str:
    """Convert a cell value to ISO date string."""
    value = value.strip()
    if not value:
        return ""
    # Try numeric Excel serial first
    try:
        days = float(value)
        date = datetime(1899, 12, 30) + timedelta(days=days)
        return date.strftime("%Y-%m-%d")
    except ValueError:
        pass
    # Try dd/mm/yyyy format
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            date = datetime.strptime(value, fmt)
            return date.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return value


def main() -> None:
    if not SHEET_ID:
        print("Falta AGENDA_ID", file=sys.stderr)
        sys.exit(2)

    if os.getenv("FORCE_IPV4", "0") == "1":
        force_ipv4()

    url = f"{BASE}/{SHEET_ID}/{urllib.parse.quote(SHEET_TAB, safe='')}"
    try:
        data = fetch_json(url, TIMEOUT, MAX_RETRIES)
    except Exception as e:
        print(f"Avís: error baixant dades: {e}", file=sys.stderr)
        sys.exit(1)

    rows: list[dict[str, Any]] = []
    if isinstance(data, list):
        for entry in data:
            if isinstance(entry, dict):
                row = dict(entry)
                if "Data" in row:
                    row["Data"] = to_iso_date(str(row.get("Data", "")))
                # Normalise optional ``Tipus`` column (Previsió/Confirmat)
                key = None
                if "Tipus" in row:
                    key = "Tipus"
                elif "tipus" in row:
                    key = "tipus"
                if key:
                    val = str(row.get(key, "")).strip().lower()
                    if val.startswith("previs"):
                        row["Tipus"] = "Previsió"
                    elif val.startswith("confirm"):
                        row["Tipus"] = "Confirmat"
                    else:
                        row["Tipus"] = ""
                    if key != "Tipus":
                        row.pop(key, None)
                rows.append(row)
    normalise_mitjana_fields(rows if rows else data)
    if write_if_changed(OUTPUT_FILE, rows if rows else data):
        print(f"Fitxer actualitzat: {OUTPUT_FILE}")
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()

