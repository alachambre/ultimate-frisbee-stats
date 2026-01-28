# Claude Context - Ultimate Frisbee Stats App

## Project Overview
A PWA for tracking ultimate frisbee statistics, optimized for mobile use on the sidelines during games.

**Tech Stack:**
- Backend: FastAPI + SQLAlchemy + SQLite
- Frontend: React + TypeScript + Material UI + TanStack Query
- Testing: Pytest (backend), Vitest + MSW + React Testing Library (frontend)

**Key Documentation:**
- `requirements.md` - Full requirements for Phases 4-8
- `data-model-design.md` - Complete data model (9 entities)
- `backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend architecture
- `LOGGING.md` - Backend logging guide for production debugging

## Current Status

**Phase 7 Complete** - Calls & Turnovers tracking fully integrated frontend + backend:
- **Data Model**: Team → Competition → Game → Point hierarchy with 9 entities (teams, players, competitions, games, points, lines, strategies, calls, turnovers)
- **Backend**: Complete REST API for all entities including calls/turnovers, SQLite with foreign keys, domain-organized code structure, production logging
- **Frontend**: Full CRUD interfaces for all Phase 7 entities, mobile-first design, comprehensive test coverage, full i18n support
- **Point Tracking**: 4-status workflow (ready→running→scored→completed), ABBA gender rule enforcement, pull tracking, strategy selection, resume functionality
- **Call Tracking**: Record call start/resume with elapsed time display, pending call blocks point finish, dead time calculation ready for statistics
- **Turnover Tracking**: Record turnovers with optional player assignment, automatic possession tracking, displays turnover sequence with elapsed time
- **UI**: Navy/sky blue theme (#1e3a8a → #38bdf8), consistent card design, responsive layouts, elapsed time display (MM:SS from point start)
- **i18n**: React-i18next with 9 translation namespaces (common, navigation, teams, players, competitions, games, points, lines, strategies), language selector in AppBar, sport terms stay in English per GLOSSARY.md
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
- **Theme**: Navy (#1e3a8a) to sky blue (#38bdf8) gradient, centralized in `App.tsx`
- **Components**: Material UI v7 (Button, Card, Dialog, TextField, etc.)
- **Responsive**: Mobile-first using MUI breakpoints
- **Icons**: @mui/icons-material (FlashOn for offense, Shield for defense, Language for language selector)
- **Type Safety**: TypeScript throughout with strict mode
- **i18n**: react-i18next with 9 namespaces, language selector with 🇬🇧/🇫🇷 flags

### Testing
- **Backend**: Pytest with comprehensive CRUD and API coverage (343 tests - 100% passing)
- **Frontend**: Vitest + MSW + React Testing Library (239 tests - 100% passing)
- **i18n Testing**: i18n mock in test-utils ensures tests use English translations
- **Philosophy**: Test meaningful scenarios and edge cases, not chasing coverage metrics
- **Organization**: Tests in `__tests__/` subdirectories

## Next Steps

**Phase 8: Statistics Dashboard - NEXT**
- Game/competition/team/player analytics
- Offense/defense efficiency metrics
- Player playing time tracking (using call data for dead time calculation)
- Turnover statistics per player
- Possession statistics and flow
- Point duration analysis
- Visualizations and charts
- Export/sharing capabilities

## Important Commands

### Backend
```bash
cd backend
source venv/bin/activate
pytest tests/ -v                    # Run all 343 tests (100% passing ✅)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev                         # Starts on http://localhost:5173/
npm test                            # Run all 239 tests (100% passing ✅)
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
- `backend/tests/` - 343 comprehensive tests (CRUD + API)
- `backend/README.md` - Comprehensive backend documentation

### Frontend
- `frontend/src/App.tsx` - Root with MUI theme (custom gradients), React Router, TanStack Query, I18nextProvider
- `frontend/src/theme.d.ts` - TypeScript declarations for theme extensions (gradients)
- `frontend/src/pages/` - All page components with routes
- `frontend/src/components/` - Organized by domain (teams/, players/, games/, modals/)
- `frontend/src/components/Layout.tsx` - AppBar with language selector (🇬🇧/🇫🇷)
- `frontend/src/services/` - API layer matching backend endpoints
- `frontend/src/types/index.ts` - TypeScript types matching backend schemas
- `frontend/src/types/i18n.d.ts` - TypeScript types for i18next (CustomTypeOptions with resources)
- `frontend/src/locales/` - i18n translation files (~300 strings across 9 namespaces)
  - `index.ts` - i18n configuration (language detection, resources, fallback)
  - `en/` - 9 English translation files (common, navigation, teams, players, competitions, games, points, lines, strategies)
  - `fr/` - 9 French translation files (same structure)
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
- All 239 existing tests passing

**What needs tests ⚠️:**
- **PointEventsHistory component** - New unified chronology component (zero tests)
  - Event sorting/merging logic (calls + turnovers by timestamp)
  - Point start/scored event rendering
  - Chronological ordering (most recent first)
- **PointHistoryItem enhancements** - New collapsible chronology section not tested
- **LivePointTracker UI changes** - More Actions menu, chronology integration

**Note:** All existing functionality still works (239 tests passing). These are new features without dedicated test coverage yet.

## User Preferences
- Clean, maintainable code with explanations of React/TypeScript concepts
- Modern, polished UI (Material UI)
- Frequent commits with clear messages
- **Wants to be challenged** - Push back, verify assumptions, think critically
- **Testing philosophy**: Write meaningful tests for core functionality and edge cases, not chasing coverage metrics
- **Documentation**: Proactively update CLAUDE.md when making significant changes

## Development Notes
- Backend: Port 8000, SQLite database recreated when models change (no migrations)
- Frontend: Port 5173, MUI v7 Grid API
- Component patterns: Domain-organized, shared components extracted (e.g., AddPlayersModal, PlayerForm, StrategyForm)
- Active point polling: 5-second intervals with React Query
- Timezone: UTC with 'Z' suffix serialization
- ABBA mixity rule: Frontend validation logic (alternating 4M+3W ↔ 3M+4W)
- i18n: 9 namespaces (common, navigation, teams, players, competitions, games, points, lines, strategies), language detection with localStorage, sport terms stay in English
