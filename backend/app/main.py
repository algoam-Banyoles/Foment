from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import public, challenges, admin, params
from .db import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Campionat Continu 3B")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,allow_headers=["*"]
)

app.include_router(public.router)
app.include_router(challenges.router)
app.include_router(admin.router)
app.include_router(params.router)
