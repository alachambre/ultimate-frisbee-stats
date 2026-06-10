# Codex Agent Context - Ultimate Frisbee Stats App

## Project Overview
A PWA for tracking ultimate frisbee statistics, optimized for mobile use on the sidelines during games.

**App Name:** Monkey Statistics
**Branding:** Monkey Statistics uses the monkey emoji/text mark in-app and a lightweight generic app icon in the PWA shell
**Theme:** Navy blue (#1e3a8a) matching offense color scheme

## Tech Stack
- Backend: FastAPI + SQLAlchemy + PostgreSQL (Supabase in production, SQLite locally)
- Frontend: React + TypeScript + Material UI + TanStack Query + Chart.js (game trends and statistics evolution)
- Testing: Pytest (backend), Vitest + MSW + React Testing Library (frontend)
- Deployment: Render (backend) + Vercel (frontend) + Supabase (database)

## Key Documentation
- `requirements.md` - Requirements for Phases 4-8
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend architecture
- `LOGGING.md` - Backend logging guide
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT_STATUS.md` - Current deployment status and live URLs

## Local Agent Tooling
- Project skills live under `skills/<skill-name>/SKILL.md` and should stay concise, with detailed local pointers in `references/links.md`.
- Codex subagent definitions live under `agents/<agent-name>.toml`; they should name the skill they use in `developer_instructions`.
- Use `python3 scripts/launch_installer.py` for the local web installer, after `python3 -m pip install -r scripts/requirements.txt` if Flask is missing.
- Use `python3 scripts/install_agent_tools.py --scope project` for direct CLI installation into ignored local folders `.agents/skills/` and `.codex/agents/`.
- Use `--scope user` only when the definitions should be available outside this repository.
- When adding or changing a durable workflow convention, update the relevant skill and this file if the convention should affect future agents.

## Architecture (High Level)
**Frontend**
- `frontend/src/components/` default/shared domain-organized components + `shared/` + `modals/`
- `frontend/src/pages/` default route pages
- `frontend/src/legacy-ui/` legacy route tree, pages, and components that are clearly old-UI-only; when ownership is uncertain, keep the component in the default/shared root folders
- `frontend/src/services/` API layer (per-entity)
- `frontend/src/types/` TypeScript schemas
- `frontend/src/test/` MSW + test utils
- Route pages outside the landing shell are lazy-loaded from `frontend/src/App.tsx`; preserve route-level code splitting for heavier screens instead of reintroducing eager page imports
- Home page proactively pings backend `GET /health` to wake the Render free-tier service and show a cold-start/unavailable notice; preserve that lightweight check when refining landing-page UX
- Auth foundation lives under `frontend/src/auth/`; use the shared roles `public`, `team_member`, `team_analyst`, `admin` and capability helpers there instead of ad hoc UI checks
- Frontend auth API bootstrap entrypoint is `GET /auth/me`; auth consumption should build on that contract rather than duplicating role resolution logic client-side
- Frontend session bootstrap now flows through `AuthProvider` + Supabase Auth + `/auth/me`; keep `AuthProvider` inside `QueryClientProvider` so auth changes can invalidate React Query caches safely
- UI permission gating must respect rollout mode: only hide or block restricted surfaces when backend `enforcement_mode` is `enforced`; `off`/`shadow` should remain safe for incremental deploys
- In enforced mode, protected frontend routes should render an in-app permission notice instead of silently redirecting; use that pattern for future gated screens so users understand whether they need login, a higher role, or app provisioning
- Admin account management lives on `frontend/src/pages/AdminUsersPage.tsx` at `/admin/users`; keep that route strictly admin-only in the UI even before global enforcement is enabled so it matches the backend contract
- On public surfaces, avoid protected statistics queries when UI enforcement is active; for `team_member`, allow team/strategy/timeline statistics but gate player-statistics queries, player filters, and CSV exports before they fire
- Shared roster UI components live in `frontend/src/components/players/` (`RosterSummaryHeader`, `RosterGenderPanel`) and should be reused across team/competition/game roster sections
- Statistics UI entrypoint is `frontend/src/pages/StatisticsPage.tsx` on route `/statistics` (filter-driven workflow: `teamId`, multi-select `competitionIds`, multi-select `gameIds`, multi-select `playerIds`; keep legacy single-value `competitionId`, `gameId`, and `playerId` links backward-compatible when parsing). `team_member` users can access team and strategy statistics plus single-game timeline charts, but player filtering, the Players tab, and CSV export require analyst/export capabilities.
- Standalone games dashboard route is removed; games should be accessed via competition detail (`/competitions/:competitionId`)
- Statistics page layout is split into dedicated components under `frontend/src/components/statistics/`; legacy-only statistics wrappers live under `frontend/src/legacy-ui/components/statistics/`. Keep complex workflow UI out of page files when extending stats UX.
- Team statistics evolution table/controls are rendered by `frontend/src/components/statistics/StatisticsEvolutionTable.tsx`, with `StatisticsEvolutionChart.tsx` lazy-loaded from the Evolution tab; keep it driven by `/statistics/teams/{team_id}/evolution` metadata and default presets rather than duplicating formulas in the frontend.
- Turnover-type analytics in the statistics UI are rendered through `frontend/src/components/statistics/TurnoverTypeStatsSection.tsx` and reused in both `TeamStatistics` and `PlayerScopeStatistics`; extend that shared component instead of duplicating the 6-bucket breakdown in multiple places
- Defensive strategy cards in `frontend/src/components/statistics/StrategyStatistics.tsx` also reuse `TurnoverTypeStatsSection` for turnover-type breakdowns; keep strategy-specific turnover analytics scoped to defense strategies instead of introducing a separate visualization pattern
- Statistics data/query orchestration lives in `frontend/src/pages/hooks/useStatisticsPageData.ts`; keep `StatisticsPage.tsx` focused on composition/rendering
- Statistics UI exposes a manual refresh action for the current dataset and documents that analytical statistics may be cached for up to 5 minutes while live game state stays immediate
- Statistics supports dataset filtering by competitions/games plus player filtering: when `playerIds` is set, all stats are computed only on completed points containing every selected player
- Statistics player filter options are scope-aware: selected competitions/games restrict the list to the union of their rosters, and selected players further narrow options to teammates who shared at least one completed point in the current dataset
- Single-game statistics now include a lazy-loaded `Game trends` chart section fed by `/statistics/games/{game_id}/timeline`; keep chart-specific shaping in that timeline contract instead of piggybacking on game detail payloads
- `Game trends` and team evolution charts render through Chart.js + `react-chartjs-2`; keep chart-specific shaping in their dedicated statistics components instead of piggybacking on unrelated payloads
- Point history and statistics expose possession-based turnover totals as `our_turnovers` and `opponent_turnovers`; player turnover stats always mean on-field events, not individual attribution
- Halftime/end-of-game history recaps can aggregate turnover-type details from the public-safe `GET /games/{game_id}/turnovers` feed; prefer that game-level endpoint over point-by-point turnover fetches when enriching recap summaries
- Team and player statistics now also expose top-level `turnover_type_stats` with 6 buckets (`all_points`, `started_on_offense`, `started_on_defense` x `our_possession_turnovers` / `opponent_possession_turnovers`); keep turnover-type analytics in that shared contract instead of scattering ad hoc breakdown fields through offense/defense sections
- Defensive strategy statistics now expose `turnover_type_stats` with the same 6-bucket contract, allowing turnover-type breakdowns per defense strategy without inventing a parallel schema
- Statistics navigation should always target `/statistics` query params (legacy `/statistics/*/:id` routes are removed)
- Statistics UX pattern is filter-based: sticky team context + multi-select competition/game/player filters + active dataset summary chips; avoid reintroducing the old branch-navigation model
- Team roster cards on `TeamDetailPage` are click-to-edit; player statistics access is available from `EditPlayerModal` (team scope)
- Statistics export UI should expose CSV mode selection (`summary` vs `full`) and pass it to backend `detail` query param
- Live point interruption flow uses stoppages (`call`, `injury`, `timeout`, `other`) with type selection in the record dialog and type display in chronology/cards
- Live tracker empty state supports halftime recording (`Half time` button next to `Start Point`) and disables it once a halftime exists; halftime appears in the game history timeline and can be deleted from there
- Field side (`field_side`) selection happens on the first point of each half (game start + first point after halftime); other points auto-infer side by alternating from the previous completed point
- Live point tracker internals are split under `frontend/src/components/points/liveTracker/` (`LivePointHeader`, `LivePointActionBar`, `LivePointContextCards`, `useLivePointState`, `useLivePointMutations`); keep `LivePointTracker.tsx` as composition shell
- Live tracker polling is consolidated through public `GET /games/{game_id}/live-state` for active point, live turnovers, and live stoppages; prefer extending that payload over adding separate high-frequency live polling queries
- Game detail data loading is shared through `frontend/src/pages/hooks/useGameDetailPageData.ts`; default/shared game detail pieces stay under `frontend/src/components/games/detail/`, while legacy-only game header/score components live under `frontend/src/legacy-ui/components/games/detail/`
- Frontend stoppage API naming uses `frontend/src/services/stoppages.ts` and `queryKeys.stoppages`; legacy call aliases are removed
- Game scheduled date/time inputs and display use the browser's local timezone; convert through `frontend/src/utils/dateTimeLocal.ts` when sending to the API so persisted values stay UTC.
- UI sport wording must still follow `GLOSSARY.md`: use `stoppage` for the generic interruption concept, and keep `Call` in English when referring to the specific stoppage type

**Backend**
- `backend/app/models/`, `schemas/`, `crud/`, `routers/` (domain-organized)
- `backend/app/tests/` Pytest (CRUD + API)
- Auth foundation lives under `backend/app/auth/`; keep role and permission logic centralized there (`public`, `team_member`, `team_analyst`, `admin`)
- Backend auth rollout is controlled by `AUTH_ENFORCEMENT_MODE` with modes `off`, `shadow`, and `enforced`; prefer incremental deploys with `shadow` before enabling enforcement
- Public spectator payload redaction is centralized in `backend/app/auth/redaction.py`; when exposing anonymous-safe game/point/stoppage/turnover/halftime reads, reuse those serializers instead of hand-redacting fields in routers
- Backend route authorization uses `require_team_member` for operational/team-management surfaces and for team/strategy/timeline statistics, while player statistics and `/exports` require `require_team_analyst`; keep only the approved spectator reads public
- Backend user management endpoints live under `/users`, use `require_admin_strict`, and rely on Supabase Auth admin APIs through the service role key; keep those flows rollout-independent and backend-enforced
- App-level authenticated users are stored in the local `users` table and linked to Supabase Auth via `auth_user_id`
- First-admin bootstrap is env-driven through `INITIAL_ADMIN_AUTH_USER_ID` + `INITIAL_ADMIN_EMAIL` and runs idempotently on startup when configured
- Backend exposes public `GET /health` for lightweight readiness checks and frontend cold-start wake-up behavior; keep it fast and unauthenticated
- Backend exposes public `GET /games/{game_id}/turnovers` with the standard redaction rules so spectator-safe history/summary UI can aggregate turnover details without extra privileged stats endpoints
- Backend `GET /health` now performs a lightweight DB reachability check (`SELECT 1`) and returns `503` with `database=unreachable` when the app is up but the database is not reachable
- Game interruption model uses `Stoppage` (table `stoppages`) with `stoppage_type` values: `call`, `injury`, `timeout`, `other`
- Halftime tracking is a dedicated `Halftime` entity (`halftimes` table), one halftime max per game
- Statistics architecture: keep `statistics_queries.py` (data access), `statistics_calculations.py` (pure reducers/point facts), `statistics.py` (scope facade)
- Statistics read caching lives in `backend/app/statistics_cache.py`; keep permission checks before cache reads, use `STATISTICS_CACHE_TTL_SECONDS` (`0` disables), and broadly clear the cache after stats-affecting mutations
- Shared statistics dataset construction lives in `backend/app/crud/statistics_dataset.py`; use it when a statistics path needs filtered points plus related players, turnovers, stoppages, or strategies
- Statistics point queries support SQL-side `required_player_ids` filtering plus explicit relationship loading flags; avoid reintroducing Python-side player filtering for endpoint datasets
- Game list score payloads should use grouped score helpers in `backend/app/crud/games.py` instead of calling `get_game_score` inside loops
- CSV statistics exports are backend-owned via `/exports/*/csv` endpoints; frontend should only trigger download
- CSV export implementation is split by concern: `statistics_exports_formatters.py`, `statistics_exports_sections.py`, `statistics_exports_game.py`, `statistics_exports_competition.py`, `statistics_exports_team.py` (`statistics_exports.py` stays as facade)
- CSV exports support `detail=summary|full` query mode (default `summary`); keep summary format readable and stable
- Team defense stats contract does not expose `hold_rate`; use `break_rate`, `turnover_rate`, `clean_break_rate`, and pull stats
- Stats scope coverage target: game + competition + team for team/player/strategy statistics
- Team stats endpoints accept optional repeated `competition_ids`, `game_ids`, and `player_ids` query params so the statistics page can build filtered datasets without switching endpoint families; `player_ids` filtering is analyst-only when enforcement is active
- Team statistics evolution is exposed by `GET /statistics/teams/{team_id}/evolution`; keep metric definitions and per-game formulas backend-owned in `crud/statistics_evolution.py` and reuse the existing team stats reducers.
- Stats endpoints expose a single-game point timeline (`/statistics/games/{game_id}/timeline`) for chart visualizations such as point duration, score progression, and turns per point
- `crud/games.py:get_game_detail` must return explicit contract fields (no `__dict__` passthrough)
- Game `date` is a scheduled datetime stored as UTC in the DB/API contract; normalize incoming aware datetimes to UTC before persistence and serialize UTC values with `Z`.
- Supabase schema changes are SQL-migration-based (`supabase/migrations/`), not `create_all()` based

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
