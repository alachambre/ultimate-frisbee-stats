# Claude Context - Ultimate Frisbee Stats App

## 📖 Key Documentation Files
**READ THESE FOR FULL CONTEXT:**
- **`requirements.md`** - Comprehensive requirements for Phases 4-8 (all features, user stories, business rules)
- **`data-model-design.md`** - Complete data model design with all 9 entities, relationships, constraints, and Q&A
- **`backend/README.md`** - Backend API documentation, architecture, endpoints
- **`frontend/README.md`** - Frontend architecture, component structure, testing

## Project Overview
Building a PWA for tracking ultimate frisbee statistics with:
- **Backend**: FastAPI + SQLAlchemy + SQLite (273 tests passing)
- **Frontend**: React + TypeScript + Material UI + TanStack Query (111 tests passing)
- **Primary Target**: Mobile devices (used on the sidelines during games)

## Current Status

### ✅ Completed Work

#### Backend (273 tests passing)
- ✅ Full CRUD for teams, competitions, players, games, points, lines, strategies
- ✅ SQLite foreign key constraints with cascade deletes
- ✅ Comprehensive test suite (273 tests passing - 100%)
- ✅ **Phase 3**: Point model with status (active/completed), start_datetime, end_datetime
- ✅ **Phase 3**: Live tracking endpoints (finish, cancel, get active point)
- ✅ **Phase 3**: Validation for one active point per game
- ✅ **Phase 4**: Competition model with hierarchy (Team → Competition → Game → Point)
- ✅ **Phase 4**: Player.gender field (M/W) for mixity validation
- ✅ **Phase 4**: Competition roster management (add/remove players)
- ✅ **Phase 4**: Refactored models.py and schemas.py into domain-organized directories
- ✅ **Phase 4**: 30 new competition tests (CRUD + API)
- ✅ **Phase 5**: Line model for user-defined player groups (O-line, D-line, etc.)
- ✅ **Phase 5**: Game model enhancements - 3-status lifecycle (ready/started/ended), comments field, player selection (M2M)
- ✅ **Phase 5**: 75 new tests (31 Line CRUD, 27 Line API, 17 enhanced Game tests)
- ✅ **Phase 5**: Full Line REST API with 8 endpoints, Game player management with 3 new endpoints
- ✅ **Phase 6**: Strategy model for named plays (offense/defense categories)
- ✅ **Phase 6**: Point model enhanced with 4-status lifecycle (ready→running→scored→completed)
- ✅ **Phase 6**: New Point fields: field_side, pull, strategy_id, comments
- ✅ **Phase 6**: 45 new tests (20 Strategy CRUD + 20 Strategy API + ~35 enhanced Point tests)
- ✅ **Phase 6**: Strategy REST API with 5 endpoints, GET /points/games/{id}/running endpoint
- ✅ **Phase 6**: Test refactoring - split test_points_api.py into 2 focused files (CRUD + tracking)
- ✅ **Phase 6**: Removed deprecated /active endpoint (no backward compat needed)
- ✅ **Enhanced API responses**: GET /teams returns TeamWithPlayers[], GET /competitions returns CompetitionWithTeam[]

#### Frontend - Phase 1: Team & Player Management
- ✅ Teams page with CRUD operations (fully tested)
- ✅ Team detail page with player management (fully tested)
- ✅ Clean component architecture:
  - Shared components: PageHeader, LoadingState, ErrorState
  - Domain components: teams/, players/
  - Modals organized in modals/ directory
- ✅ Material UI for all components
- ✅ Comprehensive test suite with MSW + React Testing Library
- ✅ AppBar navigation with active route highlighting

#### Frontend - Phase 2: Game Management ✅ COMPLETED
- ✅ Games list page with grid layout (GamesPage - fully tested)
- ✅ Game creation modal with team selection (CreateGameModal)
- ✅ Game detail page with scores and actions (GameDetailPage - fully tested)
- ✅ Edit game modal (EditGameModal)
- ✅ Finish game functionality (changes status from "In Progress" to "Finished")
- ✅ Delete game with confirmation dialog
- ✅ Game cards showing: opponent, date, score, status badges, team names
- ✅ Empty state components for games
- ✅ Full CRUD operations for games
- ✅ MSW mocks for all game endpoints
- ✅ Route: /games/:gameId for game details
- ✅ Components: GameCard, GamesGrid, EmptyGamesState

#### Frontend - Phase 3: Live Point Tracking 🎉 COMPLETE
- ✅ LivePointTracker - Main live tracking interface
- ✅ PointTimer - Real-time elapsed time (updates every second)
- ✅ PlayerSelector - Exactly 7 players selection UI
- ✅ StartPointDialog - Select players and start point
- ✅ FinishPointDialog - Mark point won/lost (fully tested)
- ✅ EditPointDialog - Edit timestamps and player lineup (fully tested)
- ✅ PointHistoryList & PointHistoryItem - View all points with strategic context
- ✅ Active point polling (5 second intervals with React Query)
- ✅ Integration in GameDetailPage
- ✅ MSW mocks for all point endpoints (start, finish, cancel, get active)
- ✅ Points service (services/points.ts) with full CRUD
- ✅ **Bug Fixes Applied:**
  - Fixed timezone handling - datetimes now properly serialized with 'Z' suffix
  - Fixed duration_seconds computation with @computed_field decorator
  - Fixed EditPointDialog prop mismatch (players vs allPlayers)
