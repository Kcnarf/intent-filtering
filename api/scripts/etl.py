"""
ETL script: downloads IMDb TSV datasets and loads them into the local SQLite DB.
Run from the api/ directory: uv run python scripts/etl.py
"""

import asyncio
import csv
import gzip
import sqlite3
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import models  # noqa: F401 — registers ORM models with Base.metadata
from app.database import create_tables

BASE_URL = "https://datasets.imdbws.com"
SOURCES = {
    "ratings": "title.ratings.tsv.gz",
    "basics": "title.basics.tsv.gz",
    "principals": "title.principals.tsv.gz",
    "names": "name.basics.tsv.gz",
}
DB_PATH = Path("data/imdb.db")
RAW_DIR = Path("data/raw")


def _null(value: str) -> str | None:
    return None if value == r"\N" else value


def _int(value: str) -> int | None:
    v = _null(value)
    return int(v) if v is not None else None


def _float(value: str) -> float | None:
    v = _null(value)
    return float(v) if v is not None else None


def download(name: str, raw_dir: Path) -> Path:
    filename = SOURCES[name]
    dest = raw_dir / filename
    if dest.exists():
        print(f"  [skip] {filename} already present")
        return dest
    url = f"{BASE_URL}/{filename}"
    print(f"  [download] {url}")
    with httpx.Client(follow_redirects=True, timeout=300) as client:
        with client.stream("GET", url) as response:
            response.raise_for_status()
            dest.parent.mkdir(parents=True, exist_ok=True)
            with open(dest, "wb") as f:
                for chunk in response.iter_bytes(chunk_size=1024 * 64):
                    f.write(chunk)
    print(f"  [done] {dest.stat().st_size // 1024 // 1024} MB saved")
    return dest


def load_ratings(raw_dir: Path) -> tuple[dict, set]:
    path = download("ratings", raw_dir)
    ratings: dict[str, tuple[float, int]] = {}
    qualifying: set[str] = set()
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            votes = _int(row["numVotes"])
            avg = _float(row["averageRating"])
            if votes is not None and votes >= 1000:
                tconst = row["tconst"]
                ratings[tconst] = (avg, votes)
                qualifying.add(tconst)
    print(f"  {len(qualifying):,} titles with >=1000 votes")
    return ratings, qualifying


def load_movies(
    raw_dir: Path, ratings: dict, qualifying: set
) -> tuple[list[tuple], set[str]]:
    path = download("basics", raw_dir)
    movies: list[tuple] = []
    movie_tconsts: set[str] = set()
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            if row["titleType"] != "movie":
                continue
            tconst = row["tconst"]
            if tconst not in qualifying:
                continue
            avg, votes = ratings[tconst]
            movies.append((
                tconst,
                row["primaryTitle"],
                row["originalTitle"],
                _int(row["startYear"]),
                _int(row["runtimeMinutes"]),
                _null(row["genres"]),
                avg,
                votes,
            ))
            movie_tconsts.add(tconst)
    print(f"  {len(movies):,} movies")
    return movies, movie_tconsts


def load_principals(
    raw_dir: Path, movie_tconsts: set[str]
) -> tuple[list[tuple], set[str]]:
    path = download("principals", raw_dir)
    movie_people: list[tuple] = []
    nconsts: set[str] = set()
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            if row["tconst"] not in movie_tconsts:
                continue
            nconst = row["nconst"]
            movie_people.append((
                row["tconst"],
                nconst,
                _int(row["ordering"]),
                _null(row["category"]),
            ))
            nconsts.add(nconst)
    print(f"  {len(movie_people):,} movie-person links, {len(nconsts):,} unique people")
    return movie_people, nconsts


def load_people(raw_dir: Path, nconsts: set[str]) -> list[tuple]:
    path = download("names", raw_dir)
    people: list[tuple] = []
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            if row["nconst"] not in nconsts:
                continue
            people.append((
                row["nconst"],
                row["primaryName"],
                _int(row["birthYear"]),
                _int(row["deathYear"]),
                _null(row["primaryProfession"]),
            ))
    print(f"  {len(people):,} people")
    return people


def insert_all(
    db_path: Path,
    movies: list[tuple],
    people: list[tuple],
    movie_people: list[tuple],
) -> None:
    con = sqlite3.connect(db_path)
    con.execute("PRAGMA foreign_keys = OFF")
    con.execute("PRAGMA journal_mode = WAL")
    con.execute("PRAGMA synchronous = NORMAL")
    try:
        print("  clearing existing data...")
        con.execute("DELETE FROM movie_people")
        con.execute("DELETE FROM movies")
        con.execute("DELETE FROM people")

        print(f"  inserting {len(movies):,} movies...")
        con.executemany(
            "INSERT INTO movies VALUES (?,?,?,?,?,?,?,?)", movies
        )
        print(f"  inserting {len(people):,} people...")
        con.executemany(
            "INSERT INTO people VALUES (?,?,?,?,?)", people
        )
        print(f"  inserting {len(movie_people):,} movie-person links...")
        con.executemany(
            "INSERT INTO movie_people VALUES (?,?,?,?)", movie_people
        )
        con.commit()
    finally:
        con.execute("PRAGMA foreign_keys = ON")
        con.close()


def main() -> None:
    t0 = time.time()

    print("Step 0 — ensuring DB tables exist")
    asyncio.run(create_tables())

    print("Step 1 — ratings")
    ratings, qualifying = load_ratings(RAW_DIR)

    print("Step 2 — movies")
    movies, movie_tconsts = load_movies(RAW_DIR, ratings, qualifying)

    print("Step 3 — principals")
    movie_people, nconsts = load_principals(RAW_DIR, movie_tconsts)

    print("Step 4 — people")
    people = load_people(RAW_DIR, nconsts)

    print("Step 5 — loading into DB")
    insert_all(DB_PATH, movies, people, movie_people)

    elapsed = time.time() - t0
    print(f"\nDone in {elapsed:.1f}s — {len(movies):,} movies, {len(people):,} people")


if __name__ == "__main__":
    main()
