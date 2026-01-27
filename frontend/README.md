# Ultimate Frisbee Stats - Frontend

React + TypeScript Progressive Web App for tracking ultimate frisbee team statistics during games.

## Overview

A mobile-first application designed for use on the sidelines during ultimate frisbee games. Track your team's performance in real-time with comprehensive game statistics.

### Core Functionalities

**Team & Player Management:**
- Create and manage multiple teams
- Add players with jersey numbers and gender
- Organize players across different teams

**Competition Organization:**
- Create competitions (tournaments, leagues, seasons)
- Build competition rosters from your team players
- Track multiple games within each competition
- Filter competitions by team

**Lines Management:**
- Create user-defined player groups (O-line, D-line, etc.)
- Add/remove players from lines
- Organize lines within teams for quick access
- Line filtering in StartPointDialog for quick player selection

**Strategy Management:**
- Create and manage offensive and defensive strategies
- Organize plays with names and descriptions
- Filter strategies by category (All/Offense/Defense)
- Assign strategies to points during live tracking
- Auto-filtering by point type (offense/defense)
- Delete strategies with confirmation dialog

**Game Management:**
- Schedule games with opponent information and dates
- Select players for game roster from competition
- Add comments to games for notes
- 3-status game lifecycle (Ready → Started → Ended)
- Track live scores with start/end game buttons
- View game history with final scores and statistics
- Filter games by team and competition
- Won/Lost/Tie display on game cards with color-coded outcomes
- Player management disabled for finished games (prevents accidental changes)

**Live Point Tracking (4-Status Workflow):**
- Real-time point-by-point tracking during games
- 4-status lifecycle: Ready → Running → Scored → Completed
- Select 7 players for each point with chip-based line filtering
- Inline player count with color-coded feedback (green when 7/7)
- Mark points as offense or defense
- Assign strategies during live tracking (auto-filtered by offense/defense)
- Track pull status (inbound/out of bounds) for defensive points
- Add/edit comments during live tracking for detailed notes
- Record point outcomes with color-coded Won/Lost toggle buttons
- Resume scored points for late calls or contested outcomes
- Timer properly restarts when resuming points
- Optimistic cache updates prevent UI flicker
- View strategic context (breaks, holds, strategies)
- Edit point details and player lineups
- Cleaner dialog UIs with offense/defense icons

