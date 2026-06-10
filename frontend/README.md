# Frontend (React + Vite) - Dev Guide

React + TypeScript PWA for Ultimate Frisbee Stats. This doc is intentionally short and focused on local development.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at `http://localhost:8000`.

## Configuration

The API base URL is controlled by `VITE_API_BASE_URL`.

```bash
cp .env.example .env
# set VITE_API_BASE_URL if you want a non-default backend
```

For the authentication foundation, the frontend also expects:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The sign-in UI is only shown when both Supabase variables are configured.

## Authentication Flow

The frontend auth flow is:

- Supabase client manages the browser session
- `AuthProvider` listens to session changes
- the current access context is bootstrapped from `GET /auth/me`
- the API client attaches the Supabase access token when available

Current roles:

- `public`
- `team_member`
- `team_analyst`
- `admin`

Important rollout behavior:

- `off`
  - safe deployment mode
  - the UI can still show sign-in if configured, but backend role resolution stays
    effectively public
- `shadow`
  - recommended for validating login, `/auth/me`, and admin provisioning
- `enforced`
  - full route, navigation, and action gating

Special case:

- `/admin/users` is treated as strict admin-only UI and is not meant to be usable
  while the backend is still in `off`

## Local Auth Testing

If you want to test login locally:

1. Copy `.env.example` to `.env`
2. Set:
   - `VITE_API_BASE_URL=http://localhost:8000`
   - `VITE_SUPABASE_URL=<your-supabase-url>`
   - `VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>`
3. Run the backend in at least `AUTH_ENFORCEMENT_MODE=shadow`

Notes:

- On desktop, sign-in is in the top app bar.
- On mobile, sign-in is inside the drawer menu.
- After changing Vite env vars, restart the dev server.

## Tests and Build

```bash
npm test
npm run test:coverage
npm run build
```

## Project Layout

- `src/components/` UI components organized by domain
- `src/pages/` default route pages
- `src/legacy-ui/` legacy route tree, pages, and components that are clearly old-UI-only
- `src/services/` API clients per entity
- `src/types/` shared TypeScript types
- `src/test/` MSW and test utilities
- `src/locales/` i18n resources

## Statistics Workflow

The `/statistics` page is filter-driven:

- pick one team
- optionally narrow the dataset with competitions and games
- optionally apply player filters when the current role can access them

The Team tab shows aggregate values. The Evolution tab uses
`GET /statistics/teams/{team_id}/evolution` to plot game-by-game team metrics.
The backend owns metric IDs, formulas, labels, formats, and default presets.
The frontend only renders the metadata and enforces same-unit metric selection.

Chart.js surfaces stay split by purpose:

- `GameTrendsSection` is lazy-loaded for single-game point timelines
- `StatisticsEvolutionChart` is lazy-loaded from the Evolution tab

Statistics are analytical, not live-tracker state. The backend may cache
read-only statistics responses for up to 5 minutes, while live game state stays
immediate. The statistics header exposes a refresh action that invalidates the
current frontend dataset queries after edits.

## Conventions

- Material UI v7 with semantic theme values only (no hardcoded colors)
- Dialog form state: initialize from props and use `key={id}` to force remounts
- i18n via react-i18next; sport terms remain in English (see `GLOSSARY.md`)

## More Docs

- `requirements.md` for feature requirements
- `data-model-design.md` for the full data model
- `DEPLOYMENT.md` for deployment steps
