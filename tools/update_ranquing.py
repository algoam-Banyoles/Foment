import zipfile
import xml.etree.ElementTree as ET
import json
from pathlib import Path

XLSX_FILE = Path('Ranquing.xlsx')
JSON_FILE = Path('ranquing.json')

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
            continue  # header
        cells = {c.get('r')[0]: c for c in row.findall('a:c', NS)}
        record = {
            'Any': cell_value(cells.get('A', ET.Element('c')), strings),
            'Modalitat': cell_value(cells.get('B', ET.Element('c')), strings),
            'Posició': cell_value(cells.get('C', ET.Element('c')), strings),
            'Jugador': cell_value(cells.get('D', ET.Element('c')), strings),
            'Mitjana': cell_value(cells.get('E', ET.Element('c')), strings),
            'Soci': cell_value(cells.get('F', ET.Element('c')), strings),
            'Nom': cell_value(cells.get('G', ET.Element('c')), strings),
            'Cognom1': cell_value(cells.get('H', ET.Element('c')), strings),
            'Cognom2': cell_value(cells.get('I', ET.Element('c')), strings),
        }
        noms = [record.get('Nom', '').strip(),
                record.get('Cognom1', '').strip(),
                record.get('Cognom2', '').strip()]
        nom_complet = ' '.join([n for n in noms if n])
        record['NomComplet'] = nom_complet if nom_complet else record['Jugador']
        rows.append(record)
    JSON_FILE.write_text(json.dumps(rows, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    update()
