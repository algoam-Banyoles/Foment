import json
from datetime import datetime
from pathlib import Path
import gspread

SA_FILENAME = '/tmp/sa.json'
SPREADSHEET_ID = '10HIcmcf5CAqB2OAiKEqb49djG9ysu-1koxvRmrwT-Fk'
WORKSHEET_NAME = 'Agenda'
OUTPUT_FILE = Path('eventa.json')


def update():
    gc = gspread.service_account(filename=SA_FILENAME)
    sh = gc.open_by_key(SPREADSHEET_ID)
    ws = sh.worksheet(WORKSHEET_NAME)
    rows = ws.get_all_values()[1:]
    events = []
    for row in rows:
        if not any(row):
            continue
        date_str = row[0].strip()
        if not date_str:
            continue
        hour = row[1].strip() if len(row) > 1 else ''
        title = row[2].strip() if len(row) > 2 else ''
        date_iso = datetime.strptime(date_str, '%d/%m/%Y').date().isoformat()
        event = {
            'date': date_iso,
            'title': title,
            'allDay': not hour,
        }
        if hour:
            event['time'] = hour
        events.append(event)
    OUTPUT_FILE.write_text(json.dumps(events, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    update()
