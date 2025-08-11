# Foment
Aplicació per visualitzar el rànquing de billar.

## Com executar

```bash
python3 server.py
```

Aquesta ordre arrenca un petit servidor web a `http://localhost:8000`.
La informació de rànquing i classificacions s'ha d'actualitzar
externament mitjançant una aplicació d'escriptori. De la mateixa manera,
els esdeveniments es sincronitzen d'un Google Sheet públic executant:

```bash
AGENDA_ID=1IkA50UI7OpFd_VYUb5kNe9V0jj-MZKqu python3 tools/update_events.py
```

### Actualitzar la versió del service worker

Abans de fer un build o desplegar, cal actualitzar la versió del
service worker per garantir que els canvis es propaguin als clients.

```bash
python3 tools/update_sw_version.py
```

## Normativa i Horari

### Horari d'obertura de la Secció

- Dilluns, dimecres, dijous, dissabte i diumenge: 9:00 – 21:30
- Dimarts i divendres: 10:30 – 21:30
- L'horari d'obertura pot canviar en funció dels horaris d'obertura del **Bar del Foment**.
- L'horari del **Foment** és de **DILLUNS A DIVENDRES de 9:00 a 13:00 i de 16:00 a 20:00**. **AGOST I FESTIUS TANCAT.**
- **La secció romandrà tancada els dies de tancament del FOMENT.**

### ✅ OBLIGATORI

- Netejar el billar i les boles abans de començar cada partida amb el material que la Secció posa a disposició de tots els socis.

### 🚫 PROHIBIT


- Jugar a fantasia.
- Menjar mentre s'està jugant.
- Posar begudes sobre cap element del billar.

### Inscripció a les partides

- Apunta’t a la pissarra única de **PARTIDES SOCIALS**.
- Els companys no cal que s’apuntin; si ho fan, que sigui al costat del primer jugador.

### Assignació de taula

- Quan hi hagi una taula lliure, ratlla el teu nom i juga.
- Si vols una taula concreta ocupada, **passa el torn** fins que s’alliberi.

### Temps de joc

- Màxim **1 hora** per partida (sol o en grup).
- **PROHIBIT** posar monedes per allargar el temps, encara que hi hagi taules lliures.

### Tornar a jugar

- Només pots repetir si **no hi ha ningú apuntat** i hi ha una taula lliure.

## Enllaços

- [Foment Martinenc](https://www.fomentmartinenc.org/)

## Sync sheet data

This repo mirrors a public Google Sheet to JSON files.

1. Add secret `SHEET_ID` in **Settings → Secrets and variables → Actions**.
2. The workflow fetches tabs `1,2,3,4,5` into `data/`.
3. Test locally:
```bash
SHEET_ID=... SHEET_TABS=1,2,3,4,5 OUTPUT_DIR=data python3 tools/update_sheets.py
```
Notes: the sheet must be public and OpenSheet caches ~30 s.
The script already uses a friendly User-Agent to avoid most 403 errors.
Set `FORCE_IPV4=1` if your network only allows IPv4.

### Optional caching proxy

To avoid rate limits from `opensheet.elk.sh`, you can deploy the
[`opensheet-worker.js`](./opensheet-worker.js) on Cloudflare Workers (or
similar) which proxies requests and caches them for an hour. Point the
tools to this worker by setting `OPENSHEET_BASE`:

```bash
OPENSHEET_BASE=https://your-worker.example.com SHEET_ID=... python3 tools/update_sheets.py
```

The same environment variable also works with `update_enllacos.py`.
