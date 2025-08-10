# Foment
Aplicació per visualitzar el rànquing de billar.

## Com executar

```bash
python3 server.py
```

Aquesta ordre arrenca un petit servidor web a `http://localhost:8000`.
La informació de rànquing i classificacions s'ha d'actualitzar
externament mitjançant una aplicació d'escriptori. De la mateixa manera,
els esdeveniments s'obtenen de `agenda.xlsx` executant:

```bash
python3 update_events.py
```

### Actualitzar la versió del service worker

Abans de fer un build o desplegar, cal actualitzar la versió del
service worker per garantir que els canvis es propaguin als clients.

```bash
python3 tools/update_sw_version.py
```

## Normativa i Horari

### Horari d'obertura

- Dilluns, dimecres, dijous, dissabte i diumenge: 9:00 – 21:30
- Dimarts i divendres: 10:30 – 21:30

*L’horari pot canviar.*

### ✅ OBLIGATORI

- Netejar el billar i les boles abans de començar cada partida amb el material que la Secció posa a disposició de tots els socis.

### 🚫 Prohibit

- Jugar a fantasia.
- Menjar a les sales.
- Posar begudes sobre cap element del billar.

### Inscripció a les partides

- Apunta’t a la pissarra única de **PARTIDES SOCIALS**.
- Els companys no cal que s’apuntin; si ho fan, que sigui al costat del primer jugador.

### Assignació de taula

- Quan hi hagi una taula lliure, ratlla el teu nom i juga.
- Si vols una taula concreta ocupada, **passa el torn** fins que s’alliberi.

### Temps de joc

- Màxim **1 hora** per partida (sol o en grup).
- **Prohibit** posar monedes per allargar el temps, encara que hi hagi taules lliures.

### Tornar a jugar

- Només pots repetir si **no hi ha ningú apuntat** i hi ha una taula lliure.

## Enllaços

- [Foment Martinenc](https://www.fomentmartinenc.org/)
