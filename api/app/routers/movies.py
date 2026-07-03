from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Movie
from ..schemas import FilterParams, MovieOut, SortDirection, SortField
from . import apply_filters

router = APIRouter()

SORT_COLUMN_MAP = {
    SortField.average_rating: Movie.average_rating,
    SortField.num_votes: Movie.num_votes,
    SortField.start_year: Movie.start_year,
}


@router.get("/movies", response_model=list[MovieOut])
async def get_movies(
    params: Annotated[FilterParams, Depends()],
    db: AsyncSession = Depends(get_db),
):
    sort_column = SORT_COLUMN_MAP[params.sort_by]
    order_expr = sort_column.asc() if params.sort_direction == SortDirection.asc else sort_column.desc()
    query = apply_filters(select(Movie), params)
    query = query.order_by(order_expr).limit(params.limit).offset(params.offset)
    result = await db.execute(query)
    return result.scalars().all()
