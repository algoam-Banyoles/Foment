#!/usr/bin/env python3
"""Sync Google Sheet tabs to JSON files using OpenSheet."""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Iterable, List

BASE = "https://opensheet.elk.sh"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SheetSync/1.1; +https://github.com/<repo>)",
    "Accept": "application/json",
}

FILENAME_MAP = {
    "1": "modalitat.json", "modalitat": "modalitat.json",
    "2": "inscrits.json", "inscrits": "inscrits.json",
    "3": "partides.json", "partides": "partides.json",
    "4": "classificacio.json", "classificacio": "classificacio.json",
    "5": "calendari.json", "calendari": "calendari.json",
}


def slugify(text: str) -> str:
    """Return ASCII slug of text."""
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if ch.isalnum()).lower()


def canonical_filename(tab: str) -> str:
    """Map sheet tab to final file name."""
    key = slugify(tab)
    return FILENAME_MAP.get(key, f"{key}.json")


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


def discover_tabs(sheet_id: str, fallback: Iterable[str], timeout: int, retries: int) -> List[str]:
    """Discover tabs via /worksheets or return fallback."""
    url = f"{BASE}/{sheet_id}/worksheets"
    try:
        data = fetch_json(url, timeout, retries)
        if isinstance(data, list):
            if data and isinstance(data[0], dict) and "title" in data[0]:
                return [d["title"] for d in data]
            if data and isinstance(data[0], str):
                return data
    except Exception:
        pass
    return list(fallback)


def force_ipv4() -> None:
    import socket

    orig = socket.getaddrinfo

    def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
        return orig(host, port, socket.AF_INET, type, proto, flags)

    socket.getaddrinfo = getaddrinfo_ipv4  # type: ignore[assignment]


def main() -> None:
    sheet_id = os.getenv("SHEET_ID", "").strip()
    if not sheet_id:
        print("Falta SHEET_ID", file=sys.stderr)
        sys.exit(2)

    tabs_env = os.getenv("SHEET_TABS", "1,2,3,4,5")
    configured = [t.strip() for t in tabs_env.split(",") if t.strip()]
    output_dir = os.getenv("OUTPUT_DIR", "data")
    timeout = int(os.getenv("HTTP_TIMEOUT", "30"))
    retries = int(os.getenv("HTTP_RETRIES", "5"))
    if os.getenv("FORCE_IPV4", "0") == "1":
        force_ipv4()

    tabs = discover_tabs(sheet_id, configured, timeout, retries)
    updated: List[str] = []
    for tab in tabs:
        url = f"{BASE}/{sheet_id}/{urllib.parse.quote(tab, safe='')}"
        try:
            data = fetch_json(url, timeout, retries)
        except Exception as e:
            print(f"Avís: error baixant '{tab}': {e}", file=sys.stderr)
            continue
        filename = canonical_filename(tab)
        if write_if_changed(pathlib.Path(output_dir) / filename, data):
            updated.append(filename)

    if updated:
        print("Fitxers actualitzats:", ", ".join(updated))
    else:
        print("Sense canvis.")


if __name__ == "__main__":
    main()
