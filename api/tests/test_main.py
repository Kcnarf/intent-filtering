import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import settings


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


class TestGetHealth:
    async def test_should_return_200_with_ok_status(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


class TestCORSMiddleware:
    class TestOriginHeader:
        async def test_should_set_header_for_allowed_origin(self, client):
            origin = settings.cors_origins[0]
            response = await client.get("/health", headers={"Origin": origin})
            assert response.headers.get("access-control-allow-origin") == origin

        async def test_should_not_set_header_for_unknown_origin(self, client):
            response = await client.get("/health", headers={"Origin": "http://evil.example.com"})
            assert "access-control-allow-origin" not in response.headers