**Statistics & Analytics:**
- View point history with durations
- Track offensive and defensive performance
- Analyze player participation across games

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Application runs at http://localhost:5173
# Ensure backend is running at http://localhost:8000
```

## Architecture

### Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx    # Main app layout with AppBar and language selector
│   │   ├── shared/       # Reusable shared components
│   │   │   ├── PageHeader.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── PlayerSelectionUI.tsx  # Shared player selection with gender display
│   │   ├── teams/        # Team domain components
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamsGrid.tsx
│   │   │   └── EmptyTeamsState.tsx
│   │   ├── players/      # Player domain components
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── PlayersGrid.tsx
│   │   │   └── EmptyPlayersState.tsx
│   │   ├── competitions/ # Competition domain components
│   │   │   ├── CompetitionCard.tsx
│   │   │   ├── CompetitionsGrid.tsx
│   │   │   └── EmptyCompetitionsState.tsx
│   │   ├── lines/        # Line domain components
│   │   │   ├── LineCard.tsx
│   │   │   ├── LinesGrid.tsx
│   │   │   └── EmptyLinesState.tsx
│   │   ├── strategies/   # Strategy domain components
│   │   │   ├── StrategyCard.tsx
│   │   │   ├── StrategiesGrid.tsx
│   │   │   └── EmptyLinesState.tsx
│   │   ├── games/        # Game domain components
│   │   │   ├── GameCard.tsx
│   │   │   ├── GamesGrid.tsx
│   │   │   └── EmptyGamesState.tsx
│   │   ├── points/       # Point tracking components
│   │   │   ├── LivePointTracker.tsx    # 4-status workflow, pull tracking, resume
│   │   │   ├── PointTimer.tsx          # Real-time/static elapsed time display
│   │   │   ├── PlayerSelector.tsx      # 7-player selection UI
│   │   │   ├── PointHistoryList.tsx    # List of all points
│   │   │   └── PointHistoryItem.tsx    # Point display with strategy/pull/comments
│   │   └── modals/       # Modal dialogs
│   │       ├── CreateTeamModal.tsx
│   │       ├── AddPlayerModal.tsx
│   │       ├── EditPlayerModal.tsx
│   │       ├── CreateCompetitionModal.tsx
│   │       ├── EditCompetitionModal.tsx
│   │       ├── AddPlayersModal.tsx          # Generic player selection component
│   │       ├── AddPlayersToRosterModal.tsx  # Roster-specific wrapper
│   │       ├── AddPlayersToLineModal.tsx    # Line-specific wrapper
│   │       ├── AddPlayersToGameModal.tsx    # Game-specific wrapper
│   │       ├── CreateLineModal.tsx
│   │       ├── EditLineModal.tsx
│   │       ├── CreateStrategyModal.tsx       # Create offense/defense strategies
│   │       ├── EditStrategyModal.tsx         # Edit existing strategies
│   │       ├── SelectStrategyDialog.tsx      # Select strategy during live tracking
│   │       ├── CreateGameModal.tsx
│   │       ├── EditGameModal.tsx
│   │       ├── StartPointDialog.tsx          # Chip-based line filter, inline player count
│   │       ├── FinishPointDialog.tsx         # Clean UI, color-coded Won/Lost toggles
│   │       ├── CompletePointDialog.tsx       # Finalizes scored points
│   │       ├── AddCommentDialog.tsx          # Add/edit comments during live tracking
│   │       └── EditPointDialog.tsx
│   ├── pages/            # Page components (routes)
│   │   ├── HomePage.tsx            # Landing page
│   │   ├── TeamsPage.tsx           # Team list/management
│   │   ├── TeamDetailPage.tsx      # Individual team with players and lines
│   │   ├── StrategiesPage.tsx      # Strategy list/management with CRUD
│   │   ├── CompetitionsPage.tsx    # Competition list/management
│   │   ├── CompetitionDetailPage.tsx # Individual competition with roster and games
│   │   ├── LinesPage.tsx           # Line list/management (integrated into TeamDetailPage)
│   │   ├── LineDetailPage.tsx      # Individual line with player management
│   │   ├── GamesPage.tsx           # Game list/management
│   │   └── GameDetailPage.tsx      # Individual game with score and points
│   ├── locales/          # i18n translation files
│   │   ├── index.ts      # i18n configuration (language detection, resources)
│   │   ├── en/           # English translations (9 JSON files)
│   │   │   ├── common.json       # Shared: actions, status, labels, validation
│   │   │   ├── navigation.json   # AppBar menu items
│   │   │   ├── teams.json
│   │   │   ├── players.json
│   │   │   ├── competitions.json
│   │   │   ├── games.json
│   │   │   ├── points.json       # Point tracking UI
│   │   │   ├── lines.json
│   │   │   └── strategies.json
│   │   └── fr/           # French translations (9 JSON files, same structure)
│   ├── services/         # API layer (mirrors backend CRUD)
│   │   ├── api.ts        # Axios client configuration
│   │   ├── teams.ts      # Team API calls
│   │   ├── competitions.ts # Competition API calls
│   │   ├── players.ts    # Player API calls
│   │   ├── lines.ts      # Line API calls
│   │   ├── games.ts      # Game API calls
│   │   ├── points.ts     # Point API calls
│   │   ├── strategies.ts # Strategy API calls
│   │   └── index.ts      # Central export point
│   ├── types/            # TypeScript types (mirrors backend schemas)
│   │   ├── index.ts      # All type definitions
│   │   └── i18n.d.ts     # i18next TypeScript types (CustomTypeOptions)
│   ├── hooks/            # Custom React hooks
│   ├── test/             # Testing utilities
│   │   ├── setup.ts      # Test configuration
│   │   ├── test-utils.tsx # Custom render with providers (includes i18n mock)
│   │   └── mocks/        # MSW handlers for API mocking
│   │       └── handlers.ts  # Request handlers for all API endpoints
│   ├── App.tsx           # Root component with providers (includes I18nextProvider)
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global CSS styles
├── public/               # Static assets
├── vitest.config.ts      # Vitest configuration
└── package.json          # Dependencies and scripts
```

