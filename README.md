# Monkey Statistics

Monkey Statistics is a mobile-first PWA for tracking ultimate frisbee games in real time, built for sideline use. It lets teams capture point-by-point data and surface live and post-game insights.

## Core Features

- Team, player, and competition management
- Game and point lifecycle tracking (ready -> running -> scored -> completed)
- Live point tracking with 7-player selection, pull tracking, and strategy assignment
- Calls and turnovers tracking with timing
- Game statistics dashboard (team, player, strategy stats)
- CSV export of game statistics
- i18n (English/French) with sport terms kept in English

## Tech Stack

- Backend: FastAPI + SQLAlchemy (SQLite locally, PostgreSQL in production)
- Frontend: React + TypeScript + Material UI + TanStack Query
- Testing: Pytest (backend), Vitest + MSW + React Testing Library (frontend)

## Required Tools

- Git
- Python 3 (with `venv`)
- Node.js + npm
- Bash on macOS/Linux (for `dev.sh`)
- PowerShell on Windows (for `dev.ps1`)

## Local Development

Install dependencies (first time):

macOS/Linux:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

Windows PowerShell:

```powershell
py -m venv .\backend\venv
.\backend\venv\Scripts\Activate.ps1
pip install -r .\backend\requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

Start both apps together:

macOS/Linux:

```bash
./dev.sh
```

Windows PowerShell:

```powershell
.\dev.ps1
```

`dev.sh` (macOS/Linux) and `dev.ps1` (Windows) auto-bootstrap missing local setup:
- Creates `backend/venv` if missing (when Python is available)
- Installs backend dependencies when required modules are missing
- Runs `npm install` in `frontend` when Vite dependencies are missing

If PowerShell blocks script execution, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

Or run individually:

- Backend: see `backend/README.md`
- Frontend: see `frontend/README.md`

## More Docs

- `requirements.md` for feature requirements
- `data-model-design.md` for the full data model
- `DEPLOYMENT.md` for deployment steps
- `DEPLOYMENT_STATUS.md` for live URLs
