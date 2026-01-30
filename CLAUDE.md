# Claude Context - Ultimate Frisbee Stats App

## Project Overview
A PWA for tracking ultimate frisbee statistics, optimized for mobile use on the sidelines during games.

**Tech Stack:**
- Backend: FastAPI + SQLAlchemy + PostgreSQL (Supabase in production, SQLite locally)
- Frontend: React + TypeScript + Material UI + TanStack Query
- Testing: Pytest (backend), Vitest + MSW + React Testing Library (frontend)
- **Deployment**: Railway (backend) + Vercel (frontend) + Supabase (database)

**Key Documentation:**
- `requirements.md` - Full requirements for Phases 4-8
- `data-model-design.md` - Complete data model (9 entities)
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend architecture
- `LOGGING.md` - Backend logging guide for production debugging
- `DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_STATUS.md` - Current deployment status and live URLs

## Current Status

**Phase 8 (In Progress)** - Statistics implementation:
- **Live Player Statistics**: Real-time player statistics with offense/defense breakdown ✅
  - Backend API: GET /statistics/games/{game_id}/live
  - Returns: points_played, effective_time_seconds, offense breakdown, defense breakdown
  - **Offense**: points_played, points_won, points_lost, win_rate, points_won_no_turnover, clean_point_rate
    - clean_point_rate = percentage of won points without any turnovers
  - **Defense**: points_played, points_won, points_lost, win_rate, points_with_turnover, turnover_rate, points_lost_no_turnover
    - points_with_turnover = points where we forced opponent to turn it over (got a "D")
    - turnover_rate = percentage of defensive points where we forced a turnover
  - Frontend: Integrated into GameDetailPage player roster section
  - 5-second polling for started games, one-time fetch for ended games
  - Sorting: by name/points/time with persistent selection
  - Visual highlighting: Top 20% (green) and bottom 20% (orange) based on playing time
  - Mobile-first 2-column card layout
- **Team Statistics**: Game-level offense/defense efficiency metrics ✅
  - Backend API: GET /statistics/games/{game_id}/team
  - Returns: offense stats (win_rate, clean_point_rate, break_rate), defense stats (win_rate, turnover_rate, clean_break_rate, hold_rate)
  - Turnover attribution logic: Possession tracking based on starting_on_offense + turnover sequence
  - Only completed points counted
  - 40 comprehensive backend tests (380 total passing)

