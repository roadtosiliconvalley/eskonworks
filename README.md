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
| Memory Match | `memory-match/` | Card-flipping memory game with timer and best score |
| Drawing Pad | `drawing-pad/` | Canvas doodling with colors, eraser, undo and PNG export |
| SchoolOS | `school-management/` | School dashboard: students, teachers, classes, attendance and grades |
| JARVIS Voice Assistant | `jarvis-voice/` | Fictional Tony Stark-style AI with voice/typed commands and replies |
| Eye in the Sky | `eye-in-the-sky/` | Fictional tactical radar simulator with contacts, telemetry and mission log |
| Mindful Space | `mental-health/` | Wellness toolkit: mood check-ins, breathing, grounding and gratitude journal |
| Password Forge | `password-generator/` | Strong random passwords with options, strength meter and copy |
| Unit Converter | `unit-converter/` | Convert length, weight, temperature, area and data between units |
| Tip Calculator | `tip-calculator/` | Split bills with tips, people count and a clear breakdown |
| World Clock | `world-clock/` | Live analog/digital clocks for cities in multiple time zones |
| Virtual Piano | `virtual-piano/` | Play notes with keyboard or mouse using Web Audio synthesis |
| Flashcards | `flashcards/` | Study decks with flipping, shuffle, progress and known marks |
| Minesweeper | `minesweeper/` | Classic puzzle with three difficulties, flags and safe first click |
| 2048 | `2048/` | Slide-and-merge puzzle with keyboard, swipe and saved best score |
| Palette Studio | `color-palette/` | Color harmonies with locks, hex editing and CSS export |
| Habit Tracker | `habit-tracker/` | Weekly habit grid with streaks and locally stored progress |
| Weather Dashboard | `weather-dashboard/` | Five-day sample forecast with hourly bars and unit switching |
| Countdown | `countdown/` | Live event countdowns with progress bars and local storage |
| BMI Calculator | `bmi-calculator/` | BMI estimate with category scale and healthy weight range |
| Morse Code Lab | `morse-code/` | Text/Morse translation with audio playback and reference chart |
| Sudoku | `sudoku/` | Nine-by-nine puzzle with difficulties, hints and mistake tracking |
| Whack-a-Mole | `whack-a-mole/` | Thirty-second reflex game with increasing speed |
| Breakout | `breakout/` | Canvas arcade game with bricks, levels and lives |
| Cipher Lab | `cipher-lab/` | Caesar, ROT13, Atbash and Base64 text transforms |
| Typing Test | `typing-test/` | WPM and accuracy measurement across practice passages |
| Image Filters | `image-filters/` | Canvas image adjustment with presets and PNG download |
| Simon Says | `simon-says/` | Color sequence memory game with rounds and strict mode |
| Sticky Notes | `sticky-notes/` | Draggable colored notes with editing, filtering and storage |
| Drum Machine | `drum-machine/` | Synthesized percussion pads with an eight-step loop recorder |
| Quote Generator | `quote-generator/` | Quotes by category with favorites and copy support |
| Northstar Landing Page | `landing-page/` | Sample product page with responsive nav, pricing and FAQ |

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
