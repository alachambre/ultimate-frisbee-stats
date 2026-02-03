# Claude Context - Ultimate Frisbee Stats App

## Project Overview
A PWA for tracking ultimate frisbee statistics, optimized for mobile use on the sidelines during games.

**App Name:** Monkey Statistics
**Branding:** Monkey team logo (red monkey with mountains) used as favicon, PWA icon, and iOS home screen icon
**Theme:** Navy blue (#1e3a8a) matching offense color scheme

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

**Phase 8 (Complete ✅)** - Statistics implementation:
- **Game Statistics Dashboard** at `/statistics/games/:id`: ✅
  - **Team Statistics Component** with circular progress indicators:
    - Offense: Hold rate, Clean Hold rate
    - Defense: Turnover rate, Break rate, Clean Break rate
    - Circular progress visualization with count/total display
    - Info tooltips explaining each metric
    - Conditional rendering (hidden when no completed points)
  - **Player Statistics Component** with responsive design:
    - Desktop: Sortable table with offense/defense tabs
    - Mobile: Card layout using PlayerStatsCard component
    - Mobile sort dropdown with context-aware options
    - Tab switching with proper sort state management
    - Modular architecture: CircularStat, TeamStatistics, PlayerStatistics
  - **CSV Export Functionality**:
    - Dedicated csvExport utility (~230 lines)
    - Exports all game data: team stats, player stats, point details, calls, turnovers
    - Sanitized filenames (TeamName_vs_OpponentName_statistics.csv)
    - Fully tested with dedicated test file
- **Live Player Statistics**: Real-time player statistics integrated into GameDetailPage ✅
  - Backend API: GET /statistics/games/{game_id}/live
  - 5-second polling for started games, one-time fetch for ended games
  - Visual highlighting: Top 20% (green) and bottom 20% (orange) based on playing time
- **Team Statistics**: Game-level offense/defense efficiency metrics including pull statistics ✅
  - Backend API: GET /statistics/games/{game_id}/team
  - Turnover attribution logic with possession tracking
  - **Pull Statistics**: Inbound rate tracking (total_pulls, inbound_pulls, out_of_bounds_pulls, inbound_rate) - integrated into defense stats
  - 38 comprehensive backend tests (370 total passing)
- **Strategy Statistics**: Per-strategy performance tracking ✅
  - Backend API: GET /statistics/games/{game_id}/strategies
  - **Offense Strategy Stats**: Hold rate, clean holds (0 turnovers), quick scores (<90s), per strategy
  - **Defense Strategy Stats**: Break rate, turnover rate (forced turnovers), per strategy
  - 7 CRUD tests + 4 API tests = 11 comprehensive tests
  - Only counts completed points with assigned strategies
- **Code Refactoring**:
  - GameStatisticsPage reduced from 726 → 178 lines (75% reduction)
  - Extracted 3 reusable components + CSV utility
  - Improved maintainability and component reusability

**Phase 7 Complete** - Calls & Turnovers tracking fully integrated frontend + backend:
- **Data Model**: Team → Competition → Game → Point hierarchy with 9 entities (teams, players, competitions, games, points, lines, strategies, calls, turnovers)
- **Backend**: Complete REST API for all entities including calls/turnovers, SQLite with foreign keys, domain-organized code structure, production logging
- **Frontend**: Full CRUD interfaces for all entities, statistics dashboard, mobile-first design, comprehensive test coverage, full i18n support
- **Point Tracking**: 4-status workflow (ready→running→scored→completed), flexible player selection, pull launch timing, ABBA gender rule enforcement, pull tracking, strategy selection, resume functionality
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
- **Team statistics**: Game-level offense/defense efficiency metrics (win rates, clean point rates, break rates, turnover rates, pull success rates)
- **Strategy statistics**: Per-strategy performance tracking (hold/break rates, clean points, quick scores, turnover generation)
- **Mobile-optimized UI**: Clean game detail page with centered layout, roster in dialog, minimal clutter
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
- **Backend**: Pytest with comprehensive CRUD and API coverage (371 tests - 100% passing)
- **Frontend**: Vitest + MSW + React Testing Library (291 tests - 100% passing)
- **i18n Testing**: i18n mock in test-utils ensures tests use English translations
- **Philosophy**: Test meaningful scenarios and edge cases, not chasing coverage metrics
- **Organization**: Tests in `__tests__/` subdirectories

## Next Steps

**Point Lifecycle Refactor - COMPLETE ✅**
Both backend and frontend implementation complete!

**New Workflow:**
Points now support flexible player selection and timer start, matching real-world game flow:
```
ready → running → scored → completed
```

1. **Create Point** (status = `ready`)
   - Select: Offense/Defense (pre-selected based on previous point result)
   - Player selection optional (can be done later)
   - Timer NOT started (start_datetime = NULL)
   - Point number assigned

2. **While `ready`** (before launching pull)
   - Select/change players (requires exactly 7 with valid ABBA gender ratio)
   - Update strategy, comments, field metadata

3. **Launch Pull** (ready → running transition)
   - Update status to `running` via PUT /points/{id}
   - Backend auto-sets `start_datetime = now()` (timer starts)

4. **While `running`**
   - Timer running, can still modify players
   - Record calls, turnovers, etc.

5. **Complete Point** (scored → completed)
   - Backend validation: Requires exactly 7 players
   - Returns 400 error if player count ≠ 7

**Backend Changes (Complete ✅):**
- ✅ `PointCreate.player_ids` now optional (defaults to None)
- ✅ Points created with `status='ready'`, `start_datetime=None`
- ✅ Auto-set `start_datetime` on ready→running transition
- ✅ Validate 7 players only on completion (not creation)
- ✅ New endpoint: `GET /points/games/{game_id}/active` (finds ready OR running point)
- ✅ 371 backend tests passing

**Frontend Changes (Complete ✅):**
- ✅ `StartPointDialog`: No player selection, offense/defense pre-selected based on previous point
- ✅ "Launch Pull" button in `LivePointTracker` (when status='ready')
- ✅ `ManagePlayersDialog`: New mobile-first player selection with tabs, line filter, ABBA validation
  - Gender-separated tabs (Men/Women) with colored indicators
  - Selected players shown as chips (deletable)
  - Line filter dropdown to narrow player list
  - Strict validation: exactly 7 players with correct ABBA gender ratio
  - Selected players sorted by gender then name
- ✅ `CompletePointDialog`: Shows validation error if < 7 players
- ✅ Proper query key management (`activePoint` instead of `runningPoint`)

**TODO - Player Selection UI:**
- ✅ **Tests complete** for `ManagePlayersDialog` - 26 comprehensive tests covering pre-selection, validation, gender tabs, player toggling
- 🔄 **Reuse player selection UI**: The new `ManagePlayersDialog` should be reused in other places where we select players (e.g., line management, game roster selection)

**Phase 8: Statistics Dashboard - COMPLETE ✅**
- ✅ Game-level statistics backend (team + player stats with offense/defense breakdown)
- ✅ Frontend dashboard at `/statistics/games/:gameId` with complete team and player statistics display
- ✅ CSV export functionality with comprehensive data export
- ✅ Mobile-responsive design with card view and sort dropdown
- ✅ Component refactoring (GameStatisticsPage: 726 → 178 lines)
- ✅ Reusable statistics components (CircularStat, TeamStatistics, PlayerStatistics)

**Future Enhancements:**
- Competition-level aggregations (team + player stats across all games in competition)
- Team-level (all-time) aggregations
- Advanced visualizations and charts
- Additional export formats

## Important Commands

### Backend
```bash
cd backend
source venv/bin/activate
pytest tests/ -v                    # Run all 371 tests (100% passing ✅)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev                         # Starts on http://localhost:5173/
npm test                            # Run all 291 tests (100% passing ✅)
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
- `frontend/src/pages/GameStatisticsPage.tsx` - Refactored statistics dashboard (178 lines, 75% reduction)
- `frontend/src/components/` - Organized by domain (teams/, players/, games/, modals/, statistics/)
- `frontend/src/components/statistics/` - Statistics components:
  - `CircularStat.tsx` - Reusable circular progress indicator (~99 lines)
  - `TeamStatistics.tsx` - Team offense/defense stats (~98 lines)
  - `PlayerStatistics.tsx` - Player stats with mobile/desktop views (~430 lines)
  - `PlayerStatsCard.tsx` - Mobile card layout for player stats
- `frontend/src/components/Layout.tsx` - AppBar with language selector (🇬🇧/🇫🇷)
- `frontend/src/utils/csvExport.ts` - CSV export utility (~230 lines)
- `frontend/src/utils/__tests__/csvExport.test.ts` - CSV export tests
- `frontend/src/services/` - API layer matching backend endpoints
- `frontend/src/types/index.ts` - TypeScript types matching backend schemas
- `frontend/src/types/i18n.d.ts` - TypeScript types for i18next (CustomTypeOptions with resources)
- `frontend/src/locales/` - i18n translation files (~350 strings across 10 namespaces)
  - `index.ts` - i18n configuration (language detection, resources, fallback)
  - `en/` - 10 English translation files (common, navigation, teams, players, competitions, games, points, lines, strategies, statistics)
  - `fr/` - 10 French translation files (same structure)
- `frontend/src/test/mocks/handlers.ts` - MSW handlers for all endpoints
- `frontend/src/test/test-utils.tsx` - Test utilities with i18n mock (English only, zero test changes needed)
- `frontend/index.html` - App entry point with Monkey branding (title, favicon, manifest)
- `frontend/public/monkey-logo.png` - Monkey team logo (1024x1024)
- `frontend/public/manifest.json` - PWA manifest with Monkey branding
- `frontend/README.md` - Comprehensive frontend documentation with theme system, i18n guide
- `GLOSSARY.md` - Ultimate frisbee terms that stay in English (Pull, Turnover, Break, etc.)

## Known Issues

### Test Coverage (Phase 7 UI Improvements + Point Lifecycle Refactor)
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
- **ManagePlayersDialog (26 tests)** - Comprehensive coverage including:
  - Pre-selection of players from point.players
  - Gender tab switching (Men/Women)
  - Player selection/deselection with state updates
  - Validation (7 players required, valid gender ratios 4M+3W or 3M+4W)
  - Line filtering dropdown
  - Empty states (no men/women available)
  - Dialog actions (save enabled/disabled, cancel)
- **CSV Export (1 test)** - Comprehensive test covering:
  - Export of all game data sections
  - Blob creation and download handling
  - CSV content validation
- All 291 tests passing ✅

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
- **Test builders**: ALWAYS use test builders from `tests/builders/` for new tests. Existing tests can be refactored to use builders over time as we work on them.
  - Simple entity builders: `TeamBuilder`, `CompetitionBuilder`, `GameBuilder`, `PlayerBuilder`, `StrategyBuilder`, `LineBuilder`
  - Complex scenario builders: `GameScenarioBuilder` (complete game scenarios), `PointBuilder` (fine-grained point control)
  - See refactored files for examples: `test_strategy_statistics.py`, `test_teams.py`, `test_players.py`
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
- **Pre-commit Hooks**: Husky + lint-staged automatically runs on commit
  - ESLint with auto-fix (`eslint --fix`)
  - TypeScript type checking (`tsc --noEmit`)
  - Catches linting/type errors before deployment
- **Dialog Form State Pattern**: NEVER use useEffect to sync state from props
  - ✅ **Correct**: Initialize state directly from props: `useState(point.comments || "")`
  - ✅ **Correct**: Use `key` prop on dialog to force remount: `<AddCommentDialog key={point.id} point={point} />`
  - ❌ **Wrong**: Using useEffect to sync state causes `react-hooks/set-state-in-effect` errors
  - **Why**: The `key` prop forces component remount when the entity changes, naturally resetting all state
  - **Examples**: AddCommentDialog, SelectStrategyDialog, EditPointDialog - all use `key={point.id}`
  - **Rule**: This pattern applies to ALL form dialogs editing a single entity
- **Code Sharing Principle**: Extract shared logic into utilities to avoid duplication
  - ✅ **Correct**: Create shared utility functions when the same logic appears in multiple places
  - ✅ **Example**: `getPlayerHighlight()` in `utils/playerHighlighting.ts` used by both GameDetailPage and ManagePlayersDialog
  - ❌ **Wrong**: Duplicating identical or nearly-identical logic across components
  - **When to share**: Business logic, calculations, data transformations, validation rules, formatting functions
  - **When to duplicate**: Component-specific rendering logic, one-off operations, or when abstraction adds unnecessary complexity
  - **Benefits**: Single source of truth, easier maintenance, consistent behavior, reduced bugs