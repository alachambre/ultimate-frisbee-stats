# Authentication & Permissions Implementation Plan

## Status

Implemented through Milestone 9

## Objective

Introduce authentication and role-based permissions for Monkey Statistics with four access levels:

- `public`: anonymous access for spectators and friends
- `team_member`: authenticated full CRUD on operational data, but no statistics
- `team_analyst`: authenticated full access to the app
- `admin`: team_analyst access plus user management

This v1 assumes a single team and global roles for the whole app.

## Product Rules

### Access levels

#### `public`
- No authentication required
- Can browse competitions and games
- Can view live tracking, score, roster, point history, stoppages/calls, turnovers, halftime, and timeline
- Cannot access statistics or exports
- Cannot see any strategy information
- Cannot see any free-text comments

#### `team_member`
- Authentication required
- Full CRUD on team, players, lines, strategies, competitions, games, points, stoppages, turnovers, and halftimes
- Can see comments and strategies
- Cannot access statistics or exports

#### `team_analyst`
- Same permissions as `team_member`
- Can access statistics and CSV exports

#### `admin`
- Same permissions as `team_analyst`
- Can manage user accounts and roles

### Data redaction rules for `public`

Anonymous responses must never expose:

- game comments
- point comments
- point strategy assignment or strategy details
- stoppage comments
- turnover comments
- halftime comments

Public users can still see structured event data such as timestamps, stoppage type, turnover ownership, point outcome, field side, score, and roster.

## Recommended Architecture

### Identity

Use Supabase Auth for authentication:

- frontend signs users in with Supabase
- frontend sends bearer token to FastAPI
- backend verifies the Supabase JWT
- backend resolves the local app user and role

### Authorization

Keep authorization in the FastAPI backend:

- backend is the source of truth for role checks
- frontend hides routes, buttons, and fields for UX
- backend returns `401` for missing/invalid auth and `403` for insufficient permissions

### Role storage

Store app roles in the application database, separate from Supabase Auth identity records:

- `users` table
- link to Supabase user id via `auth_user_id`
- store `email`, `role`, `is_active`, audit timestamps

This keeps product permissions under app control while letting Supabase handle passwords and sessions.

## Key Design Decisions

### 1. Global roles only for v1

Because the app currently supports one team operationally, roles are global and not team-scoped.

### 2. Public-safe schemas

Do not rely only on frontend hiding. Create explicit public-safe response schemas or sanitizers for anonymous reads so protected fields are not returned accidentally.

### 3. Same read endpoints, conditional redaction

Prefer keeping the main game and competition read routes and returning redacted payloads for anonymous users rather than building a second "public app".

### 4. Statistics are team_analyst-only everywhere

This includes:

- `/statistics/*`
- `/exports/*`
- statistics entry points in the UI

### 5. Admin user management goes through backend

The frontend should never use a Supabase service role key. Admin actions should call backend endpoints, and the backend can use a service role client when needed.

## Backend Capability Matrix

### Public read surface

Public access should be limited to game and competition spectator workflows:

- `GET /competitions`
- `GET /competitions/{competition_id}`
- `GET /competitions/{competition_id}/games`
- `GET /games`
- `GET /games/{game_id}`
- `GET /games/{game_id}/points`
- `GET /games/{game_id}/players`
- `GET /points/{point_id}`
- `GET /points/games/{game_id}/active`
- `GET /points/games/{game_id}/running`
- `GET /stoppages/points/{point_id}/stoppages`
- `GET /turnovers/points/{point_id}/turnovers`
- `GET /halftimes/games/{game_id}/halftime`

Notes:

- `GET /teams*` should stay authenticated unless we explicitly decide to make team browsing public.
- Public responses on the routes above must be sanitized.

### Team member+ routes

All operational CRUD routes require at least `team_member`:

- teams
- players
- lines
- strategies
- competitions write actions
- games write actions
- points write actions
- stoppages write actions
- turnovers write actions
- halftimes write actions

### Team analyst+ routes

- all `/statistics/*`
- all `/exports/*`

### Admin-only routes

New endpoints under `/auth` or `/users`, for example:

- `GET /auth/me`
- `GET /users`
- `POST /users`
- `PATCH /users/{user_id}`
- `POST /users/{user_id}/reset-password` or invite flow
- `POST /users/{user_id}/deactivate`

## Frontend Capability Matrix

### Public

- Can use the app without signing in
- Sees navigation for competitions and games only
- Does not see strategy sections, comment sections, statistics page, export actions, or edit buttons
- Can open a login flow from the header