### Design Principles

- **Mobile-first design**: Optimized for use on the sidelines during games
- **Clean separation of concerns**: Pages → Components → Services → API
- **Domain-driven organization**: Code organized by business domain (teams, players, games, points)
- **Type safety**: TypeScript types matching backend Pydantic schemas exactly
- **Server state management**: TanStack Query for caching and synchronization
- **Testing infrastructure**: Vitest + React Testing Library (ready for comprehensive tests)
- **Styling**: Material UI for professional, accessible, responsive components

### Technology Stack

**Core Framework:**
- React 19.2.0 - UI library
- TypeScript 5.9.3 - Type safety
- Vite 7.2.4 - Build tool and dev server

**Routing & State:**
- React Router 7.12.0 - Client-side routing
- TanStack Query 5.90.17 - Server state management

**UI Framework:**
- Material UI 6.x - Comprehensive React component library
- @mui/icons-material - Material Design icons
- Emotion - CSS-in-JS styling (MUI dependency)

**HTTP Client:**
- Axios 1.13.2 - API requests with interceptors

**Testing:**
- Vitest 4.0.17 - Unit and integration testing
- React Testing Library 16.3.1 - Component testing
- @testing-library/user-event - Simulating user interactions
- @testing-library/jest-dom - Custom Jest matchers for DOM
- MSW (Mock Service Worker) - API mocking with request interception
- Happy DOM - Lightweight DOM implementation (faster alternative to jsdom)

### Data Flow

1. **User Interaction** → Component
2. **Component** → TanStack Query hook
3. **Query Hook** → Service layer (teams.ts, players.ts, etc.)
4. **Service** → Axios client → Backend API
5. **Response** → Automatic cache update → UI re-render

## Prerequisites

- **Node.js 20.19+ or 22.12+** (currently on 20.15.0, works but shows warnings)
- **npm** (comes with Node.js)
- **Backend API** running on http://localhost:8000

## Installation

### 1. Navigate to frontend directory

```bash
cd ultimate-frisbee-stats/frontend
```

### 2. Install dependencies

```bash
npm install
```

### Dependencies Overview

**Production Dependencies:**
- `react` + `react-dom` - Core UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Server state management
- `axios` - HTTP client
- `@mui/material` + `@emotion/react` + `@emotion/styled` - Material UI components
- `@mui/icons-material` - Material Design icons
- `react-i18next` + `i18next` + `i18next-browser-languagedetector` - Internationalization

**Development Dependencies:**
- `vite` + `@vitejs/plugin-react` - Build tooling
- `typescript` - Type checking
- `vitest` + Testing Library + MSW + happy-dom - Testing framework
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - DOM matchers
- `eslint` - Code linting

## Configuration

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to configure the API base URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

The frontend will connect to this backend API endpoint.

## Running the Application

### Start the development server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000 (must be running separately)

### Server auto-reloads on code changes

Vite provides instant HMR (Hot Module Replacement) when you modify files.

## Building for Production

### Create production build

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview production build

```bash
npm run preview
```

## API Services

The service layer mirrors the backend CRUD structure. All services are strongly typed.

### Teams Service (`services/teams.ts`)
- `createTeam(data: TeamCreate): Promise<Team>`
- `getTeams(): Promise<Team[]>`
- `getTeam(teamId: number): Promise<TeamWithPlayers>`
- `updateTeam(teamId, data: TeamUpdate): Promise<Team>`
- `deleteTeam(teamId: number): Promise<void>`
- `getTeamPlayers(teamId: number): Promise<Player[]>`
- `getTeamGames(teamId: number): Promise<GameWithScore[]>`

