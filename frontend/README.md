# Ultimate Frisbee Stats - Frontend

React + TypeScript Progressive Web App for tracking ultimate frisbee team statistics, built with clean architecture and comprehensive testing.

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
│   │   │   └── ErrorState.tsx
│   │   ├── teams/        # Team domain components
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamsGrid.tsx
│   │   │   └── EmptyTeamsState.tsx
│   │   ├── players/      # Player domain components
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── PlayersGrid.tsx
│   │   │   └── EmptyPlayersState.tsx
│   │   ├── games/        # Game domain components
│   │   │   ├── GameCard.tsx
│   │   │   ├── GamesGrid.tsx
│   │   │   └── EmptyGamesState.tsx
│   │   ├── points/       # Point tracking components (Phase 3)
│   │   │   ├── LivePointTracker.tsx    # Main live tracking interface
│   │   │   ├── PointTimer.tsx          # Real-time elapsed time display
│   │   │   ├── PlayerSelector.tsx      # 7-player selection UI
│   │   │   ├── PointHistoryList.tsx    # List of all points
│   │   │   └── PointHistoryItem.tsx    # Individual point display
│   │   └── modals/       # Modal dialogs
│   │       ├── CreateTeamModal.tsx
│   │       ├── AddPlayerModal.tsx
│   │       ├── EditPlayerModal.tsx
│   │       ├── CreateGameModal.tsx
│   │       ├── EditGameModal.tsx
│   │       ├── StartPointDialog.tsx    # Start point + select players
│   │       ├── FinishPointDialog.tsx   # Finish active point (won/lost)
│   │       └── EditPointDialog.tsx     # Edit point timestamps/players
│   ├── pages/            # Page components (routes)
│   │   ├── HomePage.tsx       # Landing page
│   │   ├── TeamsPage.tsx      # Team list/management
│   │   ├── TeamDetailPage.tsx # Individual team with players
│   │   ├── GamesPage.tsx      # Game list/management
│   │   └── GameDetailPage.tsx # Individual game with score and points
│   ├── services/         # API layer (mirrors backend CRUD)
│   │   ├── api.ts        # Axios client configuration
│   │   ├── teams.ts      # Team API calls
│   │   ├── players.ts    # Player API calls
│   │   ├── games.ts      # Game API calls
│   │   ├── points.ts     # Point API calls
│   │   └── index.ts      # Central export point
│   ├── types/            # TypeScript types (mirrors backend schemas)
│   │   └── index.ts      # All type definitions
│   ├── hooks/            # Custom React hooks
│   ├── test/             # Testing utilities
│   │   ├── setup.ts      # Test configuration
│   │   └── test-utils.tsx # Custom render with providers
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

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests with UI