- ✅ **Mobile-First UI Enhancements:**
  - Point cards with offense/defense icons (Sports/Shield)
  - Strategic context badges: "Break!" (win on defense), "Broken" (lose on offense)
  - Responsive action buttons (icon-only on mobile, full text on desktop)
  - Points ordered descending (most recent first)
  - Clean mobile layout optimized for sideline use

#### Frontend - Phase 4: Competition & Player Gender 🎉 COMPLETE
- ✅ **Competition Management:**
  - CompetitionsPage with grid layout and create button (fully tested)
  - CompetitionDetailPage showing roster and games (fully tested)
  - CreateCompetitionModal with team selection, name, description, dates (fully tested)
  - EditCompetitionModal with status field (ongoing/completed) (fully tested)
  - AddPlayersToRosterModal with enhanced UX (fully tested):
    - Real-time selection counter with gender breakdown
    - Quick actions: Select All, Clear All, All Men, All Women
    - Search/filter by name or number
    - Gender-based grouping with visual badges
    - Alphabetically sorted player lists
  - CompetitionCard, CompetitionsGrid, EmptyCompetitionsState components
  - Full CRUD operations via competitions service
  - Roster management: Add players to roster, remove players from roster with confirmation
  - PlayerCard supports both edit mode (team page) and delete mode (competition roster)
  - All player lists sorted alphabetically throughout the app
- ✅ **Player Gender Field:**
  - Added gender field (M/W) to AddPlayerModal and EditPlayerModal
  - Gender displayed split by section (removed individual chips)
  - Team and competition detail pages show players in two columns (Men/Women)
  - Updated all player mocks and tests to include gender
- ✅ **Game Structure Update:**
  - Games now use competition_id instead of team_id
  - CreateGameModal accepts optional competitionId prop
  - Updated GameDetailPage to fetch competition.players for point tracking
  - Updated all game tests to create competition first
- ✅ **Navigation & Routes:**
  - Added /competitions and /competitions/:id routes
  - Hamburger menu for mobile navigation (drawer with gradient background)
  - Desktop: horizontal navigation buttons in AppBar
- ✅ **TypeScript & Build:**
  - All types updated (Gender enum, Competition types, updated Game/Player types)
  - MSW mocks updated for competition endpoints and new structure
  - Migrated to MUI v7 Grid API (removed deprecated GridLegacy)
  - All TypeScript compilation errors resolved
  - Production build passing

#### Frontend - Phase 5: Lines & Enhanced Game Management 🎉 COMPLETE
- ✅ **Line Management:**
  - Line types added (Line, LineCreate, LineUpdate, LineWithPlayers)
  - services/lines.ts with full CRUD API functions
  - All Line components: LineCard, LinesGrid, EmptyLinesState
  - CreateLineModal and EditLineModal for CRUD operations
  - LinesPage with team filter dropdown and delete confirmation (fully tested)
  - LineDetailPage with player management (add/remove players) (fully tested)
  - AddPlayersToLineModal for managing line players
  - Lines integrated into TeamDetailPage (no dedicated /lines route)
  - All player lists sorted alphabetically with gender-split display
- ✅ **Game Enhancements:**
  - GameStatus type updated (ready/started/ended) with 3-status lifecycle
  - Game types enhanced with comments field and player_ids
  - Game player selection UI (AddPlayersToGameModal) integrated in GameDetailPage
  - Game comments field in CreateGameModal and EditGameModal
  - 3-status game lifecycle buttons (Start Game, End Game) in GameDetailPage
  - All GameCard/GameDetailPage/LivePointTracker updated for new status values
- ✅ **Code Quality:**
  - Consolidated duplicate code: Generic AddPlayersModal component (~1000 lines saved)
  - Three "add players" modals now thin wrappers around generic component
  - MSW mocks for all 8 Line endpoints + 3 Game player management endpoints
  - POST /teams/:id/players handler added for test support
- ✅ **Filtering & UX:**
  - Team filter on LinesPage and CompetitionsPage
  - Cascading team+competition filters on GamesPage
  - Competitions sorted by start_date descending (newest first)
  - Collapsible player roster sections on TeamDetailPage
- ✅ **Testing:**
  - LinesPage tests (6/6 passing) - CRUD, filtering, navigation
  - LineDetailPage tests (6/6 passing) - player management, editing, gender-split
  - Enhanced GameDetailPage tests (10/10 passing) - player management, status lifecycle, finished game restrictions
  - StartPointDialog tests (9/9 passing) - line filtering, player selection, validation
  - All 111 frontend tests passing with comprehensive coverage
  - Production build passing, all TypeScript errors resolved