**Phase 7 Complete** - Calls & Turnovers tracking fully integrated frontend + backend:
- **Data Model**: Team → Competition → Game → Point hierarchy with 9 entities (teams, players, competitions, games, points, lines, strategies, calls, turnovers)
- **Backend**: Complete REST API for all entities including calls/turnovers, SQLite with foreign keys, domain-organized code structure, production logging
- **Frontend**: Full CRUD interfaces for all entities, statistics dashboard, mobile-first design, comprehensive test coverage, full i18n support
- **Point Tracking**: 4-status workflow (ready→running→scored→completed), ABBA gender rule enforcement, pull tracking, strategy selection, resume functionality
- **Call Tracking**: Record call start/resume with elapsed time display, pending call blocks point finish, dead time calculation ready for statistics
- **Turnover Tracking**: Record turnovers with optional player assignment, automatic possession tracking, displays turnover sequence with elapsed time
- **Statistics Dashboard**: Game-level team and player statistics with offense/defense breakdown, clean points tracking, forced turnovers, win rates, circular progress indicators, tooltips on all stat columns, sortable player table
- **UI**: Navy/sky blue theme (#1e3a8a → #38bdf8), consistent card design, responsive layouts, elapsed time display (MM:SS from point start)
- **i18n**: React-i18next with 10 translation namespaces (common, navigation, teams, players, competitions, games, points, lines, strategies, statistics), language selector in AppBar, sport terms stay in English per GLOSSARY.md
- **Logging**: Essential logs for production debugging (errors, key operations, lifecycle events) - see LOGGING.md

**Key Features:**
- Competition & roster management with gender field (M/W)
- Game lifecycle (ready/started/ended) with player selection
- Line management (pre-defined player groups like O-line, D-line)
- Live point tracking with 7-player selection, ABBA alternating mixity (4M+3W ↔ 3M+4W)
- Strategy management (offense/defense plays)
- Pull tracking (inbound/out of bounds)
- Point comments and resume functionality for late calls
- **Call tracking**: Record calls with start/resume timestamps, display call duration, prevent finishing point with pending calls
- **Turnover tracking**: Record turnovers with player assignment, automatic possession calculation, display turnover history
- **Live player statistics**: Real-time player stats (points played, effective playing time) with visual highlighting for rotation management
- **Team statistics**: Game-level offense/defense efficiency metrics (win rates, clean point rates, break rates, turnover rates)
- French/English language switching with localStorage persistence

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── shared/       # Reusable UI components (PageHeader, LoadingState, ErrorState)
│   ├── {domain}/     # Domain-organized components (teams, players, games, points, etc.)
│   └── modals/       # All dialogs and modals
├── pages/            # Route pages (HomePage, TeamsPage, GameDetailPage, etc.)
├── services/         # API layer (one file per entity)
├── types/            # TypeScript types matching backend schemas
└── test/
    ├── mocks/        # MSW handlers for API mocking
    └── test-utils.tsx
```

### Backend Structure
```
backend/app/
├── models/      # SQLAlchemy models (domain-organized)
├── schemas/     # Pydantic schemas (domain-organized)
├── crud/        # Database operations (one file per entity)
├── routers/     # API endpoints (one file per entity)
└── tests/       # Pytest tests (test_crud/ and test_api/)
```

### Design System
- **Theme**: Semantic color system with centralized theme in `App.tsx` and `test-utils.tsx`
  - **Offense**: Navy (#1e3a8a main, #3b82f6 light, #1e40af dark)
  - **Defense**: Sky blue (#0ea5e9 main, #38bdf8 light, #0284c7 dark)
  - **Men**: Navy (#1e3a8a, same as offense)
  - **Women**: Sky blue (#38bdf8, same as defense.light)
  - **Gradients**: Primary gradient (navy → sky blue) for visual elements
  - **Architecture**: Theme extended via both `@mui/material/styles` and `@mui/system` module augmentation for full sx prop support
  - **Zero hardcoded colors** in component files - all use `theme.colors.*` or `theme.gradients.*`
- **Components**: Material UI v7 (Button, Card, Dialog, TextField, etc.)
- **Responsive**: Mobile-first using MUI breakpoints
- **Icons**: @mui/icons-material (FlashOn for offense, Shield for defense, Language for language selector)
- **Type Safety**: TypeScript throughout with strict mode
- **i18n**: react-i18next with 10 namespaces, language selector with 🇬🇧/🇫🇷 flags

### Testing
- **Backend**: Pytest with comprehensive CRUD and API coverage (357 tests - 100% passing)
- **Frontend**: Vitest + MSW + React Testing Library (266 tests - 100% passing)
- **i18n Testing**: i18n mock in test-utils ensures tests use English translations
- **Philosophy**: Test meaningful scenarios and edge cases, not chasing coverage metrics
- **Organization**: Tests in `__tests__/` subdirectories

## Next Steps

**Phase 8: Statistics Dashboard - IN PROGRESS**
- ✅ Game-level statistics backend (team + player stats with offense/defense breakdown)
- ✅ Frontend dashboard at `/statistics/games/:gameId` with complete team and player statistics display
- 🔄 Competition-level aggregations (team + player stats across all games in competition)
- Team-level (all-time) aggregations
- Advanced visualizations and charts
- Export/sharing capabilities

## Important Commands

### Backend
```bash
cd backend
source venv/bin/activate
pytest tests/ -v                    # Run all 380 tests (100% passing ✅)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev                         # Starts on http://localhost:5173/
npm test                            # Run all 266 tests (100% passing ✅)
npm run test:coverage               # Run tests with coverage report
npm run build                       # Production build
```

## Key Files to Know

### Backend
- `backend/app/database.py` - SQLite config with foreign key enforcement
- `backend/app/logging_config.py` - Logging configuration for production debugging
- `backend/app/main.py` - FastAPI app with global exception handler and lifecycle logging
- `backend/app/models/` - SQLAlchemy models organized by domain (base, team, competition, player, game, point, line, strategy, call, turnover)
- `backend/app/schemas/` - Pydantic schemas organized by domain (enums, team, competition, player, game, point, line, strategy, call, turnover)
- `backend/app/crud/` - CRUD operations organized by domain (teams, competitions, players, games, points, lines, strategies, calls, turnovers)
- `backend/app/routers/` - API endpoints organized by domain (teams, competitions, players, games, points, lines, strategies, calls, turnovers)
- `backend/tests/` - 380 comprehensive tests (CRUD + API)
- `backend/README.md` - Comprehensive backend documentation

### Frontend
- `frontend/src/App.tsx` - Root with MUI theme (semantic colors, custom gradients), React Router, TanStack Query, I18nextProvider
- `frontend/src/theme.d.ts` - TypeScript module augmentation for theme extensions (@mui/material/styles + @mui/system for sx prop support)
- `frontend/src/pages/` - All page components with routes (including GameStatisticsPage)
- `frontend/src/components/` - Organized by domain (teams/, players/, games/, modals/)
- `frontend/src/components/Layout.tsx` - AppBar with language selector (🇬🇧/🇫🇷)
- `frontend/src/services/` - API layer matching backend endpoints
- `frontend/src/types/index.ts` - TypeScript types matching backend schemas
- `frontend/src/types/i18n.d.ts` - TypeScript types for i18next (CustomTypeOptions with resources)
- `frontend/src/locales/` - i18n translation files (~350 strings across 10 namespaces)
  - `index.ts` - i18n configuration (language detection, resources, fallback)
  - `en/` - 10 English translation files (common, navigation, teams, players, competitions, games, points, lines, strategies, statistics)
  - `fr/` - 10 French translation files (same structure)
- `frontend/src/test/mocks/handlers.ts` - MSW handlers for all endpoints
- `frontend/src/test/test-utils.tsx` - Test utilities with i18n mock (English only, zero test changes needed)
- `frontend/README.md` - Comprehensive frontend documentation with theme system, i18n guide
- `GLOSSARY.md` - Ultimate frisbee terms that stay in English (Pull, Turnover, Break, etc.)

## Known Issues

### Test Coverage Gaps (Phase 7 UI Improvements)
**What's tested ✅:**
- LivePointTracker basic functionality (10 tests)
- CallsList (13 tests)
- TurnoversList (15 tests)
- **PointEventsHistory component (19 tests)** - Comprehensive coverage including:
  - Event sorting/merging logic (calls + turnovers by timestamp)
  - Point start/scored event rendering (won/lost with correct icons)
  - Chronological ordering (most recent first)
  - Possession calculation for turnovers
  - Call rendering (pending vs resolved with duration)
  - Error states
- **GameStatisticsPage (8 tests)** - Comprehensive coverage including:
  - Game overview display (score, competition, team breakdown)
  - Team statistics with circular progress indicators
  - Player statistics table with sorting
  - Conditional rendering based on data availability
  - Stat value formatting (count + percentage)
  - Navigation and routing
- All 266 tests passing ✅

**What needs tests ⚠️:**
- **PointHistoryItem enhancements** - New collapsible chronology section not tested
- **LivePointTracker UI changes** - More Actions menu, chronology integration

**Note:** Core functionality is fully tested. Remaining gaps are minor UI integration points.

## User Preferences
- Clean, maintainable code with explanations of React/TypeScript concepts
- Modern, polished UI (Material UI)
- Frequent commits with clear messages
- **Wants to be challenged** - Push back, verify assumptions, think critically
- **Testing philosophy**: Write meaningful tests for core functionality and edge cases, not chasing coverage metrics
- **Documentation**: Proactively update CLAUDE.md when making significant changes

## Deployment

**Live URLs:**
- Frontend: https://ultimate-frisbee-stats.vercel.app
- Backend: https://ultimate-frisbee-stats-production.up.railway.app

**Architecture:**
- Railway auto-deploys backend on push to `main`
- Vercel auto-deploys frontend on push to `main`
- Supabase PostgreSQL with Transaction Pooler (port 6543)

**Key deployment fixes applied:**
- API services use shared `apiClient` with `VITE_API_BASE_URL`
- `vercel.json` rewrites for SPA routing
- `player_number` is `Optional[int]` in statistics schema for PostgreSQL compatibility

See `DEPLOYMENT.md` for setup guide and `DEPLOYMENT_STATUS.md` for current status.

## Development Notes
- Backend: Port 8000, SQLite locally (PostgreSQL in production via Supabase)
- Frontend: Port 5173, MUI v7 Grid API (use `size` prop, not `item`)
- Component patterns: Domain-organized, shared components extracted (e.g., AddPlayersModal, PlayerForm, StrategyForm)
- Active point polling: 5-second intervals with React Query
- Timezone: UTC with 'Z' suffix serialization
- ABBA mixity rule: Frontend validation logic (alternating 4M+3W ↔ 3M+4W)
- i18n: 10 namespaces (common, navigation, teams, players, competitions, games, points, lines, strategies, statistics), language detection with localStorage, sport terms stay in English
- Statistics dashboard: `/statistics/games/:gameId` route for team and player analytics
- **Theme System**: Semantic color architecture with zero hardcoded colors in components
  - All colors defined once in `App.tsx` (production) and `test-utils.tsx` (tests)
  - Components reference colors via `theme.colors.offense/defense/men/women` and `theme.gradients.*`
  - MUI theme properly extended via dual module augmentation for sx prop support
  - Strategy cards feature gradient borders using `theme.gradients.primary`
