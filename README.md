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

Pròximament disponibles els horaris de les activitats.

## Enllaços

- [Foment Martinenc](https://www.fomentmartinenc.org/)
