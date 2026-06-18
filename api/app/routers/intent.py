import json
from datetime import date
from threading import Lock

import anthropic
from fastapi import Depends, HTTPException, Request
from fastapi.routing import APIRouter
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import settings
from ..schemas import FilterParams, FilterParamsBody, IntentOut

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

SYSTEM_PROMPT = """
You are a movie filter extraction assistant for an IMDb movie discovery app.
Your ONLY purpose is to analyze a user's natural language intent and extract structured movie filter parameters.

## Available filter parameters
- genres_or: list of genres (movie matches ANY of these)
- genres_and: list of genres (movie must have ALL of these)
- year_min / year_max: release year range (1900–2025)
- rating_min: minimum IMDb rating (1.0–10.0)
- votes_min: minimum vote count (common values: 1000, 5000, 10000, 50000, 100000, 500000)

## Available genres
Action, Adventure, Animation, Biography, Comedy, Crime, Documentary, Drama, Family, Fantasy,
Film-Noir, History, Horror, Music, Musical, Mystery, Romance, Sci-Fi, Sport, Thriller, War, Western

## Decision rules
1. Full description (e.g. "action movies from the 90s with high ratings"): replace ALL current filters; set unmentioned fields to null / empty list.
2. Partial modifier (e.g. "documentaries instead of action", "also include comedies", "remove the year filter"): update only the mentioned fields; keep other current filters unchanged.
3. Ambiguous intent (e.g. unclear AND vs OR for genres): return the current filters unchanged and set message to a brief, user-friendly clarification.
4. Off-topic request: return the current filters unchanged and set message to "I can only help with movie filters."

## Rules
- Always call the set_filters tool — never respond in plain text.
- Use null for unset numeric fields, empty list [] for unset genre lists.
- Genres must exactly match one of the available genres listed above.
""".strip()

SET_FILTERS_TOOL = {
    "name": "set_filters",
    "description": "Set the movie filter parameters based on the user's intent.",
    "input_schema": {
        "type": "object",
        "properties": {
            "genres_or": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Genres (any of). Empty list = no genre filter.",
            },
            "genres_and": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Genres (all of). Empty list = no genre filter.",
            },
            "year_min": {
                "type": ["integer", "null"],
                "description": "Minimum release year, or null for no lower bound.",
            },
            "year_max": {
                "type": ["integer", "null"],
                "description": "Maximum release year, or null for no upper bound.",
            },
            "rating_min": {
                "type": ["number", "null"],
                "description": "Minimum IMDb rating (1.0–10.0), or null for no minimum.",
            },
            "votes_min": {
                "type": ["integer", "null"],
                "description": "Minimum vote count, or null for no minimum.",
            },
            "message": {
                "type": ["string", "null"],
                "description": "Optional clarification shown to the user (ambiguous or off-topic requests).",
            },
        },
        "required": ["genres_or", "genres_and", "year_min", "year_max", "rating_min", "votes_min"],
    },
}


class _DailyCap:
    def __init__(self) -> None:
        self._count = 0
        self._date = date.today()
        self._lock = Lock()

    def try_consume(self, limit: int) -> bool:
        with self._lock:
            today = date.today()
            if today != self._date:
                self._count = 0
                self._date = today
            if self._count >= limit:
                return False
            self._count += 1
            return True

    def reset(self) -> None:
        with self._lock:
            self._count = 0
            self._date = date.today()


_daily_cap = _DailyCap()


def reset_daily_cap() -> None:
    _daily_cap.reset()


@router.get("/intent", response_model=IntentOut)
@limiter.limit("10/minute")
async def get_intent(
    request: Request,
    intent_text: str,
    current_filters: FilterParams = Depends(),
) -> IntentOut:
    if not _daily_cap.try_consume(settings.intent_daily_cap):
        raise HTTPException(status_code=429, detail="Daily request limit reached. Please try again tomorrow.")

    current_filters_dict = {
        "genres_or": current_filters.genres_or,
        "genres_and": current_filters.genres_and,
        "year_min": current_filters.year_min,
        "year_max": current_filters.year_max,
        "rating_min": current_filters.rating_min,
        "votes_min": current_filters.votes_min,
    }

    client = anthropic.AsyncAnthropic(api_key=settings.llm_api_key)
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[SET_FILTERS_TOOL],
        tool_choice={"type": "tool", "name": "set_filters"},
        messages=[
            {
                "role": "user",
                "content": (
                    f"Current filters: {json.dumps(current_filters_dict)}\n\n"
                    f"User intent: {intent_text}"
                ),
            }
        ],
    )

    tool_use = next(b for b in response.content if b.type == "tool_use")
    inp = tool_use.input

    return IntentOut(
        filters=FilterParamsBody(
            genres_or=inp.get("genres_or", []),
            genres_and=inp.get("genres_and", []),
            year_min=inp.get("year_min"),
            year_max=inp.get("year_max"),
            rating_min=inp.get("rating_min"),
            votes_min=inp.get("votes_min"),
        ),
        message=inp.get("message"),
    )
