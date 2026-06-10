from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Movie(Base):
    __tablename__ = "movies"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    primary_title: Mapped[str] = mapped_column(String, nullable=False)
    original_title: Mapped[str] = mapped_column(String, nullable=False)
    start_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    runtime_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genres: Mapped[str | None] = mapped_column(String, nullable=True)
    average_rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    num_votes: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Person(Base):
    __tablename__ = "people"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    primary_name: Mapped[str] = mapped_column(String, nullable=False)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    death_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    primary_profession: Mapped[str | None] = mapped_column(String, nullable=True)


class MoviePerson(Base):
    __tablename__ = "movie_people"

    movie_id: Mapped[str] = mapped_column(String, ForeignKey("movies.id"), primary_key=True)
    person_id: Mapped[str] = mapped_column(String, ForeignKey("people.id"), primary_key=True)
    ordering: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
