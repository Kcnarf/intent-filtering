from pydantic import BaseModel, ConfigDict, model_validator


class FilterParams(BaseModel):
    genre: str | None = None
    year_min: int | None = None
    year_max: int | None = None
    rating_min: float | None = None
    votes_min: int | None = None
    limit: int = 50
    offset: int = 0

    @model_validator(mode="after")
    def check_year_range(self) -> "FilterParams":
        if self.year_min is not None and self.year_max is not None:
            if self.year_min > self.year_max:
                raise ValueError("year_min must not exceed year_max")
        return self


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