### Team member

- Sees all operational pages and edit actions
- Does not see statistics navigation or statistics entry points
- Cannot trigger export actions

### Team analyst

- Sees the full existing app, including statistics and exports

### Admin

- Same as team_analyst
- Sees user management page or admin section

## Proposed Milestones

## Milestone 1: Permission Model & Technical Foundation

### Scope

Define the shared vocabulary and add the basic auth plumbing dependencies.

### Deliverables

- backend auth module structure
- frontend auth module structure
- role and capability definitions shared within each app
- environment variable contract documented

### Tasks

- Add backend dependencies for JWT verification and Supabase integration if needed
- Add frontend Supabase client dependency
- Define role enum: `public`, `team_member`, `team_analyst`, `admin`
- Define backend permission helpers such as:
  - `require_team_member()`
  - `require_team_analyst()`
  - `require_admin()`
  - `get_request_access_context()`
- Define frontend capability helpers such as:
  - `canEditData`
  - `canViewStatistics`
  - `canManageUsers`
  - `isPublic`

### Acceptance criteria

- Both apps have a clear auth/permission module skeleton
- Roles and capabilities are declared once, not duplicated ad hoc across components
- Required env vars are listed for local and production

### Tests

#### UTests

- Role enums and capability maps return the expected permissions for `public`, `team_member`, `team_analyst`, and `admin`
- Backend permission helper functions resolve the expected access thresholds
- Frontend capability helpers derive the correct booleans from a given role

#### ITests

- Backend and frontend app startup still succeeds with the new auth/permission module wiring
- Shared auth configuration can be initialized from environment variables in local/test setup

## Milestone 2: User Model, Supabase Integration, and Bootstrap

### Scope

Create the app-level user table and the initial bootstrap path for the first admin.

### Deliverables

- `users` table in SQLAlchemy model layer
- Supabase migration for production
- initial admin bootstrap strategy

### Tasks

- Add `User` model with fields:
  - `id`
  - `auth_user_id`
  - `email`
  - `role`
  - `is_active`
  - `created_at`
  - `updated_at`
- Add matching Pydantic schemas
- Add `supabase/migrations/...sql` migration
- Ensure local SQLite can create the table
- Decide and implement first-admin bootstrap:
  - recommended: env-driven bootstrap command or startup-safe idempotent script

### Acceptance criteria

- Production schema includes the app users table
- Local dev database can hold user records
- There is a documented and repeatable way to create the first admin

### Tests

#### UTests

- User model and schema validation accept expected fields and reject invalid role values
- First-admin bootstrap helper is idempotent and does not create duplicates

#### ITests

- Supabase migration creates the `users` table correctly
- Local SQLite initialization creates the auth tables successfully
- First-admin bootstrap flow creates a usable admin account record

## Milestone 3: Backend Authentication Context

### Scope

Teach FastAPI to understand anonymous vs authenticated requests and resolve the current app role.

### Deliverables

- JWT verification dependency
- request access context object
- `/auth/me` endpoint

### Tasks

- Parse bearer token from `Authorization` header
- Verify Supabase JWT signature and claims
- Load local user by `auth_user_id`
- Treat missing token as `public`
- Treat invalid token as `401`
- Treat inactive users as `403`
- Return a normalized access context containing:
  - auth state
  - role
  - capabilities
  - email
- Add `GET /auth/me` for frontend bootstrap

### Acceptance criteria

- Anonymous requests resolve to `public`
- Valid authenticated requests resolve to the correct role
- Invalid tokens are rejected
- Frontend can fetch one endpoint to learn the current role/capabilities

### Tests

#### UTests

- Bearer token parsing handles missing, malformed, and valid headers
- Access-context resolution returns the correct role and capabilities for anonymous and authenticated requests
- Invalid token and inactive-user branches return the expected auth outcomes

#### ITests

- `GET /auth/me` returns `public` for anonymous requests
- `GET /auth/me` returns the correct role for valid authenticated requests
- Invalid tokens return `401`
- Inactive users return `403`

## Milestone 4: Public-Safe Read Schemas and Sanitizers

### Scope

Protect sensitive fields on anonymous reads.

### Deliverables

- public-safe serializers or schemas for games, points, stoppages, turnovers, and halftime
- backend tests proving comments and strategies never leak to anonymous users

### Tasks

