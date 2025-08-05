#!/usr/bin/env python3
from datetime import datetime, timezone
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SW_PATH = ROOT / 'service-worker.js'


def main():
    ts = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
    content = SW_PATH.read_text()
    new_content, count = re.subn(r"const CACHE_VERSION = '.*';",
                                 f"const CACHE_VERSION = '{ts}';",
                                 content)
    if count == 0:
        raise SystemExit('CACHE_VERSION not found in service-worker.js')
    SW_PATH.write_text(new_content)
    print(f'Updated service worker version to {ts}')


if __name__ == '__main__':
    main()
