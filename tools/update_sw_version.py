#!/usr/bin/env python3
"""Update the service worker cache version automatically.

The version is derived from the contents of the files listed in the
`precacheAndRoute` section of ``service-worker.js``. Any change to these
files will therefore result in a new cache version without having to
manually bump a constant.
"""

import hashlib
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SW_PATH = ROOT / "service-worker.js"


def _local_precached_files(content: str) -> list[Path]:
    """Return Paths for all local files precached by the service worker."""
    files: list[Path] = []
    for url in re.findall(r"{\s*url:\s*'([^']+)'", content):
        # Skip external URLs.
        if "://" in url:
            continue
        path = ROOT / url.lstrip("./")
        if path.exists():
            files.append(path)
    return files


def _compute_version(files: list[Path]) -> str:
    """Return a short SHA256 hash for the given files."""
    digest = hashlib.sha256()
    for file in files:
        digest.update(file.read_bytes())
    return digest.hexdigest()[:12]


def main() -> None:
    content = SW_PATH.read_text()
    files = _local_precached_files(content)
    if not files:
        raise SystemExit("No precached files found to hash")

    version = _compute_version(files)
    new_content, count = re.subn(
        r"const CACHE_VERSION = '.*';",
        f"const CACHE_VERSION = '{version}';",
        content,
    )
    if count == 0:
        raise SystemExit("CACHE_VERSION not found in service-worker.js")
    SW_PATH.write_text(new_content)
    print(f"Updated service worker version to {version}")


if __name__ == "__main__":
    main()