- Audit all read payloads used by spectator flows
- Implement explicit sanitization for anonymous access
- Prefer dedicated public DTOs where the shape materially differs
- Keep structured event information intact while stripping:
  - strategy
  - comments
- Review game detail responses carefully because they aggregate multiple nested objects

### Acceptance criteria

- Anonymous users can still follow a game end to end
- Anonymous payloads never include strategy or comment content
- Authenticated team_members/team_analysts/admins still receive full payloads

### Tests

#### UTests

- Public sanitizers strip comments and strategy fields from game, point, stoppage, turnover, and halftime payloads
- Full-access serializers preserve the original payload for authenticated roles

#### ITests

- Anonymous requests to public game and competition read endpoints return redacted payloads
- Authenticated requests to the same endpoints still return full payloads
- Nested game detail payloads do not leak protected fields to `public`

## Milestone 5: Backend Route Authorization Rollout

### Scope

Apply permission checks router by router.

### Deliverables

- consistent role enforcement across all routers
- test coverage for `401`, `403`, and allowed cases

### Tasks

- Protect all mutation routes with `team_member+`
- Protect all statistics and export routes with `team_analyst+`
- Protect admin routes with `admin`
- Decide whether some non-spectator reads should also require auth:
  - recommended: keep team, player, line, and strategy listing/details authenticated
- Centralize reusable route dependencies to avoid drift

### Acceptance criteria

- Anonymous users can only reach the approved spectator endpoints
- Team members cannot access statistics or exports
- Team analysts can access all current product routes except admin-only endpoints
- Admin-only endpoints are inaccessible to non-admin users

### Tests

#### UTests

- Route guard helpers enforce `team_member`, `team_analyst`, and `admin` thresholds correctly
- Permission mapping remains consistent across all guarded route categories

#### ITests

- Anonymous users receive `401` or `403` on protected routes and can still access approved public routes
- `team_member` users are blocked from statistics and exports
- `team_analyst` users can access statistics and exports
- Non-admin authenticated users are blocked from admin-only endpoints

## Milestone 6: Frontend Authentication Bootstrap and Route Gating

### Scope

Introduce login state in the React app and gate pages/actions by capability.

### Deliverables

- auth provider/context
- Supabase session integration
- capability-aware routing and navigation

### Tasks

- Add Supabase client setup
- Create `AuthProvider` that:
  - listens to session changes
  - stores session/token
  - calls `/auth/me`
  - exposes role/capabilities/loading state
- Attach bearer token in `frontend/src/services/api.ts`
- Add login/logout UI
- Hide statistics route and nav for non-team_analysts
- Hide admin route/nav for non-admins
- Redirect unauthorized page visits to a safe page

### Acceptance criteria

- Public users can browse without logging in
- Logging in refreshes visible permissions without a full reload
- Team members never see statistics navigation
- Unauthorized direct navigation is blocked gracefully

### Tests

#### UTests

- `AuthProvider` updates state correctly for anonymous, signed-in, and signed-out transitions
- API client attaches bearer tokens only when a session exists
- Route and navigation gating helpers derive the right behavior from capabilities

#### ITests

- Logging in updates the visible navigation and protected routes
- Logging out returns the app to public mode cleanly
- Direct navigation to protected routes redirects or blocks as expected for each role

## Milestone 7: Frontend Public Redaction and Action Gating

### Scope

Make the UI match the backend permissions and avoid showing unavailable actions or fields.

### Deliverables

- capability-aware layout and page actions
- public-safe rendering for comments/strategy sections
- team_member/team_analyst/admin gated controls

### Tasks

- Update `Layout.tsx` navigation based on capabilities
- Hide edit buttons, mutation dialogs, and destructive actions for `public`
- Hide statistics entry points for `team_member`
- Hide strategy and comment sections for `public` even if data is absent
- Review:
  - game detail page
  - live point tracker
  - point history
  - competition detail
  - team detail
  - statistics page
- Add clear UX copy when a feature requires login

### Acceptance criteria

- Public users get a clean spectator experience without dead buttons
- Team members can fully operate games without seeing stats
- Team analysts experience the current full app

### Tests

#### UTests

- Key components render or hide action buttons based on capabilities
- Public rendering paths do not show comment or strategy sections when payloads are redacted
- Team member rendering paths do not expose statistics entry points

#### ITests

- Public users can navigate spectator pages without seeing forbidden controls
- Team members can use operational workflows while remaining blocked from statistics UX
- Team analysts can access the full UI without regressions on existing pages

## Milestone 8: Admin User Management

### Scope

