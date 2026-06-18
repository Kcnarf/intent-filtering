from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.routers.intent import reset_daily_cap


@pytest.fixture(autouse=True)
def reset_cap():
    reset_daily_cap()
    yield
    reset_daily_cap()


class TestGetIntent:
    class TestHappyPath:
        @pytest.fixture(autouse=True)
        def mock_llm(self):
            tool_use_block = MagicMock()
            tool_use_block.type = "tool_use"
            tool_use_block.input = {
                "genres_or": ["Action"],
                "genres_and": [],
                "year_min": 1990,
                "year_max": 2000,
                "rating_min": 7.0,
                "votes_min": None,
                "message": None,
            }
            mock_response = MagicMock()
            mock_response.content = [tool_use_block]

            with patch("app.routers.intent.anthropic.AsyncAnthropic") as MockClient:
                mock_instance = MagicMock()
                MockClient.return_value = mock_instance
                mock_instance.messages.create = AsyncMock(return_value=mock_response)
                yield

        async def test_should_return_200(self, test_client):
            response = await test_client.get(
                "/api/intent",
                params={"intent_text": "action movies from the 90s"},
            )
            assert response.status_code == 200

        async def test_should_return_filters_extracted_from_intent_text(self, test_client):
            response = await test_client.get(
                "/api/intent",
                params={"intent_text": "action movies from the 90s rated above 7"},
            )
            data = response.json()
            assert data["filters"]["genres_or"] == ["Action"]
            assert data["filters"]["year_min"] == 1990
            assert data["filters"]["year_max"] == 2000
            assert data["filters"]["rating_min"] == 7.0

        async def test_should_return_null_message_when_no_ambiguity(self, test_client):
            response = await test_client.get(
                "/api/intent",
                params={"intent_text": "action movies from the 90s rated above 7"},
            )
            assert response.json()["message"] is None

    class TestAmbiguity:
        @pytest.fixture(autouse=True)
        def mock_llm_ambiguous(self):
            tool_use_block = MagicMock()
            tool_use_block.type = "tool_use"
            tool_use_block.input = {
                "genres_or": [],
                "genres_and": [],
                "year_min": None,
                "year_max": None,
                "rating_min": None,
                "votes_min": None,
                "message": "Too ambiguous: cannot distinguish 'Documentaries AND Action' from 'Documentaries OR Action'.",
            }
            mock_response = MagicMock()
            mock_response.content = [tool_use_block]

            with patch("app.routers.intent.anthropic.AsyncAnthropic") as MockClient:
                mock_instance = MagicMock()
                MockClient.return_value = mock_instance
                mock_instance.messages.create = AsyncMock(return_value=mock_response)
                yield

        async def test_should_return_current_filters_when_llm_signals_ambiguity(self, test_client):
            response = await test_client.get(
                "/api/intent",
                params={
                    "intent_text": "documentaries and action",
                    "genres_or": ["Drama"],
                    "rating_min": 8.0,
                },
            )
            assert response.status_code == 200
            filters = response.json()["filters"]
            assert filters["genres_or"] == []
            assert filters["rating_min"] is None

        async def test_should_return_message_when_llm_signals_ambiguity(self, test_client):
            response = await test_client.get(
                "/api/intent",
                params={"intent_text": "documentaries and action"},
            )
            assert response.json()["message"] is not None
            assert len(response.json()["message"]) > 0

    class TestDailyCap:
        @pytest.fixture(autouse=True)
        def mock_llm(self):
            tool_use_block = MagicMock()
            tool_use_block.type = "tool_use"
            tool_use_block.input = {
                "genres_or": [],
                "genres_and": [],
                "year_min": None,
                "year_max": None,
                "rating_min": None,
                "votes_min": None,
                "message": None,
            }
            mock_response = MagicMock()
            mock_response.content = [tool_use_block]

            with patch("app.routers.intent.anthropic.AsyncAnthropic") as MockClient:
                mock_instance = MagicMock()
                MockClient.return_value = mock_instance
                mock_instance.messages.create = AsyncMock(return_value=mock_response)
                yield

        async def test_should_return_200_when_within_daily_cap(self, test_client, monkeypatch):
            monkeypatch.setattr("app.routers.intent.settings.intent_daily_cap", 2)
            response = await test_client.get(
                "/api/intent", params={"intent_text": "drama"}
            )
            assert response.status_code == 200

        async def test_should_return_429_when_daily_cap_exceeded(self, test_client, monkeypatch):
            monkeypatch.setattr("app.routers.intent.settings.intent_daily_cap", 1)
            await test_client.get("/api/intent", params={"intent_text": "drama"})
            response = await test_client.get("/api/intent", params={"intent_text": "comedy"})
            assert response.status_code == 429