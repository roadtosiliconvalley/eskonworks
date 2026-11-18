#!/usr/bin/env python3
"""Refresh the static JSON files used by activity.html and trending.html.

Uses only the Python standard library. GITHUB_TOKEN is optional locally but
raises the API rate limit; the scheduled workflow supplies it automatically.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REPO = "roadtosiliconvalley/eskonworks"
TOKEN = os.environ.get("GITHUB_TOKEN", "")

SEARCH_URL = "https://api.github.com/search/repositories"
WINDOW_DAYS = 7
MIN_STARS = 50
SECTIONS = [
    ("Overall", None, 10),
    ("Python", "Python", 5),
    ("TypeScript", "TypeScript", 5),
    ("JavaScript", "JavaScript", 5),
    ("Rust", "Rust", 5),
    ("Go", "Go", 5),
]
PAUSE_SECONDS = 3


def api_get(url: str, params: dict | None = None) -> object:
    query = urllib.parse.urlencode(params) if params else ""
    full_url = f"{url}?{query}" if query else url
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "eskonworks-site-data",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    request = urllib.request.Request(full_url, headers=headers)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", "replace")
            if exc.code in (403, 429) and attempt < 2:
                wait = 20 * (attempt + 1)
                print(f"Rate limited; retrying in {wait}s: {exc.code}", file=sys.stderr)
                time.sleep(wait)
                continue
            raise RuntimeError(f"GitHub API returned {exc.code}: {body[:300]}") from exc
        except urllib.error.URLError as exc:
            if attempt < 2:
                time.sleep(5 * (attempt + 1))
                continue
            raise RuntimeError(f"Network error: {exc}") from exc
    raise RuntimeError("Unexpected API failure")


def deduplicate(repos: list[dict], limit: int) -> list[dict]:
    seen: set[str] = set()
    result: list[dict] = []
    for repo in repos:
        name = repo.get("full_name", "").split("/", 1)[-1]
        key = "".join(char for char in name.lower() if char.isalnum())
        if key in seen:
            continue
        seen.add(key)
        result.append(repo)
        if len(result) >= limit:
            break
    return result


def trim_repo(repo: dict) -> dict:
    return {
        "full_name": repo.get("full_name", ""),
        "html_url": repo.get("html_url", ""),
        "stargazers_count": repo.get("stargazers_count", 0),
        "language": repo.get("language"),
        "description": repo.get("description"),
        "created_at": repo.get("created_at"),
        "topics": repo.get("topics", []),
    }


def build_trending() -> dict:
    since = (datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)).strftime("%Y-%m-%d")
    sections = []
    topics: Counter = Counter()
    total = 0

    for title, language, limit in SECTIONS:
        parts = [
            f"created:>={since}",
            f"stars:>={MIN_STARS}",
            "fork:false",
            "archived:false",
        ]
        if language:
            parts.append(f"language:{language}")

        payload = api_get(SEARCH_URL, {
            "q": " ".join(parts),
            "sort": "stars",
            "order": "desc",
            "per_page": min(100, limit * 4),
        })
        repos = [trim_repo(item) for item in deduplicate(payload.get("items", []), limit)]
        sections.append({"title": title, "repos": repos})
        for repo in repos:
            topics.update(repo.get("topics", []))
        total += len(repos)
        print(f"  {title}: {len(repos)} repositories", file=sys.stderr)
        time.sleep(PAUSE_SECONDS)

    if total == 0:
        raise RuntimeError("No trending repositories fetched; refusing to overwrite data")

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "window_days": WINDOW_DAYS,
        "min_stars": MIN_STARS,
        "sections": sections,
        "topics": [{"name": name, "count": count} for name, count in topics.most_common(12)],
    }


def build_activity() -> dict:
    commits_payload = api_get(f"https://api.github.com/repos/{REPO}/commits", {"per_page": 6})
    issues_payload = api_get(
        f"https://api.github.com/repos/{REPO}/issues",
        {"state": "all", "sort": "updated", "per_page": 10},
    )
    issues = [issue for issue in issues_payload if "pull_request" not in issue]

    def labels(issue: dict) -> list[str]:
        return [label.get("name", "") for label in issue.get("labels", [])]

    auto_issues = [issue for issue in issues if "auto" in labels(issue)]
    open_issues = [issue for issue in auto_issues if issue.get("state") == "open"]
    closed_issues = [issue for issue in auto_issues if issue.get("state") == "closed"]

    recent_commits = [
        {
            "sha": item.get("sha", "")[:7],
            "message": item.get("commit", {}).get("message", "").split("\n")[0],
            "url": item.get("html_url", ""),
            "date": item.get("commit", {}).get("author", {}).get("date"),
        }
        for item in commits_payload
    ]

    open_issue_view = [
        {
            "number": issue.get("number"),
            "title": issue.get("title"),
            "state": issue.get("state"),
            "url": issue.get("html_url"),
            "updated_at": issue.get("updated_at"),
            "labels": labels(issue),
        }
        for issue in issues
    ]

    timeline = [
        {
            "time": issue.get("updated_at"),
            "kind": "done" if issue.get("state") == "closed" else "task",
            "title": f"#{issue.get('number')} {issue.get('title')}",
            "detail": "Completed" if issue.get("state") == "closed" else "Queued for the agent",
        }
        for issue in open_issue_view
    ] + [
        {
            "time": commit.get("date"),
            "kind": "commit",
            "title": commit.get("message"),
            "detail": f"Commit {commit.get('sha')}",
        }
        for commit in recent_commits
    ]
    timeline.sort(key=lambda item: item.get("time") or "", reverse=True)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "bot": {
            "status": "online",
            "current_task": (
                f"Building: #{open_issues[0].get('number')} {open_issues[0].get('title')}"
                if open_issues
                else "Waiting for a new issue labelled auto"
            ),
            "detail": (
                "An auto-labelled issue is queued right now."
                if open_issues
                else "No queued issues. Open one to start the next build."
            ),
            "progress": 35 if open_issues else 100,
        },
        "stats": {
            "open_tasks": len(open_issues),
            "completed_tasks": len(closed_issues),
            "total_commits": len(recent_commits),
        },
        "timeline": timeline[:8],
        "recent_commits": recent_commits,
        "open_issues": open_issue_view,
    }


def write_json(name: str, payload: object) -> None:
    path = DATA_DIR / name
    with open(path, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(f"Wrote {path.relative_to(ROOT)}", file=sys.stderr)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    write_json("trending.json", build_trending())
    write_json("activity.json", build_activity())


if __name__ == "__main__":
    main()