Add a minimal but complete admin workflow for account lifecycle and role assignment.

### Deliverables

- admin backend endpoints
- admin frontend page
- user creation / activation / role update flow

### Tasks

- Implement backend admin service to:
  - list users
  - create or invite users
  - change roles
  - deactivate/reactivate users
- Decide user onboarding flow:
  - recommended: admin creates user, user receives invite or reset-password flow via Supabase
- Build frontend admin page
- Add safeguards:
  - prevent removing the last active admin
  - audit log friendly server-side events in logs

### Acceptance criteria

- Admin can create a team_member, team_analyst, or admin account
- Admin can change a role safely
- Admin can disable an account
- Non-admins cannot access any user-management action

### Tests

#### UTests

- Admin user service applies role changes and activation state changes correctly
- Safeguards prevent invalid actions such as removing the last active admin

#### ITests

- Admin can create, update, and deactivate accounts through backend endpoints
- Admin UI completes the main user-management flows successfully
- Non-admin users are denied on all user-management routes and screens

## Milestone 9: Testing, Documentation, and Deployment

### Scope

Stabilize the feature for local dev and production rollout.

### Deliverables

- backend auth/permission test suite
- frontend permission-gating tests
- deployment and runbook documentation

### Tasks

- Backend tests:
  - anonymous public read access
  - public redaction coverage
  - team_member denied on statistics
  - team_analyst allowed on statistics
  - admin-only user management
- Frontend tests:
  - nav gating
  - route gating
  - public redaction rendering
  - team_member statistics lockout
- Update docs:
  - `backend/README.md`
  - `frontend/README.md`
  - `DEPLOYMENT.md`
  - `AGENTS.md` if implementation changes conventions
- Validate required env vars in Render/Vercel/Supabase

### Acceptance criteria

- Automated tests cover the main role boundaries
- Deployment steps are documented
- Local setup instructions are complete enough for a fresh machine

### Tests

#### UTests

- Final regression suite keeps auth helpers, sanitizers, and capability logic covered
- New documentation-related configuration helpers remain validated where applicable

#### ITests

- Full role matrix smoke tests pass for `public`, `team_member`, `team_analyst`, and `admin`
- Frontend and backend integration remains green in CI with auth enabled
- Deployment configuration supports the required auth environment variables end to end

## Suggested Delivery Order

### Phase 1: Security foundation

1. Milestone 1
2. Milestone 2
3. Milestone 3

### Phase 2: Safe backend rollout

4. Milestone 4
5. Milestone 5

### Phase 3: Frontend integration

6. Milestone 6
7. Milestone 7

### Phase 4: Admin and hardening

8. Milestone 8
9. Milestone 9

## Suggested First Implementation Slice

If we want an incremental first release, the highest-value slice is:

1. backend auth context
2. public-safe redacted game/competition reads
3. team_analyst-only statistics lock
4. frontend nav/route gating

This would already give:

- safe public spectator mode
- authenticated team_member/team_analyst separation
- backend-enforced statistics protection

Admin user management can land as a second slice if needed.

## Environment Variables

### Backend

- `SUPABASE_URL`
- `SUPABASE_JWKS_URL` or equivalent JWT verification config
- `SUPABASE_SERVICE_ROLE_KEY` for admin user-management operations only
- `FRONTEND_URL`
- `DATABASE_URL`

### Frontend

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Risks and Watchouts

- Public redaction must be tested deeply because nested game detail payloads are easy to miss
- Hiding buttons in React is not a security control
- The first admin bootstrap must be planned before rollout or the app will be locked out
- Admin user management requires careful handling of the Supabase service role key
- Route-by-route permission checks can drift if helpers are not centralized

## Notes for This Repository

- Production schema changes should be added under `supabase/migrations/`
- Local SQLite still uses SQLAlchemy `create_all()`, so new auth models must remain compatible with local dev
- The main backend seams are:
  - `backend/app/main.py`
  - `backend/app/routers/*`
  - new auth/user modules under `backend/app/`
- The main frontend seams are:
  - `frontend/src/App.tsx`
  - `frontend/src/components/Layout.tsx`
  - `frontend/src/services/api.ts`
  - new auth modules under `frontend/src/`

## Definition of Done

The feature is done when:

- anonymous spectators can follow games safely
- team_members can operate the app but cannot access statistics
- team_analysts can use the full current product
- admins can manage accounts
- backend authorization is enforced everywhere relevant
- frontend reflects permissions cleanly
- tests cover the main permission boundaries
