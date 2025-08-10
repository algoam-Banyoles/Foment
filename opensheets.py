"""Utility to download Google Sheets as XLSX via file IDs.
"""
from __future__ import annotations

import os
from io import BytesIO
from zipfile import ZipFile

import requests

BASE_URL = "https://docs.google.com/spreadsheets/d/{id}/export?format=xlsx"


def open_sheet(sheet_id: str) -> ZipFile:
    """Return a ZipFile for the given Google Sheet ID."""
    url = BASE_URL.format(id=sheet_id)
    resp = requests.get(url)
    resp.raise_for_status()
    return ZipFile(BytesIO(resp.content))


def open_sheet_from_env(var_name: str) -> ZipFile:
    """Open a Google Sheet using an environment variable that stores its ID."""
    sheet_id = os.environ[var_name]
    return open_sheet(sheet_id)