#### Frontend - UI/UX Enhancements 🎨 COMPLETE
- ✅ **Centralized Theme System:**
  - Custom theme configuration in App.tsx with navy/sky blue gradient (#1e3a8a → #38bdf8)
  - Theme extensions for gradients (primary, primaryReverse, light)
  - TypeScript declarations for theme augmentation (src/theme.d.ts)
  - All components use theme values (no hardcoded colors)
- ✅ **Consistent Card Design System:**
  - **Team cards**: Full-width layout with GroupIcon, gradient borders, hover effects
    - Displays player counts by gender (e.g., "2 Men, 3 Women")
  - **Competition cards**: Medium with EmojiEventsIcon, same visual style (3-column grid)
    - Shows team name chip alongside status
  - **Game cards**: Compact with competition name, team chip, opponent name (3-column grid)
  - All cards use border-box gradient technique for visual consistency
  - Smooth hover animations (translateY + theme-based shadows)
- ✅ **Status Consistency:**
  - "Ongoing" status: Green (success) for competitions and games
  - "Completed"/"Finished" status: Gray (default)
  - Unified status labeling across all entities
- ✅ **Mobile-First Improvements:**
  - Responsive PageHeader (vertical stack on mobile, horizontal on desktop)
  - Mobile-friendly EditPlayerModal button layout (vertical stack)
  - Fixed Grid overflow on mobile (added explicit horizontal padding)
  - Hamburger menu for mobile navigation
- ✅ **Visual Polish:**
  - Gradient AppBar with white text and subtle border
  - HomePage with gradient title and bordered cards
  - Gender-split player sections with Paper containers and colored borders (blue for men, pink for women)
  - Collapsible competition roster (default collapsed)
  - Point history with FlashOn icon for offense (lightning bolt), Shield for defense

### Latest Commits
```
6da553e - Improve EditPointDialog and LineCard UX (NEW - uncommitted to remote)
5f2e004 - Fix all remaining strategy tests and update documentation
2db6239 - Improve StartPointDialog UX and add Strategy Management UI
7db3290 - Fix Phase 6 frontend bugs and improve UX: Timer restart and comment workflow
b2580c8 - Implement Phase 6 frontend: Enhanced point tracking with 4-status workflow
```

### Recent Changes Summary (Committed)
- **Latest commit**: `6da553e` - Improve EditPointDialog and LineCard UX
  - EditPointDialog: ToggleButtons instead of radio buttons, section dividers, responsive Grid layout
  - LineCard: Removed edit/delete icons for cleaner UI (click card to navigate to detail)
  - 145 tests passing (down from 147 - removed 2 obsolete LineCard tests)

### Recent Changes Summary (Uncommitted)
- **Phase 6 Frontend: Enhanced Point Tracking & Strategy Management (COMPLETE) ✅**:
  - ✅ **4-Status Point Workflow**:
    - Ready → Running → Scored → Completed lifecycle
    - FinishPointDialog transitions to "scored" (not "completed")
    - New CompletePointDialog for scored→completed transition
    - Resume Point button for late calls/contested scores (scored→running)
    - Timer properly restarts when resuming a scored point (fixed)
    - Optimistic cache updates for smooth UI transitions (no flicker on resume)
  - ✅ **Strategy Management UI (COMPLETE)**:
    - StrategiesPage with full CRUD operations (create/edit/delete with confirmation)
    - Toggle button filters (All/Offense/Defense) with navy blue selection styling
    - CreateStrategyModal: Name, category (dropdown), optional description
    - EditStrategyModal: Edit all fields with existing values pre-filled
    - SelectStrategyDialog: Choose strategy during live point tracking (auto-filtered by offense/defense)
    - StrategyCard: Display with edit/delete buttons, color-coded icons (navy/sky blue)
    - StrategiesGrid, EmptyStrategiesState components
    - Strategy service layer (services/strategies.ts) with full CRUD exported from services/index.ts
    - Strategy selection in LivePointTracker (moved from StartPointDialog for better UX)
    - Strategy display in PointHistoryItem with blue chip
  - ✅ **Pull Tracking**:
    - Live buttons in LivePointTracker for defensive points only
    - Mark pull as Inbound or Out of Bounds during running point
    - Pull status displayed in PointHistoryItem
  - ✅ **Point Comments**:
    - AddCommentDialog for adding/editing comments during live point tracking
    - "Add Comment" / "Edit Comment" button in LivePointTracker
    - Comments moved from StartPointDialog to live tracking area for better UX
    - Display in PointHistoryItem
  - ✅ **Backend Fixes**:
    - Fixed timezone comparison error in update_point (datetime comparison)
  - ✅ **Code Quality**:
    - Simplified PointTimer conditional rendering (consolidated duplicate code)
    - Cleaned up unnecessary null checks in PointTimer component
    - Proper React key strategy for timer remounts (`${id}-${status}`)
  - ✅ **UX Improvements**:
    - StartPointDialog: Line filter now uses wrapping chip buttons (no horizontal scroll)
    - Player count moved to subtle inline format: "Select 7 Players (X/7: XM, XW)" with color-coded feedback
    - "Ongoing" status chips now blue (was green) for consistency
    - Offense/defense icons use gradient colors throughout (navy/sky blue)
    - FinishPointDialog cleaner UI (removed player list, offense/defense in title, color-coded toggle buttons)
  - ✅ **Testing**:
    - 147 frontend tests passing (29 new tests for Phase 6)
    - CompletePointDialog: 7 tests (new component)
    - FinishPointDialog: 7 tests (updated for toggle buttons and cleaner UI)
    - StartPointDialog: 9 tests (updated for chip-based line filter)
    - CreateStrategyModal: 6 tests
    - EditStrategyModal: 8 tests
    - SelectStrategyDialog: 8 tests
    - StrategiesPage: 8 tests
    - All tests use proper setup with resetMockData() and data hierarchy
    - Production build passing, all TypeScript errors resolved
  - ⏳ **Not Yet Implemented**:
    - ABBA Gender Rule enforcement (frontend validation only)

## Architecture Patterns Established

### Frontend Structure
```
src/
├── components/
│   ├── shared/          # PageHeader, LoadingState, ErrorState, PlayerSelectionUI
│   ├── teams/           # TeamCard, TeamsGrid, EmptyTeamsState
│   ├── competitions/    # CompetitionCard, CompetitionsGrid, EmptyCompetitionsState
│   ├── lines/           # LineCard, LinesGrid, EmptyLinesState (Phase 5)
│   ├── strategies/      # StrategyCard, StrategiesGrid, EmptyStrategiesState (Phase 6)
│   ├── players/         # PlayerCard, PlayersGrid, EmptyPlayersState
│   ├── games/           # GameCard, GamesGrid, EmptyGamesState
│   ├── points/          # LivePointTracker, PointTimer, PlayerSelector, PointHistoryList, PointHistoryItem
│   └── modals/          # CreateTeamModal, EditPlayerModal, CreateGameModal, EditGameModal,
│                        # StartPointDialog, FinishPointDialog, CompletePointDialog, EditPointDialog,
│                        # AddCommentDialog, SelectStrategyDialog,
│                        # CreateCompetitionModal, EditCompetitionModal,
│                        # CreateLineModal, EditLineModal,
│                        # CreateStrategyModal, EditStrategyModal,
│                        # AddPlayersModal (generic), AddPlayersToRosterModal, AddPlayersToLineModal,
│                        # AddPlayersToGameModal
├── pages/               # HomePage, TeamsPage, TeamDetailPage, CompetitionsPage, CompetitionDetailPage,
│                        # LineDetailPage, GamesPage, GameDetailPage, StrategiesPage
├── services/            # API calls (teams.ts, competitions.ts, players.ts, lines.ts, games.ts, points.ts, strategies.ts)
├── types/               # TypeScript types matching backend schemas (includes Line types, updated GameStatus)
└── test/
    ├── mocks/           # MSW handlers for API mocking (all endpoints including lines, strategies)
    └── test-utils.tsx   # Custom render with providers
```

### Design System (Material UI)
- **Theme**: Centralized theme system with custom gradient extensions (see src/theme.d.ts)
- **Colors**:
  - Primary: #1e3a8a (navy blue) with light/dark variants
  - Secondary: #38bdf8 (sky blue) with light/dark variants
  - Background: #f5f7fa (default), #ffffff (paper)
- **Gradients**: Custom theme gradients (primary, primaryReverse, light)
- **Layout**: Container with max-width, responsive Grid system (MUI v7 API)
- **Responsive**: Mobile-first design using MUI breakpoints (xs, sm, md, lg)
- **Components**: MUI components (Button, Card, Dialog, TextField, Select, Chip, Drawer)
- **Typography**: Material Design type scale (h1-h6, body1-2, caption)
- **Icons**: @mui/icons-material (GroupIcon, EmojiEventsIcon, FlashOnIcon, ShieldIcon, etc.)
- **Accessibility**: WCAG compliant, keyboard navigation, ARIA labels
- **Card System**: Consistent gradient borders, full-width teams, responsive competition/game grids

### Testing Strategy
- **Frontend**: 147 tests passing - 23/23 test files (Phase 1-6 fully tested)
  - Phase 1: Teams & Players
  - Phase 2: Games
  - Phase 3: Live Point Tracking
  - Phase 4: Competitions & Roster Management
  - Phase 5: Lines & Enhanced Game Management
    - LinesPage tests (6) - CRUD, filtering, navigation
    - LineDetailPage tests (6) - player management, editing, gender-split
    - GameDetailPage tests (10) - player management, status lifecycle, finished game restrictions
    - StartPointDialog tests (9) - chip-based line filtering, player selection, validation
  - Phase 6: Enhanced Point Tracking & Strategy Management
    - CompletePointDialog tests (7) - New component for scored→completed transition
    - FinishPointDialog tests (6) - Updated for toggle buttons and cleaner UI
    - CreateStrategyModal tests (6) - Form validation, category selection, CRUD
    - EditStrategyModal tests (8) - Pre-filled values, dropdown interaction, updates
    - SelectStrategyDialog tests (8) - Category filtering, proper test setup with data hierarchy
    - StrategiesPage tests (8) - Filtering, CRUD operations, delete confirmation
  - Test organization: All tests in `__tests__/` subdirectories for consistency
- **Backend**: 273 tests passing - 100% (118 new tests added in Phases 5-6)
  - Phase 5: 31 Line CRUD tests + 27 Line API tests + 17 enhanced Game tests
  - Phase 6: 20 Strategy CRUD tests + 20 Strategy API tests + ~38 enhanced Point tests
  - **Test organization**: Point API tests split into 2 focused files (19 CRUD + 12 tracking)
  - Comprehensive coverage: CRUD operations, M2M relationships, cascade deletes, unique constraints, 4-status workflows
- **MSW (Mock Service Worker)**: HTTP request interception for realistic API mocking
- **Happy DOM**: Lightweight DOM implementation for fast tests
- **React Testing Library**: User-centric component testing
- **Test Files**:
  - Page tests: TeamsPage, TeamDetailPage, GamesPage, GameDetailPage, CompetitionsPage, CompetitionDetailPage, LinesPage, LineDetailPage (all in `__tests__/`)
  - Component tests: PointTimer, PlayerSelector, PlayerCard
  - Modal tests: StartPointDialog, FinishPointDialog, CompletePointDialog, EditPointDialog, CreateCompetitionModal, EditCompetitionModal, AddPlayersToRosterModal (all in `modals/__tests__/`)
  - Backend tests: test_crud/ and test_api/ for all domains (teams, competitions, players, games, points, lines, strategies)
  - Points API tests: test_points_api.py (CRUD) + test_points_tracking_api.py (live tracking workflow)

## Next Steps - Major Expansion (Phase 5+)

### 📋 Comprehensive Requirements
Phase 1-3 served as a proof of concept. The full vision is documented in **`requirements.md`** and **`data-model-design.md`**, which outline a complete game analytics platform.

**✅ Phase 4 COMPLETED (Backend + Frontend + UI/UX):**
- ✅ Competition model with hierarchy (Team → Competition → Game → Point)
- ✅ Player gender field (M/W) for mixity validation
- ✅ Competition roster management (add/remove players with confirmation dialogs)
- ✅ Backend models/schemas refactored into domain directories
- ✅ 150 backend tests passing (30 new competition tests)
- ✅ 80 frontend tests passing (core Phase 1-4 functionality)
- ✅ Frontend competition UI with full CRUD operations
- ✅ Player gender displayed in split sections (Men/Women with colored borders)
- ✅ Updated game structure to use competition_id
- ✅ PlayerCard supports both edit mode (team page) and delete mode (roster)
- ✅ All TypeScript errors resolved, production build passing
- ✅ **UI/UX Enhancements:**
  - Centralized theme system with navy/sky blue gradients
  - Consistent card design with player counts and team names
  - Mobile-first improvements (hamburger menu, responsive layouts)
  - Status consistency ("Ongoing" in green)
  - Offense icon updated to lightning bolt

**Remaining Core Entities (Phase 7+):**
- **Call** - Fouls/violations with duration tracking
- **Turnover** - Turnover events with player responsibility

**Remaining Enhancements:**
- **ABBA Gender Rule** (Phase 6+) - Mixity validation (4M+3W or 3M+4W) with ABBA rule enforcement (frontend-only)

**Statistics Dashboard (Phase 8):**
- Comprehensive analytics at game/competition/team/player level
- Offense/defense efficiency metrics
- Player playing time and performance tracking

### 🎯 Implementation Roadmap

**✅ Phase 4: Competition & Player Gender (COMPLETE - Backend + Frontend + Tests + UI/UX)**
- Backend: Competition model, Player.gender, roster management, refactored code organization
- Backend enhancements: GET /teams returns TeamWithPlayers[], GET /competitions returns CompetitionWithTeam[]
- Frontend: Full Competition UI, player gender in forms/display, updated game structure (80 tests passing)
- UI/UX: Navy/sky blue theme (#1e3a8a → #38bdf8), full-width team cards with player counts, competition cards with team names
- Status: Production build passing, all core functionality tested, modern polished UI with professional color scheme

**✅ Phase 5: Lines & Enhanced Game Model (COMPLETE - Backend + Frontend + Tests)**
- Backend:
  - ✅ Line model with M2M player relationships, unique constraint (team_id + name)
  - ✅ Game player selection (M2M with competition roster validation)
  - ✅ Game comments field (optional text)
  - ✅ 3-status game lifecycle (ready→started→ended) using GameStatusEnum
  - ✅ 8 new Line REST API endpoints (full CRUD + player management)
  - ✅ 3 new Game player management endpoints
  - ✅ 75 comprehensive backend tests (31 CRUD + 27 API + 17 Game enhancements)
  - ✅ Database recreated with new schema (lines, line_players, game_players tables)
- Frontend:
  - ✅ LineDetailPage with player management (add/remove players)
  - ✅ Lines integrated into TeamDetailPage (no dedicated /lines route)
  - ✅ Game player selection UI (AddPlayersToGameModal)
  - ✅ Game comments in CreateGameModal and EditGameModal
  - ✅ 3-status game lifecycle buttons (Start Game, End Game)
  - ✅ Generic AddPlayersModal component (~1000 lines of duplicate code eliminated)
  - ✅ Team/Competition filters on list pages
  - ✅ 16 new frontend tests (6 LinesPage + 6 LineDetailPage + 4 GameDetailPage enhancements)
- Status: 273 backend tests + 111 frontend tests passing, production build passing

**✅ Phase 6 Backend: Strategy & Enhanced Point Model (COMPLETE - Backend + Tests)**
- ✅ Strategy model (name, description, category: offense/defense)
- ✅ Point model enhanced with 4-status lifecycle (ready→running→scored→completed)
- ✅ New Point fields: field_side, pull, strategy_id (optional FK), comments
- ✅ Status enums for type safety (PointStatusEnum replacing string status)
- ✅ Only one running point per game validation (ready/scored/completed allowed concurrently)
- ✅ Strategy REST API: 5 endpoints (POST, GET, PUT, DELETE, LIST with category filter)
- ✅ Renamed endpoint: GET /points/games/{id}/running (backward-compat /active alias)
- ✅ Strategy deletion sets strategy_id=NULL on points (ON DELETE SET NULL cascade)
- ✅ 40 new Strategy tests (20 CRUD + 20 API)
- ✅ ~38 enhanced Point tests (4-status workflows, new fields, validations)
- ✅ Database recreated with strategies table and enhanced points table
- ✅ Test file refactoring: Split test_points_api.py into 2 focused files (CRUD + tracking)
- ✅ Removed deprecated /active endpoint (clean codebase, no unnecessary backward compat)
- Status: 273 backend tests passing (100%), production-ready
- Next: Phase 5-6 Frontend implementation

**✅ Phase 6 Frontend: Strategy UI & 4-Status Point Tracking (95% COMPLETE)**
- ✅ Strategy management UI (StrategiesPage, Create/Edit/Delete modals with confirmation)
- ✅ LivePointTracker updated for 4-status workflow (ready→running→scored→completed)
- ✅ Strategy selection in LivePointTracker (SelectStrategyDialog, auto-filtered by category)
- ✅ Pull tracking, comments fields in point tracking (AddCommentDialog)
- ✅ PointHistoryItem displays strategy, pull status, comments
- ✅ StartPointDialog UX: Chip-based line filter, inline player count with color-coding
- ✅ FinishPointDialog: Cleaner UI with toggle buttons, color-coded Won/Lost
- ✅ Resume Point: scored→running with optimistic cache updates (no UI flicker)
- ✅ All 145 tests passing (29 new Phase 6 tests)
- ✅ EditPointDialog & LineCard UX improvements (toggle buttons, section dividers, cleaner cards)
- ⏳ **ABBA Gender Rule Enforcement (Frontend-only - REMAINING):**
  - Implement ABBA alternating gender ratio pattern (A-B-B-A-A-B-B-A...)
  - Each point must alternate between 4M+3W and 3M+4W following the sequence
  - First point's gender ratio defines which is "A" and which is "B"
  - Pattern calculated from point number: `(pointNumber % 4)` determines A or B
  - UI enhancements in StartPointDialog:
    - Show required gender ratio badge (e.g., "Required: 4 Men, 3 Women")
    - Real-time validation as players are selected
    - Visual feedback (green checkmark or red warning) for ratio compliance
    - Optionally disable "Start Point" button if ratio doesn't match
  - PlayerSelector updates: Display live count of selected men/women
  - No backend changes needed - pure UI validation logic

**⏳ Phase 6.5: Internationalization (i18n) - NEW**
- Add react-i18next for localization support
- Support French and English languages
- Language selector in AppBar
- Translation files organized by domain (teams, games, points, etc.)
- Update all components to use translation keys
- Persist language preference in localStorage
- Update test setup to mock i18n
- Estimated effort: 11-18 hours
- **Why now?**: Better to add before codebase grows with Phases 7-8
- **Scope**: All UI strings (buttons, labels, headers, messages, forms, empty states)

**⏳ Phase 7: Calls & Turnovers**
- Add Call model (with timing)
- Add Turnover model (with player responsibility)
- Integrate into point tracking UI

**⏳ Phase 8: Statistics Dashboard**
- Comprehensive analytics implementation
- Team offense/defense metrics
- Player performance tracking
- Visualizations and charts

### 📝 Implementation Notes
- Database will be recreated as models evolve (SQLite, no migrations)
- Methodical approach: design → backend → frontend → test at each phase
- Mobile-first design continues throughout
- **Phase 5 complete (backend + frontend)** - Ready for Phase 6 frontend implementation
- **Phase 6 backend complete** - Strategy model and 4-status point tracking ready
- MUI v7 Grid API: Fully migrated to new `size` prop syntax (removed deprecated GridLegacy)

## Important Commands

### Backend
```bash
cd backend
source venv/bin/activate
pytest tests/ -v                    # Run all 273 tests
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev                         # Starts on http://localhost:5173/
npm test                            # Run all 80 tests
npm run test:coverage               # Run tests with coverage report
npm run build                       # Production build
```

## Key Files to Know

### Backend
- `backend/app/database.py` - SQLite config with foreign key enforcement
- `backend/app/models/` - SQLAlchemy models organized by domain (base, team, competition, player, game, point, line, strategy)
- `backend/app/schemas/` - Pydantic schemas organized by domain (enums, team, competition, player, game, point, line, strategy)
- `backend/app/crud/` - CRUD operations organized by domain (teams, competitions, players, games, points, lines, strategies)
- `backend/app/routers/` - API endpoints organized by domain (teams, competitions, players, games, points, lines, strategies)
- `backend/tests/` - 273 comprehensive tests (CRUD + API)
- `backend/README.md` - Comprehensive backend documentation

### Frontend
- `frontend/src/App.tsx` - Root with MUI theme (custom gradients), React Router, TanStack Query
- `frontend/src/theme.d.ts` - TypeScript declarations for theme extensions (gradients)
- `frontend/src/pages/` - All page components with routes
- `frontend/src/components/` - Organized by domain (teams/, players/, games/, modals/)
- `frontend/src/services/` - API layer matching backend endpoints
- `frontend/src/types/index.ts` - TypeScript types matching backend schemas
- `frontend/src/test/mocks/handlers.ts` - MSW handlers for all endpoints
- `frontend/README.md` - Comprehensive frontend documentation with theme system details
- `backend/README.md` - Comprehensive backend documentation

## Known Issues

### Technical Warnings
- Node.js 20.15.0 (Vite recommends 20.19+ or 22.12+ but works fine)
- Database must be recreated when Point model changes (SQLite, no migrations)

### Game Timer Issues (Need Fixing)
**Issue 1: Timer starts at 1 hour** - Timezone issue with datetime handling
- Backend stores UTC timestamps, frontend may be interpreting incorrectly
- Need to ensure consistent UTC handling with 'Z' suffix in ISO strings

**Issue 2: Timer should start with first point, not Start Game button**
- Current: `start_datetime` set when game status → "started"
- Required (per requirements.md line 32): Timer starts when **first point** is created
- Fix: Move `start_datetime` logic from game status transition to point creation
- "Start Game" button should only enable point tracking UI, not start timer

## User Preferences
- Likes clean, maintainable code
- Appreciates explanations of React/TypeScript concepts
- Wants modern, polished UI (Material UI)
- Prefers committing frequently with clear messages
- **Wants to be challenged when appropriate** - Don't just try to please; push back, verify assumptions, and think critically before acting
- Prefers not to see test counts in README (focus on what's tested, not numbers)
- **Testing philosophy**: Write smart, meaningful tests for core functionality and important edge cases. Not chasing code coverage - focus on value, not metrics.
- **Documentation**: Expects CLAUDE.md to be proactively updated whenever significant changes are made to keep context current

## Git Status
- Currently on `main` branch
- **Working tree clean** - All Phase 6 Frontend work committed
- Latest commits:
  - `be2f4cd` - Fix all remaining strategy tests (17 tests)
  - `2db6239` - Improve StartPointDialog UX and add Strategy Management UI
  - `bb28267` - Implement Phase 6 backend: Strategy model and enhanced Point tracking (PUSHED)
- Branch is synced with origin/main
- **Phase 6 Frontend COMPLETE** ✅:
  - All 147 tests passing
  - Strategy Management UI fully implemented
  - 4-status point workflow with all dialogs
  - UX improvements (chip-based filters, color-coded player count)
  - Production build passing

## Development Notes
- Backend runs on port 8000
- Frontend runs on port 5173
- Database: `backend/ultimate_stats.db` (SQLite - recreate when model changes)
- All foreign key constraints properly configured
- Component architecture follows single responsibility principle
- All endpoints tested (backend: pytest, frontend: vitest)
- MSW provides realistic API mocking in tests
- **Phase 4 COMPLETE (Backend + Frontend + Tests)**
  - Backend: Competition model, roster management, domain-organized code
  - Frontend: Full competition UI, player gender field, updated game structure
  - Roster management: Add/remove players with confirmation dialogs
  - PlayerCard component supports both edit mode (team page) and delete mode (competition roster)
  - Production build passing, all TypeScript errors resolved
  - Migrated to MUI v7 Grid API (removed deprecated GridLegacy)
- **Phase 5 COMPLETE (Backend + Frontend + Tests + Polish)**
  - Backend: 273 tests passing (75 new tests for Lines & Game enhancements)
  - Line model: M2M with players, unique constraint (team_id + name), 8 REST endpoints
  - Game enhancements: 3-status lifecycle (ready/started/ended), comments field, player selection (3 new endpoints)
  - Database recreated with new schema (lines, line_players, game_players tables)
  - Frontend: 111 tests passing (31 tests for Lines, Game management, polish & bug fixes)
  - LineDetailPage with player management (add/remove via AddPlayersToLineModal)
  - Lines integrated into TeamDetailPage (no dedicated /lines route)
  - Game player selection UI (AddPlayersToGameModal), comments in modals, status lifecycle buttons
  - StartPointDialog with line filter for player visibility
  - Generic AddPlayersModal + shared PlayerSelectionUI (~1240 lines of duplicate code eliminated)
  - Filtering: Team filter on competitions/lines, cascading team+competition filters on games
  - UX improvements: Won/Lost/Tie on game cards, disabled player management for finished games
  - Bug fixes: EditPointDialog validation (>= for <1min points), TypeScript import errors
  - All CRUD operations, M2M relationships, cascade deletes, validations tested
  - Test organization: All tests in __tests__/ subdirectories
  - Production build passing, all TypeScript errors resolved
- **Phase 6 Backend COMPLETE**
  - Backend: 273 tests passing (45 new tests for Strategy & enhanced Point model)
  - Strategy model with offense/defense categories, 5 REST endpoints
  - Point model: 4-status lifecycle (ready→running→scored→completed), new fields (field_side, pull, strategy_id, comments)
- **Phase 6 Frontend COMPLETE** 🎉
  - ✅ Strategy service layer (services/strategies.ts) with full CRUD
  - ✅ TypeScript types updated for all new fields
  - ✅ StartPointDialog enhanced: strategy selection (comments removed - moved to live tracking)
  - ✅ FinishPointDialog updated: transitions to "scored" status
  - ✅ CompletePointDialog created: scored→completed transition
  - ✅ AddCommentDialog created: add/edit comments during live tracking
  - ✅ LivePointTracker updated: 4-status workflow, Resume Point button, pull tracking UI, comment button
  - ✅ Pull tracking: Only for defensive points, marked during live point (Inbound/Out of Bounds buttons)
  - ✅ PointHistoryItem displays: strategy, pull status, comments
  - ✅ Resume Point feature: Allows canceling score due to late calls (scored→running)
  - ✅ Timer bug fixed: Timer properly restarts when resuming scored point
  - ✅ Optimistic cache updates: Smooth UI transitions on resume (no flicker)
  - ✅ Code cleanup: Simplified PointTimer rendering, consolidated duplicate code
  - ✅ MSW mocks updated: Strategy endpoints, new point fields
  - ✅ Backend timezone comparison fix applied (update_point datetime comparison)
  - ✅ Tests updated: 119 tests passing (8 new tests for CompletePointDialog and FinishPointDialog)
  - ⏳ ABBA Gender Rule: Not yet implemented
  - ⏳ Strategy Management UI: No pages/modals to create/edit strategies (service layer complete)
- **UI/UX Enhancements COMPLETE**
  - Centralized theme system in App.tsx with navy/sky blue gradient (#1e3a8a → #38bdf8)
  - TypeScript theme declarations in src/theme.d.ts
  - Consistent card design system across all entities (Team/Competition/Game)
  - Team cards: Full-width with player counts by gender
  - Competition cards: Team name chip alongside status
  - Mobile-first responsive improvements (hamburger menu, responsive layouts)
  - Gender-split player sections with colored Paper borders
  - All components use theme values (no hardcoded colors)
  - Backend endpoints enhanced: GET /teams returns TeamWithPlayers[], GET /competitions returns CompetitionWithTeam[]
- **Roster Management Improvements**
  - AddPlayersToRosterModal redesigned with modern UX
  - Real-time selection counter (total + gender breakdown)
  - Quick action buttons for efficient selection (Select All, All Men, All Women, Clear All)
  - Search/filter functionality for large rosters
  - Gender-based grouping with visual badges
  - All player lists sorted alphabetically throughout the app
- Active point polling every 5 seconds using React Query
- Timezone-aware datetimes with proper 'Z' suffix serialization
- **Next Steps:**
  1. **Complete Phase 6** - ABBA Gender Rule (frontend validation for alternating 4M+3W / 3M+4W pattern)
  2. **Phase 6.5** - Internationalization (i18n) - French/English localization (11-18 hour effort)
  3. **Phase 7** - Calls & Turnovers (backend + frontend)
  4. **Phase 8** - Statistics Dashboard
  5. **Known Issue** - Fix Game Timer (start when first point runs, not game start button)
