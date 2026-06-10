from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Movie
from ..schemas import FilterParams, MoviesStatOut, RatingBucketOut
from . import apply_filters

router = APIRouter()


@router.get("/movies/stat", response_model=MoviesStatOut)
async def get_movies_stat(
    params: Annotated[FilterParams, Depends()],
    db: AsyncSession = Depends(get_db),
):
    totals = apply_filters(
        select(func.count(), func.avg(Movie.average_rating), func.sum(Movie.num_votes)),
        params,
    )
    total_count, avg_rating, total_votes = (await db.execute(totals)).one()

    bucket = cast(Movie.average_rating, Integer)
    dist = apply_filters(select(bucket, func.count()).group_by(bucket), params)
    rows = (await db.execute(dist)).all()
    bucket_map = {r[0]: r[1] for r in rows if r[0] is not None}
    rating_distribution = [
        RatingBucketOut(label=f"{i}-{i+1}", count=bucket_map.get(i, 0))
        for i in range(1, 10)
    ]

    return MoviesStatOut(
        total_count=total_count or 0,
        average_rating=avg_rating,
        total_votes=total_votes,
        rating_distribution=rating_distribution,
    )
