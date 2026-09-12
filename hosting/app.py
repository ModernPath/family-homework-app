"""Same coach core on Docker and Vercel; no shared file memory or paid calls."""
from datetime import date as CalendarDate
from pathlib import Path
import sys
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "agents/homework-coach-agent"))
from homework_core import answer_query

MAX_BODY = 256 * 1024


class BoundedBody:
    """Bound actual received bytes, including chunked requests, before parsing."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        body = bytearray()
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            body.extend(message.get("body", b""))
            if len(body) > MAX_BODY:
                response = JSONResponse({"detail": "Request too large"}, status_code=413,
                                        headers={"Cache-Control": "no-store"})
                return await response(scope, receive, send)
            if not message.get("more_body", False):
                break
        delivered = False

        async def replay():
            nonlocal delivered
            if not delivered:
                delivered = True
                return {"type": "http.request", "body": bytes(body), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)


class Household(BaseModel):
    # Only fields used by the core cross this boundary. Images/rewards/settings
    # remain in the browser. Nested domain errors receive the same safe 422.
    members: list[dict] = Field(default_factory=list, max_length=6)
    tasks: list[dict] = Field(default_factory=list, max_length=25)
    completions: list[dict] = Field(default_factory=list, max_length=1000)
    overrides: list[dict] = Field(default_factory=list, max_length=1000)
    redemptions: list[dict] = Field(default_factory=list, max_length=1000)

    @field_validator("tasks")
    @classmethod
    def task_shapes(cls, rows):
        for task in rows:
            if not isinstance(task.get("schedule"), dict) or not isinstance(task.get("assignment"), dict):
                raise ValueError("Task needs schedule and assignment objects")
        return rows


class CoachRequest(BaseModel):
    household: Household
    query: str = Field(default="Who should do what today?", max_length=2000)
    date: CalendarDate = Field(default_factory=CalendarDate.today)
    locale: Literal["fi", "en"] = "en"

    @field_validator("date")
    @classmethod
    def bounded_date(cls, value):
        # The teaching core iterates dates for weekly rotations. Bound its work.
        if not 2000 <= value.year <= 2100:
            raise ValueError("Date outside demo range")
        return value


def create_app(static_dir: Path | None = None) -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(BoundedBody)

    @app.middleware("http")
    async def response_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        if request.url.path.startswith("/agent-api"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request, exc):
        # Default validation errors can echo submitted names and entire bodies.
        return JSONResponse({"detail": "Invalid coach request"}, status_code=422)

    @app.get("/agent-api/health")
    def health():
        return {"status": "ok", "mode": "stateless-demo"}

    @app.post("/agent-api/coach/ask")
    def ask(payload: CoachRequest):
        try:
            return answer_query(payload.household.model_dump(), payload.query,
                                date=payload.date.isoformat(), locale=payload.locale)
        except (ValueError, TypeError, KeyError, AttributeError, OverflowError):
            raise HTTPException(status_code=422, detail="Invalid household data") from None

    @app.api_route("/agent-api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    def missing_api(path: str):
        raise HTTPException(status_code=404, detail="Not found")

    if static_dir is not None:
        directory = static_dir.resolve()

        @app.get("/{path:path}")
        def frontend(path: str):
            # Only known browser routes fall back. Never mask API/asset errors.
            if path in ("", "coach", "week", "setup"):
                target = directory / "index.html"
            else:
                target = (directory / path).resolve()
                if not target.is_relative_to(directory) or not target.is_file():
                    raise HTTPException(status_code=404, detail="Not found")
            if not target.is_file():
                raise HTTPException(status_code=404, detail="Build the frontend first")
            return FileResponse(target, headers={"Cache-Control": "no-cache"})

    return app


app = create_app(ROOT / "dist")
