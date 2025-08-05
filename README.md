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

## Horari

- Dilluns: 9:00 a 21:30
- Dimarts: 10:30 a 21:30
- Dimecres: 9:00 a 21:30
- Dijous: 9:00 a 21:30
- Divendres: 10:30 a 21:30
- Dissabte: 9:00 a 21:30
- Diumenge: 9:00 a 21:30

Agost tancat

Aquests horaris poden patir alteracions en funció dels horaris d'obertura del bar del Foment.

## Enllaços d'interès

- [Foment Martinenc](https://www.fomentmartinenc.org/)
