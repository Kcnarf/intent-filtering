from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Movie
from ..schemas import FilterParams, MovieOut
from . import apply_filters

router = APIRouter()


@router.get("/movies", response_model=list[MovieOut])
async def get_movies(
    params: Annotated[FilterParams, Depends()],
    db: AsyncSession = Depends(get_db),
):
    query = apply_filters(select(Movie), params)
    query = query.order_by(Movie.average_rating.desc()).limit(params.limit).offset(params.offset)
    result = await db.execute(query)
    return result.scalars().all()
