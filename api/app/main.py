import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .config import settings
from .database import create_tables
from . import models  # noqa: F401 — registers ORM models with Base.metadata
from .routers.movies import router as movies_router
from .routers.movies_stat import router as movies_stat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(title="intent-filtering API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(movies_router, prefix="/api")
app.include_router(movies_stat_router, prefix="/api")


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    # exc.errors() ctx values may contain non-serializable Python exceptions;
    # use Pydantic's own JSON encoder then parse back to get a safe dict.
    return JSONResponse(status_code=422, content={"detail": json.loads(exc.json())})


@app.get("/health")
async def health():
    return {"status": "ok"}