### Competitions Service (`services/competitions.ts`)
- `createCompetition(data: CompetitionCreate): Promise<Competition>`
- `getCompetitions(): Promise<Competition[]>`
- `getCompetition(competitionId: number): Promise<CompetitionWithPlayers>`
- `updateCompetition(competitionId, data: CompetitionUpdate): Promise<Competition>`
- `deleteCompetition(competitionId: number): Promise<void>`
- `getCompetitionPlayers(competitionId: number): Promise<Player[]>`
- `addPlayersToRoster(competitionId: number, data: PlayerIdsRequest): Promise<void>`
- `removePlayersFromRoster(competitionId: number, data: PlayerIdsRequest): Promise<void>`
- `getCompetitionGames(competitionId: number): Promise<GameWithScore[]>`

### Players Service (`services/players.ts`)
- `createPlayer(data: PlayerCreate): Promise<Player>`
- `getPlayer(playerId: number): Promise<Player>`
- `updatePlayer(playerId, data: PlayerUpdate): Promise<Player>`
- `deletePlayer(playerId: number): Promise<void>`

### Lines Service (`services/lines.ts`)
- `createLine(data: LineCreate): Promise<Line>`
- `getLines(teamId?: number): Promise<Line[]>`
- `getLine(lineId: number): Promise<LineWithPlayers>`
- `updateLine(lineId, data: LineUpdate): Promise<Line>`
- `deleteLine(lineId: number): Promise<void>`
- `addPlayersToLine(lineId: number, data: PlayerIdsRequest): Promise<void>`
- `removePlayersFromLine(lineId: number, data: PlayerIdsRequest): Promise<void>`
- `getLinePlayers(lineId: number): Promise<Player[]>`

### Games Service (`services/games.ts`)
- `createGame(data: GameCreate): Promise<Game>`
- `getGame(gameId: number): Promise<GameDetail>`
- `updateGame(gameId, data: GameUpdate): Promise<Game>`
- `startGame(gameId: number): Promise<Game>` - Change status to "started"
- `finishGame(gameId: number): Promise<Game>` - Change status to "ended"
- `deleteGame(gameId: number): Promise<void>`
- `getGamePoints(gameId: number): Promise<PointWithPlayers[]>`
- `addPlayersToGame(gameId: number, data: PlayerIdsRequest): Promise<void>` - Add players to game roster
- `removePlayersFromGame(gameId: number, data: PlayerIdsRequest): Promise<void>` - Remove players from game roster
- `getGamePlayers(gameId: number): Promise<Player[]>` - Get game roster

### Points Service (`services/points.ts`)
- `startPoint(data: PointCreate): Promise<Point>` - Create point (with strategy, pull, comments)
- `getRunningPoint(gameId: number): Promise<PointWithPlayers | null>` - Get running point for game
- `updatePoint(pointId, data: PointUpdate): Promise<Point>` - Update point (status transitions, fields)
- `cancelPoint(pointId: number): Promise<void>` - Cancel/delete point
- `getPoint(pointId: number): Promise<PointWithPlayers>` - Get point by ID
- `deletePoint(pointId: number): Promise<void>` - Delete point

### Strategies Service (`services/strategies.ts`)
- `createStrategy(data: StrategyCreate): Promise<Strategy>` - Create offensive/defensive strategy
- `getStrategies(category?: StrategyCategory): Promise<Strategy[]>` - List strategies (optional filter)
- `getStrategy(strategyId: number): Promise<Strategy>` - Get strategy by ID
- `updateStrategy(strategyId, data: StrategyUpdate): Promise<Strategy>` - Update strategy
- `deleteStrategy(strategyId: number): Promise<void>` - Delete strategy

## TypeScript Types