```bash
npm run test:ui
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Current Test Coverage

Comprehensive test coverage for critical user flows:

**Phase 1 - Team & Player Management:**

**TeamsPage:**
- Shows empty state when no teams exist
- Allows user to create a new team
- Displays multiple teams in a grid

**TeamDetailPage:**
- Shows empty state when team has no players
- Allows user to add a player to the team
- Allows user to edit a player
- Allows user to delete a player

**Phase 2 - Game Management:**

**GamesPage:**
- Shows empty state when no games exist
- Creates new game successfully with team selection
- Displays games in grid when games exist
- Navigates to game detail on card click

**GameDetailPage:**
- Displays game information correctly
- Shows score and empty points list
- Edits game successfully
- Finishes game successfully
- Deletes game with confirmation

**Phase 3 - Live Point Tracking:**

**PointTimer:**
- Displays elapsed time correctly
- Updates timer every second
- Formats time as MM:SS or H:MM:SS

**PlayerSelector:**
- Allows selecting exactly 7 players
- Shows validation error when not enough players selected
- Displays selected player count
- Allows deselecting players

**FinishPointDialog:**
- Opens and closes correctly
- Validates outcome selection (won/lost)
- Submits finish point request
- Handles API errors

**EditPointDialog:**
- Displays point number in title
- Initializes form with point data
- Allows changing starting position and outcome
- Validates player selection (exactly 7)
- Validates end time is after start time
- Handles successful updates

### Test Architecture

Tests use modern React testing best practices:
- **Testing Library** (`@testing-library/react`): User-centric component testing
- **MSW (Mock Service Worker)** (`msw`): API mocking with HTTP request interception
- **Happy DOM** (`happy-dom`): Lightweight DOM implementation for tests
- **Vitest**: Fast test runner with native ESM support

**Test Structure:**
```
src/
├── test/
│   ├── setup.ts              # MSW server setup, global test config
│   ├── test-utils.tsx        # Custom render with providers
│   ├── vitest-env.d.ts       # TypeScript declarations
│   └── mocks/
│       └── handlers.ts       # MSW request handlers (API mocks)
├── pages/
│   └── __tests__/
│       ├── TeamsPage.test.tsx
│       ├── TeamDetailPage.test.tsx
│       ├── GamesPage.test.tsx
│       └── GameDetailPage.test.tsx
```

**Mock API with MSW:**
The test suite uses MSW to intercept HTTP requests and provide realistic API responses:
- In-memory data store simulates backend state
- Full CRUD operations for teams and players
- Automatic state management between tests
- No actual backend required for tests

Example test:
```typescript
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import TeamsPage from '../TeamsPage';

