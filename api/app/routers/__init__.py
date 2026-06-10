from sqlalchemy import Select

from ..models import Movie
from ..schemas import FilterParams


def apply_filters(query: Select, params: FilterParams) -> Select:
    if params.genre:
        query = query.where(Movie.genres.like(f"%{params.genre}%"))
    if params.year_min is not None:
        query = query.where(Movie.start_year >= params.year_min)
    if params.year_max is not None:
        query = query.where(Movie.start_year <= params.year_max)
    if params.rating_min is not None:
        query = query.where(Movie.average_rating >= params.rating_min)
    if params.votes_min is not None:
        query = query.where(Movie.num_votes >= params.votes_min)
    return query
