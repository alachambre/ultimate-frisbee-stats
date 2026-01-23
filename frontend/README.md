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

**Live Point Tracking:**
- Real-time point-by-point tracking during games
- Select 7 players for each point with line filtering
- Mark points as offense or defense
- Record point outcomes (won/lost)
- View strategic context (breaks, holds)
- Edit point details and player lineups
- Validation fixes for points under 1 minute duration

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
│   │   ├── Layout.tsx    # Main app layout with AppBar
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
│   │   ├── games/        # Game domain components
│   │   │   ├── GameCard.tsx
│   │   │   ├── GamesGrid.tsx
│   │   │   └── EmptyGamesState.tsx
│   │   ├── points/       # Point tracking components
│   │   │   ├── LivePointTracker.tsx    # Main live tracking interface
│   │   │   ├── PointTimer.tsx          # Real-time elapsed time display
│   │   │   ├── PlayerSelector.tsx      # 7-player selection UI
│   │   │   ├── PointHistoryList.tsx    # List of all points
│   │   │   └── PointHistoryItem.tsx    # Individual point display
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
│   │       ├── CreateGameModal.tsx
│   │       ├── EditGameModal.tsx
│   │       ├── StartPointDialog.tsx         # Enhanced with line filtering
│   │       ├── FinishPointDialog.tsx
│   │       └── EditPointDialog.tsx
│   ├── pages/            # Page components (routes)
│   │   ├── HomePage.tsx            # Landing page
│   │   ├── TeamsPage.tsx           # Team list/management
│   │   ├── TeamDetailPage.tsx      # Individual team with players and lines
│   │   ├── CompetitionsPage.tsx    # Competition list/management
│   │   ├── CompetitionDetailPage.tsx # Individual competition with roster and games
│   │   ├── LinesPage.tsx           # Line list/management (integrated into TeamDetailPage)
│   │   ├── LineDetailPage.tsx      # Individual line with player management
│   │   ├── GamesPage.tsx           # Game list/management
│   │   └── GameDetailPage.tsx      # Individual game with score and points
│   ├── services/         # API layer (mirrors backend CRUD)
│   │   ├── api.ts        # Axios client configuration
│   │   ├── teams.ts      # Team API calls
│   │   ├── competitions.ts # Competition API calls
│   │   ├── players.ts    # Player API calls
│   │   ├── lines.ts      # Line API calls
│   │   ├── games.ts      # Game API calls
│   │   ├── points.ts     # Point API calls
│   │   └── index.ts      # Central export point
│   ├── types/            # TypeScript types (mirrors backend schemas)
│   │   └── index.ts      # All type definitions
│   ├── hooks/            # Custom React hooks
│   ├── test/             # Testing utilities
│   │   ├── setup.ts      # Test configuration
│   │   ├── test-utils.tsx # Custom render with providers
│   │   └── mocks/        # MSW handlers for API mocking
│   │       └── handlers.ts  # Request handlers for all API endpoints
│   ├── App.tsx           # Root component with providers
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
- `startPoint(data: PointCreate): Promise<Point>` - Create active point
- `getActivePoint(gameId: number): Promise<PointWithPlayers | null>` - Get active point
- `finishPoint(pointId, data: PointFinish): Promise<Point>` - Complete point (won/lost)
- `cancelPoint(pointId: number): Promise<void>` - Cancel active point
- `updatePoint(pointId, data: PointUpdate): Promise<Point>` - Edit point details
- `deletePoint(pointId: number): Promise<void>` - Delete completed point

## TypeScript Types

All types in `src/types/index.ts` exactly match the backend Pydantic schemas:

- **Team types**: `Team`, `TeamCreate`, `TeamUpdate`, `TeamWithPlayers`
- **Competition types**: `Competition`, `CompetitionCreate`, `CompetitionUpdate`, `CompetitionWithPlayers`, `PlayerIdsRequest`, `CompetitionStatus`, `Gender`
- **Player types**: `Player`, `PlayerCreate`, `PlayerUpdate` (includes `gender: Gender` field)
- **Line types**: `Line`, `LineCreate`, `LineUpdate`, `LineWithPlayers`
- **Game types**: `Game`, `GameCreate`, `GameUpdate`, `GameWithScore`, `GameDetail`, `GameStatus` (ready/started/ended)
- **Point types**: `Point`, `PointCreate`, `PointUpdate`, `PointWithPlayers`

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
- Modal tests: Integration tests for all dialogs (Create/Edit modals, StartPointDialog, FinishPointDialog, EditPointDialog)
- MSW provides realistic API mocking with request interception for all backend endpoints

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
- **Strategies**: Named plays (offensive/defensive) assignable to points (Phase 6 Backend Complete)
- **Enhanced Point Tracking**: ABBA mixity validation, field side tracking, pull statistics, strategy selection (Phase 6 Frontend)
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
