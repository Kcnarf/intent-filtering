from enum import Enum
from typing import Annotated

from fastapi import HTTPException, Query
from pydantic import BaseModel, ConfigDict


class SortField(str, Enum):
    average_rating = "average_rating"
    num_votes = "num_votes"
    start_year = "start_year"


class SortDirection(str, Enum):
    asc = "asc"
    desc = "desc"


class FilterParamsBody(BaseModel):
    genres_or: list[str] = []
    genres_and: list[str] = []
    year_min: int | None = None
    year_max: int | None = None
    rating_min: float | None = None
    votes_min: int | None = None


class IntentOut(BaseModel):
    filters: FilterParamsBody
    message: str | None = None


class FilterParams:
    def __init__(
        self,
        genres_or: Annotated[list[str], Query()] = [],  # noqa: B006
        genres_and: Annotated[list[str], Query()] = [],  # noqa: B006
        year_min: int | None = None,
        year_max: int | None = None,
        rating_min: float | None = None,
        votes_min: int | None = None,
        limit: int = 50,
        offset: int = 0,
        sort_by: Annotated[SortField, Query()] = SortField.average_rating,
        sort_direction: Annotated[SortDirection, Query()] = SortDirection.desc,
    ):
        if year_min is not None and year_max is not None and year_min > year_max:
            raise HTTPException(status_code=422, detail="year_min must not exceed year_max")
        self.genres_or = genres_or
        self.genres_and = genres_and
        self.year_min = year_min
        self.year_max = year_max
        self.rating_min = rating_min
        self.votes_min = votes_min
        self.limit = limit
        self.offset = offset
        self.sort_by = sort_by
        self.sort_direction = sort_direction


class MovieOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    primary_title: str
    original_title: str
    start_year: int | None
    runtime_minutes: int | None
    genres: str | None
    average_rating: float | None
    num_votes: int | None


class RatingBucketOut(BaseModel):
    label: str
    count: int


class MoviesStatOut(BaseModel):
    total_count: int
    average_rating: float | None
    total_votes: int | None
    rating_distribution: list[RatingBucketOut]
