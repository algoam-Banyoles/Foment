# Foment
Aplicació per visualitzar el rànquing de billar.

## Com executar

```bash
python3 server.py
```

Aquesta ordre arrenca un petit servidor web a `http://localhost:8000`.
La informació de rànquing i classificacions s'ha d'actualitzar
externament mitjançant una aplicació d'escriptori. De la mateixa manera,
els esdeveniments s'obtenen de `Agenda.xlsx` executant:

```bash
python3 update_events.py
```
