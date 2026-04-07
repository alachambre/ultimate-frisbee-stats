# Deployment Guide

This guide covers the production setup used by Monkey Statistics:

- Supabase for PostgreSQL and Supabase Auth
- Render for the FastAPI backend
- Vercel for the React frontend

The authentication rollout is designed to ship safely in stages through
`AUTH_ENFORCEMENT_MODE=off`, `shadow`, then `enforced`.

## Prerequisites

- A Supabase project
- A Render web service for `backend/`
- A Vercel project for `frontend/`
- The Supabase CLI installed locally for SQL migrations

## 1. Set Up Supabase

### Database

1. Create the Supabase project.
2. Copy the PostgreSQL connection string from:
   `Project Settings -> Database -> Connection string -> URI`
3. Apply the repo migrations:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push --linked
```

This applies the SQL files under `supabase/migrations/`, including the
application `users` table used for app roles.

### Auth values to collect

From the Supabase dashboard, collect these values:

- `SUPABASE_URL`
  - example: `https://your-project.supabase.co`
- `SUPABASE_JWKS_URL`
  - example: `https://your-project.supabase.co/auth/v1/.well-known/jwks.json`
- frontend anon key
  - used as `VITE_SUPABASE_ANON_KEY`
- backend service role or secret key
  - used as `SUPABASE_SERVICE_ROLE_KEY`
  - backend only, never expose it in Vercel or any `VITE_*` variable

### First admin auth account

Before enforcing app permissions, create the first admin identity in:
`Authentication -> Users`

Then copy:

- the Supabase auth user UUID
- the account email

Those values are used by the backend bootstrap to create the first local
`admin` row in `public.users`.

## 2. Deploy the Backend on Render

Create a Render web service pointing to the `backend/` directory with:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Required Render environment variables

```bash
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
FRONTEND_URL=https://your-app.vercel.app
AUTH_ENFORCEMENT_MODE=off
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
INITIAL_ADMIN_AUTH_USER_ID=<supabase-auth-user-uuid>
INITIAL_ADMIN_EMAIL=<admin-email>
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is required for admin user management.
- `INITIAL_ADMIN_*` is optional after the first bootstrap, but keeping it set is
  fine because the bootstrap is idempotent.
- `AUTH_ENFORCEMENT_MODE=off` is the safest first production deploy.

### Backend bootstrap check

After deploying the backend, verify one of these:

- Render logs mention the initial admin bootstrap
- `public.users` contains the expected admin row

Expected row characteristics:

- `auth_user_id` matches the Supabase Auth user UUID
- `email` matches the admin account email
- `role=admin`
- `is_active=true`

## 3. Deploy the Frontend on Vercel

Create a Vercel project pointing to `frontend/` with:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

### Required Vercel environment variables

```bash
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Notes:

- Vite reads `VITE_*` variables at build time, so any change requires a new
  deployment.
- The login button only appears when both `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are configured.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

## 4. Recommended Auth Rollout

### Stage 1: Foundation deploy

Deploy backend and frontend with:

```bash
AUTH_ENFORCEMENT_MODE=off
```

Behavior:

- the app behaves like the pre-auth version
- login UI can appear if the frontend Supabase vars are configured
- `/auth/me` still resolves to `public`, so role-aware testing is not meaningful
  yet

Use this stage to validate:

- migrations applied successfully
- frontend can reach the backend
- the initial admin bootstrap completed

### Stage 2: Shadow mode

Switch the backend to:

```bash
AUTH_ENFORCEMENT_MODE=shadow
```

Behavior:

- Supabase sessions are resolved
- `/auth/me` returns the real role and capabilities
- login and logout become meaningfully testable
- most product routes still behave like the old app
- admin routes remain strictly protected

Recommended checks:

1. Sign in with the admin account.
2. Open `GET /auth/me` in browser devtools and confirm:
   - `role=admin`
   - `has_app_access=true`
   - `enforcement_mode=shadow`
3. Visit `/admin/users`.
4. Create `team_member` and `team_analyst` accounts from the admin UI.
5. Verify public pages still work for anonymous users.

### Stage 3: Enforced mode

Switch the backend to:

```bash
AUTH_ENFORCEMENT_MODE=enforced
```

Behavior:

- public users are limited to spectator surfaces
- public payloads are redacted for comments and strategy data
- `team_member` users cannot access statistics or exports
- `team_analyst` users can access the full product except admin-only screens
- `admin` users can also manage accounts

Recommended checks:

- public: competitions, games, live tracker, score, history, stoppages, turnovers
- `team_member`: team and game operations, but no statistics
- `team_analyst`: statistics and exports
- `admin`: `/admin/users` works end to end

## 5. Local Development With Auth Enabled

Local development still defaults to SQLite for app data. That is useful for local
auth testing, but remember:

- Supabase Auth users still live in the shared Supabase project
- local SQLite `users` rows are not the same as production `public.users`
- creating users through a local backend only provisions the local app database,
  not production

Recommended local backend `.env`:

```bash
AUTH_ENFORCEMENT_MODE=shadow
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
INITIAL_ADMIN_AUTH_USER_ID=<supabase-auth-user-uuid>
INITIAL_ADMIN_EMAIL=<admin-email>
```

Recommended local frontend `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Use at least `shadow` locally. In `off`, the login button can still appear, but
the backend intentionally resolves `/auth/me` as `public`.

## 6. Environment Variable Summary

### Backend

```bash
DATABASE_URL
FRONTEND_URL
AUTH_ENFORCEMENT_MODE
SUPABASE_URL
SUPABASE_JWKS_URL
SUPABASE_SERVICE_ROLE_KEY
INITIAL_ADMIN_AUTH_USER_ID
INITIAL_ADMIN_EMAIL
```

### Frontend

```bash
VITE_API_BASE_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Troubleshooting

### Login button is missing

Check the Vercel environment and confirm:

- `VITE_SUPABASE_URL` is set
- `VITE_SUPABASE_ANON_KEY` is set
- the frontend was redeployed after changing them

On mobile, the sign-in action lives in the drawer menu instead of the top bar.

### Signed in user still looks public

Check `GET /auth/me`.

If it returns `public` or `has_app_access=false`, verify:

- the backend is in `shadow` or `enforced`
- the signed-in Supabase user UUID matches `public.users.auth_user_id`
- the local user row is active

### Admin page does not work

Check all of these:

- backend is in `shadow` or `enforced`
- `/auth/me` returns `role=admin`
- `SUPABASE_SERVICE_ROLE_KEY` is set on Render

Without the service role key, the backend cannot create or update Supabase Auth
users from `/users`.

### Public users can still see protected content

Public spectators should not see comments or strategy fields in `shadow` or
`enforced`. If they do:

- confirm the backend deploy includes the latest auth redaction changes
- confirm the backend is not still running in `off`

### CORS errors

Check that:

- `FRONTEND_URL` on Render matches the Vercel production URL
- the backend redeployed after the value changed

### First request is slow

This is expected on the Render free tier after inactivity. The service sleeps and
needs time to wake up.