All types in `src/types/index.ts` exactly match the backend Pydantic schemas:

- **Team types**: `Team`, `TeamCreate`, `TeamUpdate`, `TeamWithPlayers`
- **Competition types**: `Competition`, `CompetitionCreate`, `CompetitionUpdate`, `CompetitionWithPlayers`, `PlayerIdsRequest`, `CompetitionStatus`, `Gender`
- **Player types**: `Player`, `PlayerCreate`, `PlayerUpdate` (includes `gender: Gender` field)
- **Line types**: `Line`, `LineCreate`, `LineUpdate`, `LineWithPlayers`
- **Strategy types**: `Strategy`, `StrategyCreate`, `StrategyUpdate`, `StrategyCategory` (offense/defense)
- **Game types**: `Game`, `GameCreate`, `GameUpdate`, `GameWithScore`, `GameDetail`, `GameStatus` (ready/started/ended)
- **Point types**: `Point`, `PointCreate`, `PointUpdate`, `PointFinish`, `PointWithPlayers`, `PointStatus` (ready/running/scored/completed)
  - Includes: `field_side`, `pull`, `strategy_id`, `comments`, `strategy` object

This ensures type safety across the entire application.

## UI Components & Styling

### Material UI

The application uses Material UI (MUI) for all UI components, providing:
- **Professional design**: Clean, modern Material Design aesthetic
- **Accessibility**: WCAG compliant, keyboard navigation, ARIA attributes
- **Responsive**: Mobile-first design with built-in breakpoints
- **Customizable**: Theme configuration in `App.tsx`
- **Icon library**: `@mui/icons-material` for consistent iconography

### Component Examples

**Common MUI components used:**
- `Container`, `Box`, `Grid` - Layout
- `Typography` - Text with variant system (h1-h6, body1-2, etc.)
- `Button`, `IconButton` - Actions
- `TextField` - Form inputs
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` - Modals
- `Card`, `CardContent`, `CardActionArea` - Content containers
- `Paper` - Elevated surfaces
- `AppBar`, `Toolbar` - Navigation
- `Alert` - Feedback messages
- `CircularProgress` - Loading indicators
- `Chip` - Tags and labels

### Theme System

The application uses a centralized theme configuration in `App.tsx` with custom extensions:

```typescript
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",      // Purple
      light: "#8797f0",
      dark: "#4a5bb8",
    },
    secondary: {
      main: "#764ba2",      // Deep purple
      light: "#9168bd",
      dark: "#533571",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  // Custom gradient definitions (see src/theme.d.ts)
  gradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryReverse: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
    light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
  },
});
```

**Theme Features:**
- **Centralized colors**: Single source of truth for all colors across the app
- **Custom gradients**: Reusable gradient definitions via theme extensions
- **Type-safe access**: TypeScript declarations in `src/theme.d.ts`
- **Consistent styling**: All components use theme values, no hardcoded colors

### Card Design System

All entity cards (teams, competitions, games) follow a consistent visual pattern:

**Common Features:**
- Gradient borders from theme
- Elevation-free design with border-box gradient technique
- Smooth hover animations (translateY + box shadow)
- Centered content layout
- Icon at top representing the entity type

**Size Hierarchy:**
- **Team cards**: Largest (h4 title, 72px icon, py: 6)
- **Competition cards**: Medium (h5 title, 60px icon, py: 4)
- **Game cards**: Smallest (h5 title, no icon, py: 3)

**Status Consistency:**
- "Ongoing" status: Green (success color)
- "Completed"/"Finished" status: Gray (default color)

### Styling Approach

- **sx prop**: Inline styles with theme access via callback functions
- **Emotion**: CSS-in-JS for dynamic styling
- **alpha utility**: MUI's alpha function for transparent overlays
- **Theme-first**: All colors and gradients from centralized theme
- **No custom CSS**: MUI handles all styling needs

## Internationalization (i18n)

The application supports **French** and **English** with react-i18next, covering all UI text across 58 component files.

### Translation Structure

**9 Namespaces (~300 translation strings):**
- `common` - Shared actions, status labels, validation messages, homepage
- `navigation` - AppBar menu items, drawer navigation
- `teams` - Team pages, modals, forms
- `players` - Player management
- `competitions` - Competition management
- `games` - Game tracking, roster sections
- `points` - Point tracking UI (largest namespace, ~40+ strings)
- `lines` - Line management
- `strategies` - Strategy management

**File Organization:**
```
src/locales/
├── index.ts              # i18n configuration
├── en/                   # English translations
│   ├── common.json
│   ├── navigation.json
│   ├── teams.json
│   ├── players.json
│   ├── competitions.json
│   ├── games.json
│   ├── points.json
│   ├── lines.json
│   └── strategies.json
└── fr/                   # French translations (same structure)
```

### Language Selector

**Location:** AppBar (top-right corner)
- IconButton with LanguageIcon
- Menu with 🇬🇧 English / 🇫🇷 Français options
- Instant language switch (no page reload)
- Preference persisted to localStorage

### Sport Terminology

**Important:** Ultimate frisbee sport-specific terms stay in **English** in both languages (see `GLOSSARY.md`):
- Pull, Turnover, Break, Hold
- Handler, Cutter
- Foul, Travel, Pick, Strip

General UI terms are translated:
- Team → "Équipe" (French)
- Player → "Joueur" / "Joueuse" (French)
- Create → "Créer" (French)

### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('teams'); // Load 'teams' namespace

  return (
    <Typography>{t('page.title')}</Typography>           // "Teams" / "Équipes"
    <Button>{t('common:action.create')}</Button>         // Cross-namespace reference
    <Typography>{t('card.players', { count: 5 })}</Typography> // Pluralization
  );
}
```

