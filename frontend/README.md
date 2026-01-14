# Ultimate Frisbee Stats - Frontend

React + TypeScript Progressive Web App for tracking ultimate frisbee team statistics, built with clean architecture and comprehensive testing.

## Architecture

### Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Layout.tsx    # Main app layout with navigation
│   ├── pages/            # Page components (routes)
│   │   ├── HomePage.tsx  # Landing page
│   │   ├── TeamsPage.tsx # Team list/management
│   │   └── GamesPage.tsx # Game tracking
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
│   └── index.css         # Tailwind CSS imports
├── public/               # Static assets
├── vitest.config.ts      # Vitest configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

### Design Principles

- **Clean separation of concerns**: Pages → Components → Services → API
- **Domain-driven organization**: Code organized by business domain (teams, players, games, points)
- **Type safety**: TypeScript types matching backend Pydantic schemas exactly
- **Server state management**: TanStack Query for caching and synchronization
- **Testing infrastructure**: Vitest + React Testing Library (ready for comprehensive tests)
- **Styling**: Tailwind CSS for mobile-first responsive design

### Technology Stack

**Core Framework:**
- React 19.2.0 - UI library
- TypeScript 5.9.3 - Type safety
- Vite 7.2.4 - Build tool and dev server

**Routing & State:**
- React Router 7.12.0 - Client-side routing
- TanStack Query 5.90.17 - Server state management

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS processing

**HTTP Client:**
- Axios 1.13.2 - API requests with interceptors

**Testing:**
- Vitest 4.0.17 - Unit and integration testing
- React Testing Library 16.3.1 - Component testing
- jsdom 27.4.0 - DOM implementation for tests

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

**Development Dependencies:**
- `vite` + `@vitejs/plugin-react` - Build tooling
- `typescript` - Type checking
- `tailwindcss` + `postcss` + `autoprefixer` - Styling
- `vitest` + Testing Library - Testing framework
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

### Test Architecture

Tests follow the same clean architecture as the backend:
- **Test utilities** (`src/test/test-utils.tsx`): Custom render with providers
- **Setup file** (`src/test/setup.ts`): Global test configuration
- **Component tests**: Test components in isolation
- **Integration tests**: Test full user flows with mocked API

Example test structure:
```typescript
import { render, screen } from '../test/test-utils';
import TeamsPage from '../pages/TeamsPage';

test('renders team list', async () => {
  render(<TeamsPage />);
  expect(await screen.findByText('Teams')).toBeInTheDocument();
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

### Points Service (`services/points.ts`)
- `createPoint(data: PointCreate): Promise<Point>`
- `getPoint(pointId: number): Promise<PointWithPlayers>`
- `updatePoint(pointId, data: PointUpdate): Promise<Point>`
- `deletePoint(pointId: number): Promise<void>`

## TypeScript Types

All types in `src/types/index.ts` exactly match the backend Pydantic schemas:

- **Team types**: `Team`, `TeamCreate`, `TeamUpdate`, `TeamWithPlayers`
- **Player types**: `Player`, `PlayerCreate`, `PlayerUpdate`
- **Game types**: `Game`, `GameCreate`, `GameUpdate`, `GameWithScore`, `GameDetail`
- **Point types**: `Point`, `PointCreate`, `PointUpdate`, `PointWithPlayers`

This ensures type safety across the entire application.

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

### ✅ Completed
- Project setup with Vite + React + TypeScript
- Complete TypeScript types matching backend schemas
- API service layer with all endpoints
- Testing infrastructure (Vitest + React Testing Library)
- Routing with React Router
- TanStack Query for server state
- Tailwind CSS styling
- Basic pages: Home, Teams, Games
- Layout component with navigation

### 🚧 In Progress / TODO
- Team detail page with player roster
- Game tracking page with live scoring
- Point entry form with player selection
- Game detail/review page
- Statistics dashboard
- Offline support (PWA features)
- Comprehensive test suite

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
