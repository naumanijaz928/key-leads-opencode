"""KeyLeads collector service.

Exposes a small FastAPI app that fetches jobs from sources which require a
headless browser or vendor SDK (Indeed, Glassdoor) via python-jobspy.

The Next.js app calls this service only when COLLECTOR_URL is configured; every
other adapter runs natively in TypeScript. See CONTEXT.md for env wiring.
"""

from __future__ import annotations

import os
from typing import Any, Iterable, Literal

from fastapi import FastAPI, Header, HTTPException, Query
from pydantic import BaseModel

app = FastAPI(title="KeyLeads Collector", version="1.0.0")

COLLECTOR_TOKEN = os.getenv("COLLECTOR_TOKEN")
SITE_NAME: dict[str, str] = {"indeed": "indeed", "glassdoor": "glassdoor"}


class Job(BaseModel):
    source: str
    sourceJobId: str | None = None
    url: str | None = None
    applyUrl: str | None = None
    title: str
    companyName: str | None = None
    companyLogo: str | None = None
    companyDomain: str | None = None
    location: str | None = None
    country: str | None = None
    workMode: str | None = None
    workType: str | None = None
    remoteScope: str | None = None
    regions: list[str] = []
    languages: list[str] = []
    seniority: str | None = None
    level: str | None = None
    minYears: int | None = None
    salaryMin: int | None = None
    salaryMax: int | None = None
    salaryCurrency: str | None = None
    salaryText: str | None = None
    tech: list[str] = []
    tags: list[str] = []
    shortJd: str | None = None
    description: str | None = None
    postedAt: str | None = None


def require_token(authorization: str | None) -> None:
    if COLLECTOR_TOKEN and authorization != f"Bearer {COLLECTOR_TOKEN}":
        raise HTTPException(status_code=401, detail="Invalid collector token")


def _clean(value: Any) -> Any:
    try:
        if value is None:
            return None
        if isinstance(value, float) and value != value:  # NaN
            return None
        return value
    except Exception:  # pragma: no cover - defensive
        return None


def _as_int(value: Any) -> int | None:
    value = _clean(value)
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, Iterable):
        return [str(item) for item in value]
    return []


def normalize(row: dict[str, Any], source: str) -> Job:
    title = str(_clean(row.get("title")) or "Untitled")
    description = _clean(row.get("description"))
    is_remote = bool(_clean(row.get("is_remote")))
    min_amount = _as_int(row.get("min_amount"))
    max_amount = _as_int(row.get("max_amount"))
    currency = _clean(row.get("currency"))

    salary_text = None
    if min_amount or max_amount:
        salary_text = f"{currency or ''} {min_amount or ''}-{max_amount or ''}".strip()

    return Job(
        source=source,
        sourceJobId=str(_clean(row.get("id"))) if row.get("id") else None,
        url=_clean(row.get("job_url")),
        applyUrl=_clean(row.get("job_url_direct")) or _clean(row.get("job_url")),
        title=title,
        companyName=_clean(row.get("company")),
        companyLogo=_clean(row.get("company_logo")),
        companyDomain=_clean(row.get("company_url")),
        location=_clean(row.get("location")),
        workMode="remote" if is_remote else None,
        workType=_clean(row.get("job_type")),
        level=_clean(row.get("job_level")),
        salaryMin=min_amount,
        salaryMax=max_amount,
        salaryCurrency=str(currency) if currency else None,
        salaryText=salary_text,
        tags=_as_list(row.get("job_function")),
        shortJd=(str(description)[:240] if description else None),
        description=str(description) if description else None,
        postedAt=_clean(row.get("date_posted")),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/jobs", response_model=list[Job])
def jobs(
    source: Literal["indeed", "glassdoor"] = Query("indeed"),
    q: str = Query("software engineer"),
    location: str = Query(""),
    limit: int = Query(50, ge=1, le=200),
    authorization: str | None = Header(default=None),
) -> list[Job]:
    require_token(authorization)

    try:
        from jobspy import scrape_jobs
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise HTTPException(
            status_code=503,
            detail="python-jobspy is not installed in the collector environment",
        ) from exc

    frame = scrape_jobs(
        site_name=[SITE_NAME[source]],
        search_term=q,
        location=location,
        results_wanted=limit,
        is_remote=True,
        country_indeed="worldwide" if source == "indeed" else None,
        linkedin_fetch_description=False,
    )

    if frame is None or frame.empty:
        return []

    return [normalize(row, source) for row in frame.to_dict(orient="records")]