### Adding New Translations

1. **Add translation keys** to both `en/*.json` and `fr/*.json`:
   ```json
   // en/teams.json
   {
     "page": {
       "newFeature": "New Feature Text"
     }
   }

   // fr/teams.json
   {
     "page": {
       "newFeature": "Texte de la nouvelle fonctionnalité"
     }
   }
   ```

2. **Use in component** with `useTranslation` hook:
   ```typescript
   const { t } = useTranslation('teams');
   <Typography>{t('page.newFeature')}</Typography>
   ```

3. **Test automatically uses English** (i18n mock in `test-utils.tsx`)

### Language Detection

Order: `localStorage` → `navigator.language` → `'en'` (fallback)

Configured in `src/locales/index.ts`:
```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    fallbackLng: 'en',
  });
```

### TypeScript Support

Type-safe translation keys via `src/types/i18n.d.ts`:
```typescript
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonEN;
      teams: typeof teamsEN;
      // ... all 9 namespaces
    };
  }
}
```

TypeScript will autocomplete translation keys and catch typos at compile time.

## Development

### Running Tests

```bash
npm test                  # Run all tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
```

The project uses Vitest with React Testing Library and MSW for API mocking.

**Test Organization:**
- All tests are organized in `__tests__/` subdirectories within their respective component/page directories
- Page tests: Comprehensive tests for all page components (Teams, Games, Competitions, Lines)
- Component tests: Unit tests for shared components (PointTimer, PlayerSelector, PlayerCard, PlayerSelectionUI)
- Modal tests: Integration tests for all dialogs (Create/Edit modals, StartPointDialog, FinishPointDialog, EditPointDialog, CompletePointDialog, Strategy modals)
- MSW provides realistic API mocking with request interception for all backend endpoints (including strategies)
- i18n mock in test-utils.tsx ensures all tests use English translations
- **Current: 185 tests passing across 23 test files (100% pass rate)**

### Development Workflow

1. Make code changes in `src/` directory
2. Run tests: `npm test`
3. Check the app at http://localhost:5173 (auto-refreshes)
4. Build for production: `npm run build`

## Troubleshooting

