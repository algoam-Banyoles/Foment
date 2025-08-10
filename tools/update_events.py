import zipfile
import xml.etree.ElementTree as ET
import json
from pathlib import Path
from datetime import datetime, timedelta

# Input Excel file with events. The date column uses dd/mm/aaaa format,
# but Excel stores it as a numeric serial. Use the exact file name.
XLSX_FILE = Path('Agenda.xlsx')
JSON_FILE = Path('events.json')

NS = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def load_shared_strings(z):
    data = z.read('xl/sharedStrings.xml')
    tree = ET.fromstring(data)
    strings = []
    for t in tree.findall('.//a:t', NS):
        strings.append(t.text or '')
    return strings

def cell_value(cell, strings):
    v = cell.find('a:v', NS)
    if v is None:
        return ''
    val = v.text or ''
    if cell.get('t') == 's':
        idx = int(val)
        return strings[idx]
    return val


def to_iso_date(value: str) -> str:
    """Convert an Excel cell value to ISO date string."""
    value = value.strip()
    if not value:
        return ''
    # Try numeric Excel serial first
    try:
        days = float(value)
        # Excel's day zero is 1899-12-30
        date = datetime(1899, 12, 30) + timedelta(days=days)
        return date.strftime('%Y-%m-%d')
    except ValueError:
        pass
    # Try dd/mm/yyyy format
    try:
        date = datetime.strptime(value, '%d/%m/%Y')
        return date.strftime('%Y-%m-%d')
    except ValueError:
        return value

def update():
    with zipfile.ZipFile(XLSX_FILE) as z:
        strings = load_shared_strings(z)
        sheet_xml = z.read('xl/worksheets/sheet1.xml')
    sheet = ET.fromstring(sheet_xml)
    sheet_data = sheet.find('a:sheetData', NS)
    rows = []
    for row in sheet_data.findall('a:row', NS):
        r_index = int(row.get('r'))
        if r_index == 1:
            continue  # header row
        cells = {c.get('r')[0]: c for c in row.findall('a:c', NS)}
        raw_date = cell_value(cells.get('A', ET.Element('c')), strings)
        record = {
            'Data': to_iso_date(raw_date),
            'Hora': cell_value(cells.get('B', ET.Element('c')), strings),
            'Títol': cell_value(cells.get('C', ET.Element('c')), strings),
        }
        # ignore completely empty rows
        if any(record.values()):
            rows.append(record)
    JSON_FILE.write_text(json.dumps(rows, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    update()
