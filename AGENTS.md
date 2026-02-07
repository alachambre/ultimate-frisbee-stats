# Codex Agent Context - Ultimate Frisbee Stats App

## Project Overview
A PWA for tracking ultimate frisbee statistics, optimized for mobile use on the sidelines during games.

**App Name:** Monkey Statistics
**Branding:** Monkey team logo (red monkey with mountains) used as favicon, PWA icon, and iOS home screen icon
**Theme:** Navy blue (#1e3a8a) matching offense color scheme

## Tech Stack
- Backend: FastAPI + SQLAlchemy + PostgreSQL (Supabase in production, SQLite locally)
- Frontend: React + TypeScript + Material UI + TanStack Query
- Testing: Pytest (backend), Vitest + MSW + React Testing Library (frontend)
- Deployment: Render (backend) + Vercel (frontend) + Supabase (database)

## Key Documentation
- `requirements.md` - Requirements for Phases 4-8
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend architecture
- `LOGGING.md` - Backend logging guide
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT_STATUS.md` - Current deployment status and live URLs

## Architecture (High Level)
**Frontend**
- `frontend/src/components/` domain-organized components + `shared/` + `modals/`
- `frontend/src/pages/` route pages
- `frontend/src/services/` API layer (per-entity)
- `frontend/src/types/` TypeScript schemas
- `frontend/src/test/` MSW + test utils
- Shared roster UI components live in `frontend/src/components/players/` (`RosterSummaryHeader`, `RosterGenderPanel`) and should be reused across team/competition/game roster sections
- Statistics UI entrypoint is `frontend/src/pages/StatisticsPage.tsx` on route `/statistics` (query-driven workflow: `teamId`, `mode=competition|player`, `competitionId`, `gameId`, `playerId`)
- Statistics page layout is split into dedicated components: `StatisticsConfigurationPanel`, `StatisticsSectionContainer`, and `StatisticsSelectionCard` under `frontend/src/components/statistics/`; keep complex workflow UI out of page files when extending stats UX
- Statistics data/query orchestration lives in `frontend/src/pages/hooks/useStatisticsPageData.ts`; keep `StatisticsPage.tsx` focused on composition/rendering
- Statistics navigation should always target `/statistics` query params (legacy `/statistics/*/:id` routes are removed)
- Statistics UX pattern is progressive: sticky team context + branch switch + selectable cards (competition/game/player) + clickable breadcrumb chips for upward navigation
- Team roster cards on `TeamDetailPage` are click-to-edit; player statistics access is available from `EditPlayerModal` (team scope)
- Statistics export UI should expose CSV mode selection (`summary` vs `full`) and pass it to backend `detail` query param

**Backend**
- `backend/app/models/`, `schemas/`, `crud/`, `routers/` (domain-organized)
- `backend/app/tests/` Pytest (CRUD + API)
- Statistics architecture: keep `statistics_queries.py` (data access), `statistics_calculations.py` (pure reducers/point facts), `statistics.py` (scope facade)
- CSV statistics exports are backend-owned via `/exports/*/csv` endpoints; frontend should only trigger download
- CSV exports support `detail=summary|full` query mode (default `summary`); keep summary format readable and stable
- Team defense stats contract does not expose `hold_rate`; use `break_rate`, `turnover_rate`, `clean_break_rate`, and pull stats
- Stats scope coverage target: game + competition + team for team/player/strategy statistics

## Design & UI System
- Material UI v7, mobile-first
- Semantic theme defined in `frontend/src/App.tsx` and `frontend/src/test/test-utils.tsx`
- **Zero hardcoded colors** in components; use `theme.colors.*` / `theme.gradients.*`
- i18n: react-i18next with 10 namespaces; sport terms stay in English (see `GLOSSARY.md`)

## Core Workflows & Rules
- **Point lifecycle**: `ready → running → scored → completed`
- **Dialog Form State Pattern**: NEVER use `useEffect` to sync state from props
  - ✅ Initialize state from props (`useState(point.comments || "")`)
  - ✅ Use `key={point.id}` on dialogs to force remount
- **Test Builders**: ALWAYS use builders from `tests/builders/` for new tests
  - Simple: `TeamBuilder`, `CompetitionBuilder`, `GameBuilder`, `PlayerBuilder`, `StrategyBuilder`, `LineBuilder`
  - Complex: `GameScenarioBuilder`, `PointBuilder`
- **Code Sharing**: Extract shared logic into utilities when repeated
  - Example: `utils/playerHighlighting.ts`
  - Player composition and ABBA validation helpers: `utils/playerComposition.ts`

## Important Commands
**Backend**
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**
```bash
cd frontend
npm run dev
npm test
npm run test:coverage
npm run build
```

## User Preferences
- Clean, maintainable code, following good practices (SOLID)
- Modern, polished UI (Material UI)
- Frequent commits with clear messages
- Wants to be challenged: push back, verify assumptions, think critically
- Testing philosophy: meaningful tests for core functionality and edge cases
- When working on the UI, run frontend tests (`frontend`: `npm test`) before reporting.
- Proactively update `AGENTS.md` when making significant changes
- Proactively suggest improvements: when working on some part of the code that could be improved, that are not very maintainable, that could lead to issues...

## Deployment Notes
- Render free tier cold start after ~15 minutes inactivity
- Frontend/Backend URLs in `DEPLOYMENT_STATUS.md`