### Node version warnings
You may see warnings about Node.js version. The app works on Node 20.15.0 but recommends 20.19+ or 22.12+. Consider upgrading Node.js for optimal experience.

### Port 5173 already in use
Change the port in `vite.config.ts` or stop other Vite dev servers.

### API connection errors
Ensure the backend is running on http://localhost:8000:
```bash
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### CORS errors
Backend is configured to allow all origins in development. If you still see CORS errors, check the backend's CORS middleware configuration in `app/main.py`.

## Recent Enhancements

**Phase 6.5: Internationalization (Complete):**
- ✅ **French/English Support**: Full i18n with react-i18next
- ✅ **Translation Structure**: 9 namespaces (common, navigation, teams, players, competitions, games, points, lines, strategies)
- ✅ **Coverage**: ~300 translation strings across 58 component files
- ✅ **Language Selector**: IconButton in AppBar with instant switching (🇬🇧 EN / 🇫🇷 FR)
- ✅ **localStorage Persistence**: Language preference saved and restored
- ✅ **Sport Terminology**: Ultimate frisbee terms stay in English (Pull, Turnover, Break) per GLOSSARY.md
- ✅ **TypeScript Support**: Type-safe translation keys with autocomplete
- ✅ **Testing**: 185 tests passing (100% pass rate) with i18n mock using English

**Phase 6 Frontend (Complete):**
- ✅ **Strategy Management UI**: StrategiesPage with full CRUD, CreateStrategyModal, EditStrategyModal
- ✅ **4-Status Point Workflow**: Ready → Running → Scored → Completed with all dialogs
- ✅ **Strategy Integration**: SelectStrategyDialog during live tracking (auto-filtered by category)
- ✅ **Pull Tracking**: Inbound/Out of Bounds buttons for defensive points
- ✅ **Comments**: AddCommentDialog for adding/editing comments during live tracking
- ✅ **Resume Point**: Scored→Running for late calls/contested scores
- ✅ **CompletePointDialog**: Scored→Completed transition
- ✅ **UX Improvements**:
  - StartPointDialog: Chip-based line filter (wrapping, mobile-friendly)
  - Inline player count with color-coded feedback (green at 7/7)
  - FinishPointDialog: Cleaner UI, color-coded Won/Lost toggle buttons
  - Blue "Ongoing" status chips (was green)
  - Gradient-colored offense/defense icons (navy/sky blue)
- ✅ **Technical Improvements**:
  - Timer properly restarts when resuming scored points
  - Optimistic cache updates for smooth transitions (no UI flicker)
  - Code cleanup: Simplified timer rendering, consolidated duplicate code
- ⏳ **ABBA Gender Rule**: Not yet implemented (frontend validation only)

**Phase 5 Complete:**
- ✅ Lines management (create, edit, delete lines with player selection)
- ✅ Game player selection from competition roster
- ✅ 3-status game lifecycle (Ready → Started → Ended)
- ✅ Generic AddPlayersModal component (~1240 lines of code deduplication)
- ✅ Line filtering in StartPointDialog for quick player selection
- ✅ Won/Lost/Tie display on game cards with color-coded outcomes
- ✅ Player management disabled for finished games
- ✅ EditPointDialog validation fixes for points under 1 minute

## Future Enhancements

The application roadmap includes:
- **Strategy Management UI**: Pages and modals to create/edit/delete strategies (service layer complete)
- **ABBA Gender Rule**: Frontend validation for alternating 4M+3W / 3M+4W pattern (Phase 6 Frontend)
- **Game Timer Fix**: Start timer with first running point, not game start button
- **Calls & Turnovers**: Track fouls, violations, and turnover events (Phase 7)
- **Advanced Statistics**: Comprehensive analytics dashboard with charts and metrics (Phase 8)
- **PWA Features**: Offline support, install prompt, service worker caching

## Contributing

1. Follow the existing code organization patterns
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Update this README if adding new features

## License

See LICENSE file in the root directory.
