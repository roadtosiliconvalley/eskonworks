# eskonworks

Workspace for the autonomous issue agent and its growing collection of static websites.

Issues labelled `auto` in this repository are picked up by the agent, implemented here,
committed locally, and pushed once a day.

## Website

Open `index.html` locally, or visit the GitHub Pages site after enabling it in repository settings.

### Main pages

- `index.html` — portfolio hub with search, category filters and latest builds
- `activity.html` — live agent activity from the GitHub API, with an offline JSON fallback
- `trending.html` — searchable/filterable trending repository radar

### Mini projects

| Project | Folder | What it does |
|---|---|---|
| Login Card | `login-card/` | Form validation and password visibility toggle |
| Tic Tac Toe | `tic-tac-toe/` | Play vs minimax AI or a friend, with scores |
| Snake | `snake/` | Canvas game with keyboard/touch controls and saved best score |
| Pomodoro Timer | `pomodoro/` | Focus/break intervals, progress ring and session stats |
| Web Basics Quiz | `quiz/` | Five HTML/CSS/JS questions with explanations |
| Expense Tracker | `expense-tracker/` | Local budget ledger with category breakdown |
| Markdown Notepad | `markdown-notepad/` | Live Markdown preview with toolbar and download |

Everything is plain **HTML, CSS and JavaScript** — no build step and no runtime dependencies.

## Site data

`scripts/update_site_data.py` uses the official GitHub API to write:

- `data/activity.json` — issues, commits and agent status snapshot
- `data/trending.json` — daily trending repositories and popular topics

The `.github/workflows/update-site-data.yml` workflow refreshes both files every day at
04:00 UTC. Locally:

```powershell
$env:GITHUB_TOKEN = (gh auth token).Trim()
python scripts/update_site_data.py
```

## Agent

The Windows supervisor watches `auto`-labelled issues in this repository, runs OpenCode
headless against this workspace, and commits completed work locally.

## Scripts

- `hello.py` — prints a hello message from eskonworks. Run with `python hello.py`.
- `scripts/update_site_data.py` — refreshes the JSON files used by the website.
