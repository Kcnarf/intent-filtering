import pytest

from app.models import Movie

EXPECTED_DISTRIBUTION_LABELS = ["1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"]


class TestGetMovies:
    class TestBasic:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add(Movie(
                id="tt0000001", primary_title="Movie A", original_title="Movie A",
                start_year=2000, runtime_minutes=120, genres="Drama",
                average_rating=7.0, num_votes=50_000,
            ))
            await test_db_session.commit()

        async def test_should_return_movies(self, test_client):
            response = await test_client.get("/api/movies")
            assert response.status_code == 200
            assert len(response.json()) > 0

    class TestGenreParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Action Movie", original_title="Action Movie",
                      start_year=2000, runtime_minutes=120, genres="Action",
                      average_rating=7.0, num_votes=50_000),
                Movie(id="tt0000002", primary_title="Drama Movie", original_title="Drama Movie",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_filter_to_matching_movies_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"genre": "Action", "limit": 100})).json()
            assert len(movies) > 0
            assert all("Action" in m["genres"] for m in movies)

        async def test_should_return_all_movies_when_omitted(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] == 2

    class TestYearMinParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Old Movie", original_title="Old Movie",
                      start_year=1995, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
                Movie(id="tt0000002", primary_title="New Movie", original_title="New Movie",
                      start_year=2005, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_filter_to_movies_from_year_onwards_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"year_min": 2000, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["start_year"] >= 2000 for m in movies)

        async def test_should_return_all_movies_when_omitted(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] == 2

    class TestYearMaxParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Old Movie", original_title="Old Movie",
                      start_year=1985, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
                Movie(id="tt0000002", primary_title="New Movie", original_title="New Movie",
                      start_year=2005, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_filter_to_movies_up_to_year_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"year_max": 1990, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["start_year"] <= 1990 for m in movies)

        async def test_should_return_all_movies_when_omitted(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] == 2

    class TestYearRangeConstraint:
        async def test_should_return_422_when_year_min_exceeds_year_max(self, test_client):
            response = await test_client.get("/api/movies", params={"year_min": 2020, "year_max": 2010})
            assert response.status_code == 422

        async def test_should_accept_equal_year_min_and_year_max(self, test_client):
            response = await test_client.get("/api/movies", params={"year_min": 2020, "year_max": 2020})
            assert response.status_code == 200

    class TestRatingMinParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Great Movie", original_title="Great Movie",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=8.5, num_votes=50_000),
                Movie(id="tt0000002", primary_title="Average Movie", original_title="Average Movie",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=6.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_filter_to_movies_above_rating_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"rating_min": 8.0, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["average_rating"] >= 8.0 for m in movies)

        async def test_should_return_all_movies_when_omitted(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] == 2

    class TestVotesMinParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Popular Movie", original_title="Popular Movie",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=200_000),
                Movie(id="tt0000002", primary_title="Obscure Movie", original_title="Obscure Movie",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_filter_to_movies_above_votes_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"votes_min": 100000, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["num_votes"] >= 100000 for m in movies)

        async def test_should_return_all_movies_when_omitted(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] == 2

    class TestLimitParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(
                    id=f"tt{i:07d}", primary_title=f"Movie {i}", original_title=f"Movie {i}",
                    start_year=2000, runtime_minutes=120, genres="Drama",
                    average_rating=7.0, num_votes=50_000,
                )
                for i in range(1, 56)
            ])
            await test_db_session.commit()

        async def test_should_return_exactly_n_movies_when_provided(self, test_client):
            movies = (await test_client.get("/api/movies", params={"limit": 5})).json()
            assert len(movies) == 5

        async def test_should_return_default_50_movies_when_omitted(self, test_client):
            movies = (await test_client.get("/api/movies")).json()
            assert len(movies) == 50

    class TestOffsetParam:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id="tt0000001", primary_title="Movie A", original_title="Movie A",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=100_000),
                Movie(id="tt0000002", primary_title="Movie B", original_title="Movie B",
                      start_year=2000, runtime_minutes=120, genres="Drama",
                      average_rating=7.0, num_votes=50_000),
            ])
            await test_db_session.commit()

        async def test_should_skip_movies_when_provided(self, test_client):
            first = (await test_client.get("/api/movies", params={"limit": 1, "offset": 0})).json()
            second = (await test_client.get("/api/movies", params={"limit": 1, "offset": 1})).json()
            assert first[0]["id"] != second[0]["id"]

        async def test_should_start_from_beginning_when_omitted(self, test_client):
            without_offset = (await test_client.get("/api/movies", params={"limit": 1})).json()
            with_zero_offset = (await test_client.get("/api/movies", params={"limit": 1, "offset": 0})).json()
            assert without_offset[0]["id"] == with_zero_offset[0]["id"]


class TestGetMoviesStat:
    class TestBasic:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add(Movie(
                id="tt0000001", primary_title="Movie A", original_title="Movie A",
                start_year=2000, runtime_minutes=120, genres="Drama",
                average_rating=7.0, num_votes=50_000,
            ))
            await test_db_session.commit()

        async def test_should_return_200(self, test_client):
            response = await test_client.get("/api/movies/stat")
            assert response.status_code == 200

    class TestWithData:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add(Movie(
                id="tt0000001", primary_title="Movie A", original_title="Movie A",
                start_year=2000, runtime_minutes=120, genres="Drama",
                average_rating=7.5, num_votes=50_000,
            ))
            await test_db_session.commit()

        async def test_should_return_positive_total_count(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_count"] > 0

        async def test_should_return_float_average_rating(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert isinstance(data["average_rating"], float)
            assert 1.0 <= data["average_rating"] <= 10.0

        async def test_should_return_positive_total_votes(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert data["total_votes"] > 0

    class TestRatingDistribution:
        @pytest.fixture(autouse=True)
        async def setup_data(self, test_db_session):
            test_db_session.add_all([
                Movie(id=f"tt{i:07d}", primary_title=f"Movie {i}", original_title=f"Movie {i}",
                      start_year=2000, runtime_minutes=120, genres="Drama", num_votes=50_000,
                      average_rating=rating)
                for i, rating in enumerate([1.5, 1.8, 5.2, 5.5, 5.9, 7.1, 9.0, 9.7], start=1)
            ])
            await test_db_session.commit()

        async def test_should_return_9_buckets(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert len(data["rating_distribution"]) == 9

        async def test_should_use_interval_labels(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            labels = [b["label"] for b in data["rating_distribution"]]
            assert labels == EXPECTED_DISTRIBUTION_LABELS

        async def test_should_have_counts_summing_to_total_count(self, test_client):
            data = (await test_client.get("/api/movies/stat")).json()
            assert sum(b["count"] for b in data["rating_distribution"]) == data["total_count"]
