# Campionat Continu 3B

Sistema de gestió de reptes de billar amb FastAPI i PWA.

## Instal·lació

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

El token d'administració es configura a `app/config.py` (`secret` per defecte). Les peticions POST han d'incloure l'header `X-Admin-Token`.

La PWA es pot servir amb qualsevol servidor estàtic (p.ex. GitHub Pages). Per desenvolupament:

```bash
python -m http.server --directory frontend 8001
```
Configura `API_BASE` del frontend perquè apunti a `http://localhost:8000/api`.

## Tests

```bash
pytest
```
