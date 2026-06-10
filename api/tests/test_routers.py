EXPECTED_DISTRIBUTION_LABELS = ["1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"]


class TestGetMovies:
    async def test_should_return_movies(self, client):
        response = await client.get("/api/movies")
        assert response.status_code == 200
        assert len(response.json()) > 0

    class TestGenreParam:
        async def test_should_filter_to_matching_movies_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"genre": "Action", "limit": 100})).json()
            assert len(movies) > 0
            assert all("Action" in m["genres"] for m in movies)

        async def test_should_return_more_movies_when_omitted(self, client):
            filtered = (await client.get("/api/movies/stat", params={"genre": "Action"})).json()
            unfiltered = (await client.get("/api/movies/stat")).json()
            assert unfiltered["total_count"] > filtered["total_count"]

    class TestYearMinParam:
        async def test_should_filter_to_movies_from_year_onwards_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"year_min": 2000, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["start_year"] >= 2000 for m in movies)

        async def test_should_return_more_movies_when_omitted(self, client):
            filtered = (await client.get("/api/movies/stat", params={"year_min": 2000})).json()
            unfiltered = (await client.get("/api/movies/stat")).json()
            assert unfiltered["total_count"] > filtered["total_count"]

    class TestYearMaxParam:
        async def test_should_filter_to_movies_up_to_year_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"year_max": 1990, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["start_year"] <= 1990 for m in movies)

        async def test_should_return_more_movies_when_omitted(self, client):
            filtered = (await client.get("/api/movies/stat", params={"year_max": 1990})).json()
            unfiltered = (await client.get("/api/movies/stat")).json()
            assert unfiltered["total_count"] > filtered["total_count"]

    class TestRatingMinParam:
        async def test_should_filter_to_movies_above_rating_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"rating_min": 8.0, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["average_rating"] >= 8.0 for m in movies)

        async def test_should_return_more_movies_when_omitted(self, client):
            filtered = (await client.get("/api/movies/stat", params={"rating_min": 8.0})).json()
            unfiltered = (await client.get("/api/movies/stat")).json()
            assert unfiltered["total_count"] > filtered["total_count"]

    class TestVotesMinParam:
        async def test_should_filter_to_movies_above_votes_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"votes_min": 100000, "limit": 100})).json()
            assert len(movies) > 0
            assert all(m["num_votes"] >= 100000 for m in movies)

        async def test_should_return_more_movies_when_omitted(self, client):
            filtered = (await client.get("/api/movies/stat", params={"votes_min": 100000})).json()
            unfiltered = (await client.get("/api/movies/stat")).json()
            assert unfiltered["total_count"] > filtered["total_count"]

    class TestLimitParam:
        async def test_should_return_exactly_n_movies_when_provided(self, client):
            movies = (await client.get("/api/movies", params={"limit": 5})).json()
            assert len(movies) == 5

        async def test_should_return_default_50_movies_when_omitted(self, client):
            movies = (await client.get("/api/movies")).json()
            assert len(movies) == 50

    class TestOffsetParam:
        async def test_should_skip_movies_when_provided(self, client):
            first = (await client.get("/api/movies", params={"limit": 1, "offset": 0})).json()
            second = (await client.get("/api/movies", params={"limit": 1, "offset": 1})).json()
            assert first[0]["id"] != second[0]["id"]

        async def test_should_start_from_beginning_when_omitted(self, client):
            without_offset = (await client.get("/api/movies", params={"limit": 1})).json()
            with_zero_offset = (await client.get("/api/movies", params={"limit": 1, "offset": 0})).json()
            assert without_offset[0]["id"] == with_zero_offset[0]["id"]


class TestGetMoviesStat:
    async def test_should_return_200(self, client):
        response = await client.get("/api/movies/stat")
        assert response.status_code == 200

    class TestWithData:
        async def test_should_return_positive_total_count(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert data["total_count"] > 0

        async def test_should_return_float_average_rating(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert isinstance(data["average_rating"], float)
            assert 1.0 <= data["average_rating"] <= 10.0

        async def test_should_return_positive_total_votes(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert data["total_votes"] > 0

    class TestRatingDistribution:
        async def test_should_return_9_buckets(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert len(data["rating_distribution"]) == 9

        async def test_should_use_interval_labels(self, client):
            data = (await client.get("/api/movies/stat")).json()
            labels = [b["label"] for b in data["rating_distribution"]]
            assert labels == EXPECTED_DISTRIBUTION_LABELS

        async def test_should_have_counts_summing_to_total_count(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert sum(b["count"] for b in data["rating_distribution"]) == data["total_count"]
