#!/usr/bin/env python3
import os, sys, json, time, hashlib, urllib.request, urllib.error, pathlib, re

SHEET_ID   = "1Dc01H5hAxPwwhyY_GnRAVFP2-uINanwJS1jhtFs2syU"
SHEET_TABS = [t.strip() for t in os.environ.get("SHEET_TABS", "").split(",") if t.strip()]
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "public/data")

BASE = "https://opensheet.elk.sh"

def slugify(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s-]+", "-", name).strip("-")
    return name or "sheet"

def fetch_json(url: str, tries: int = 5, timeout: int = 30):
    last_err = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            last_err = e
            # backoff exponencial: 1s, 2s, 4s, ...
            time.sleep(2 ** i)
    raise RuntimeError(f"Failed to GET {url}: {last_err}")

def write_if_changed(path: pathlib.Path, data_obj) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    new_bytes = json.dumps(data_obj, ensure_ascii=False, sort_keys=True).encode("utf-8")
    if path.exists():
        old = path.read_bytes()
        if hashlib.sha256(old).hexdigest() == hashlib.sha256(new_bytes).hexdigest():
            return False
    path.write_bytes(new_bytes)
    return True

def discover_tabs(sheet_id: str):
    # OpenSheet sol exposar /{sheet_id}/worksheets amb la llista de pestanyes.
    # Si no està disponible, caldrà passar SHEET_TABS manualment.
    url = f"{BASE}/{sheet_id}/worksheets"
    try:
        data = fetch_json(url)
        # Admet tant una llista de dicts amb 'title' com una llista de cadenes
        if isinstance(data, list):
            if data and isinstance(data[0], dict) and "title" in data[0]:
                return [d["title"] for d in data]
            elif data and isinstance(data[0], str):
                return data
        return []
    except Exception:
        return []

def main():
    if not SHEET_ID:
        print("ERROR: cal definir SHEET_ID (ID del Google Sheet) via secrets o env.", file=sys.stderr)
        sys.exit(2)

    tabs = SHEET_TABS[] or discover_tabs(SHEET_ID)
    if not tabs:
        print("ERROR: no s’han pogut obtenir les pestanyes. Defineix SHEET_TABS (coma-separat).", file=sys.stderr)
        sys.exit(3)

    changed = []
    for tab in tabs:
        url = f"{BASE}/1Dc01H5hAxPwwhyY_GnRAVFP2-uINanwJS1jhtFs2syU/{urllib.parse.quote(tab)}"
        try:
            payload = fetch_json(url)
        except Exception as e:
            print(f"Avís: no s’ha pogut descarregar '{tab}' {e}", file=sys.stderr)
            continue

        filename = f"{slugify(tab)}.json"
        outpath = pathlib.Path(OUTPUT_DIR) / filename
        if write_if_changed(outpath, payload):
            changed.append(str(outpath))

    if changed:
        print("Fitxers actualitzats:")
        for p in changed: print(" •", p)
        sys.exit(0)
    else:
        print("Sense canvis.")
        sys.exit(0)

if __name__ == "__main__":
    main()
