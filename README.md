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

## Local Development

Start both apps together:

```bash
./dev.sh
```

Or run individually:

- Backend: see `backend/README.md`
- Frontend: see `frontend/README.md`

## More Docs

- `requirements.md` for feature requirements
- `data-model-design.md` for the full data model
- `DEPLOYMENT.md` for deployment steps
- `DEPLOYMENT_STATUS.md` for live URLs
