from pydantic import BaseModel, ConfigDict


class FilterParams(BaseModel):
    genre: str | None = None
    year_min: int | None = None
    year_max: int | None = None
    rating_min: float | None = None
    votes_min: int | None = None
    limit: int = 50
    offset: int = 0


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
