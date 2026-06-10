EXPECTED_DISTRIBUTION_LABELS = ["1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"]


class TestGetMovies:
    async def test_should_return_200_with_empty_list(self, client):
        # baseline: no params — covers the omitted case for all optional filters
        response = await client.get("/api/movies")
        assert response.status_code == 200
        assert response.json() == []

    class TestGenreParam:
        async def test_should_return_empty_list_when_provided(self, client):
            response = await client.get("/api/movies", params={"genre": "Action"})
            assert response.status_code == 200
            assert response.json() == []

    class TestYearMinParam:
        async def test_should_return_empty_list_when_provided(self, client):
            response = await client.get("/api/movies", params={"year_min": 2000})
            assert response.status_code == 200
            assert response.json() == []

    class TestYearMaxParam:
        async def test_should_return_empty_list_when_provided(self, client):
            response = await client.get("/api/movies", params={"year_max": 2020})
            assert response.status_code == 200
            assert response.json() == []

    class TestRatingMinParam:
        async def test_should_return_empty_list_when_provided(self, client):
            response = await client.get("/api/movies", params={"rating_min": 7.0})
            assert response.status_code == 200
            assert response.json() == []

    class TestVotesMinParam:
        async def test_should_return_empty_list_when_provided(self, client):
            response = await client.get("/api/movies", params={"votes_min": 5000})
            assert response.status_code == 200
            assert response.json() == []

    class TestLimitParam:
        async def test_should_accept_custom_value(self, client):
            response = await client.get("/api/movies", params={"limit": 10})
            assert response.status_code == 200

    class TestOffsetParam:
        async def test_should_accept_custom_value(self, client):
            response = await client.get("/api/movies", params={"offset": 10})
            assert response.status_code == 200


class TestGetMoviesStat:
    async def test_should_return_200(self, client):
        # baseline: no params — covers the omitted case for all optional filters
        response = await client.get("/api/movies/stat")
        assert response.status_code == 200

    class TestEmptyDatabase:
        async def test_should_return_zero_total_count(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert data["total_count"] == 0

        async def test_should_return_null_average_rating(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert data["average_rating"] is None

        async def test_should_return_null_total_votes(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert data["total_votes"] is None

    class TestRatingDistribution:
        async def test_should_return_9_buckets(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert len(data["rating_distribution"]) == 9

        async def test_should_use_interval_labels(self, client):
            data = (await client.get("/api/movies/stat")).json()
            labels = [b["label"] for b in data["rating_distribution"]]
            assert labels == EXPECTED_DISTRIBUTION_LABELS

        async def test_should_return_zero_counts_when_empty(self, client):
            data = (await client.get("/api/movies/stat")).json()
            assert all(b["count"] == 0 for b in data["rating_distribution"])