test('allows user to create a new team', async () => {
  const user = userEvent.setup();
  render(<TeamsPage />);

  // Click create button
  const createButton = screen.getByRole('button', { name: /create your first team/i });
  await user.click(createButton);

  // Fill form
  const nameInput = screen.getByLabelText(/team name/i);
  await user.type(nameInput, 'Test Team');

  // Submit
  const submitButton = screen.getByRole('button', { name: /create team/i });
  await user.click(submitButton);

  // Verify team appears
  await waitFor(() => {
    expect(screen.getByText('Test Team')).toBeInTheDocument();
  });
});
```

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

### Players Service (`services/players.ts`)
- `createPlayer(data: PlayerCreate): Promise<Player>`
- `getPlayer(playerId: number): Promise<Player>`
- `updatePlayer(playerId, data: PlayerUpdate): Promise<Player>`
- `deletePlayer(playerId: number): Promise<void>`

### Games Service (`services/games.ts`)
- `createGame(data: GameCreate): Promise<Game>`
- `getGame(gameId: number): Promise<GameDetail>`
- `updateGame(gameId, data: GameUpdate): Promise<Game>`
- `finishGame(gameId: number): Promise<Game>`
- `deleteGame(gameId: number): Promise<void>`
- `getGamePoints(gameId: number): Promise<PointWithPlayers[]>`

### Points Service (`services/points.ts`) - Phase 3
- `startPoint(data: PointCreate): Promise<Point>` - Create active point
- `getActivePoint(gameId: number): Promise<PointWithPlayers | null>` - Get active point
- `finishPoint(pointId, data: PointFinish): Promise<Point>` - Complete point (won/lost)
- `cancelPoint(pointId: number): Promise<void>` - Cancel active point
- `updatePoint(pointId, data: PointUpdate): Promise<Point>` - Edit point details
- `deletePoint(pointId: number): Promise<void>` - Delete completed point

## TypeScript Types

All types in `src/types/index.ts` exactly match the backend Pydantic schemas:

- **Team types**: `Team`, `TeamCreate`, `TeamUpdate`, `TeamWithPlayers`
- **Player types**: `Player`, `PlayerCreate`, `PlayerUpdate`
- **Game types**: `Game`, `GameCreate`, `GameUpdate`, `GameWithScore`, `GameDetail`
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

### Theme Customization

Edit the theme in `App.tsx`:
```typescript
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // Blue
    },
    secondary: {
      main: "#dc004e", // Pink
    },
  },
});
```

### Styling Approach

- **sx prop**: Inline styles with theme access
- **Emotion**: CSS-in-JS for dynamic styling
- **No custom CSS**: MUI handles all styling needs

## Development Workflow

### 1. Make code changes
Edit files in `src/` directory

### 2. Run tests
```bash
npm test
```

### 3. Check the app
- Browser auto-refreshes at http://localhost:5173
- Test API endpoints with backend running on http://localhost:8000

### 4. Build for production
```bash
npm run build
```

## Current Implementation Status

### ✅ Completed - Phase 1: Team & Player Management
- Project setup with Vite + React + TypeScript
- Complete TypeScript types matching backend schemas
- API service layer with all endpoints
- Testing infrastructure:
  - Vitest + React Testing Library + MSW
  - Happy DOM for lightweight test environment
  - TypeScript support with @testing-library/jest-dom matchers
- Routing with React Router
- TanStack Query for server state
- Material UI styling with theme configuration
- Layout component with AppBar navigation
- Team management (CRUD operations) - **fully tested**
- Player management with modals - **fully tested**
- Shared components (PageHeader, LoadingState, ErrorState)
- Component architecture: domain-driven folders (teams/, players/, modals/)

### ✅ Completed - Phase 2: Game Management
- Games list page with grid layout - **fully tested**
- Game creation modal with team selection
- Game detail page with scores and actions
- Edit game modal
- Finish game functionality (changes status from "In Progress" to "Finished")
- Delete game with confirmation dialog
- Game cards showing opponent, date, score, status badges, and team names
- Empty state components for games
- Full CRUD operations for games - **fully tested**
- MSW mocks for all game endpoints

### 🎉 Complete - Phase 3: Live Point Tracking
#### ✅ Implemented Features
- **Backend (120 tests passing):**
  - Point model with status (active/completed), start_datetime, end_datetime
  - Two-state point workflow (active → completed)
  - New endpoints: POST /points/:id/finish, DELETE /points/:id/cancel, GET /points/games/:id/active
  - Validation: only one active point per game, exactly 7 players required
  - Duration calculation for playing time stats
  - Timezone-aware datetime handling with proper 'Z' suffix serialization

- **Frontend (43 tests passing):**
  - LivePointTracker component - Main interface for live point tracking
  - PointTimer component - Real-time elapsed time display with correct timezone handling
  - PlayerSelector component - Exactly 7 players required
  - StartPointDialog - Select players and start point
  - FinishPointDialog - Mark point as won/lost (fully tested with 6 tests)
  - EditPointDialog - Edit timestamps and player lineup (fully tested with 11 tests)
  - PointHistoryList & PointHistoryItem - View all points with durations
  - Active point polling (every 5 seconds) using React Query
  - Integration in GameDetailPage with live tracking UI

#### 🐛 Bug Fixes Applied
- Fixed timezone handling - timer now correctly starts at 00:00 instead of 1H offset
- Fixed duration_seconds computation using @computed_field decorator
- Fixed EditPointDialog prop mismatch preventing dialog from opening

#### 📱 Mobile-First UI Enhancements
- Point cards with offense/defense icons (Sports/Shield icons)
- Strategic context badges: "Break!" (win on defense), "Broken" (lose on offense)
- Responsive action buttons (icon-only on mobile, full text on desktop)
- Points ordered descending (most recent first)
- Clean mobile layout optimized for sideline use during live games
- Mobile-responsive layouts using MUI breakpoints (xs, sm, md, lg)

#### 📝 Future Enhancements (Phase 4+)
- Individual player event tracking (goals, assists, blocks, turnovers)
- Statistics dashboard (player stats, team stats)
- Advanced analytics and charts
- Offline support (PWA features)
- E2E tests with Playwright (optional)

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

## Progressive Web App (Future)

The application is designed to become a PWA with:
- Offline data access
- Install prompt on mobile devices
- Service worker for caching
- Background sync when online

## Contributing

1. Follow the existing code organization patterns
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Update this README if adding new features

## License

See LICENSE file in the root directory.
