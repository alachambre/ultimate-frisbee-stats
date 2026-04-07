# Backend (FastAPI) - Dev Guide

FastAPI REST API for Ultimate Frisbee Stats. This doc is intentionally short and focused on local development.

## Quick Start

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Configuration

Copy the example env file if you need custom settings:

```bash
cp .env.example .env
```

Common settings:
- `DATABASE_URL` (optional). If unset, SQLite is used locally.
- `FRONTEND_URL` for CORS when running the frontend locally.
- `AUTH_ENFORCEMENT_MODE` to control auth rollout: `off`, `shadow`, or `enforced`.
- `SUPABASE_URL` for the shared Supabase project URL.
- `SUPABASE_JWKS_URL` for backend JWT verification against Supabase Auth.
- `SUPABASE_SERVICE_ROLE_KEY` for backend-only admin account management flows.
- `INITIAL_ADMIN_AUTH_USER_ID` and `INITIAL_ADMIN_EMAIL` for the optional first-admin bootstrap.

## Authentication and Permissions

App roles are stored in the backend `users` table and linked to Supabase Auth via
`auth_user_id`.

Supported roles:

- `public`
- `team_member`
- `team_analyst`
- `admin`

The backend auth bootstrap contract is:

- frontend signs in with Supabase
- frontend sends the bearer token
- backend resolves the current user through `GET /auth/me`
- backend enforces permissions route by route

Key endpoints:

- `GET /auth/me` returns the normalized access context for the current request
- `/users` is admin-only and manages app users through the backend

Important rollout behavior:

- `AUTH_ENFORCEMENT_MODE=off`
  - safe deploy mode
  - `/auth/me` intentionally resolves to `public`
- `AUTH_ENFORCEMENT_MODE=shadow`
  - resolves the real auth context without fully enforcing the app
  - recommended for login and provisioning validation
- `AUTH_ENFORCEMENT_MODE=enforced`
  - fully enables role checks and public redaction

## Local Auth Testing

To test auth locally against your Supabase project:

1. Copy `.env.example` to `.env`
2. Set at least:
   - `AUTH_ENFORCEMENT_MODE=shadow`
   - `SUPABASE_URL`
   - `SUPABASE_JWKS_URL`
3. If you want admin user management locally, also set:
   - `SUPABASE_SERVICE_ROLE_KEY`
4. If you want the local SQLite database to contain the first admin user
   automatically, also set:
   - `INITIAL_ADMIN_AUTH_USER_ID`
   - `INITIAL_ADMIN_EMAIL`

Notes:

- SQLite is still used locally unless `DATABASE_URL` is set.
- Local app users live in the local database, even if authentication is using the
  shared Supabase project.
- Creating users through a local backend is useful for local testing, but it does
  not provision the production `users` table.

## Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

Targeted runs:
```bash
pytest tests/test_crud/ -v
pytest tests/test_api/ -v
pytest tests/test_auth/ -v
pytest tests/test_api/test_route_authorization_api.py -v
pytest tests/test_api/test_users_api.py -v
```

## Project Layout

- `app/routers/` HTTP endpoints per domain
- `app/crud/` database operations per domain
- `app/models/` SQLAlchemy models
- `app/schemas/` Pydantic schemas
- `app/main.py` FastAPI app
- `tests/` pytest suites and builders

## Conventions

- Point lifecycle: `ready -> running -> scored -> completed`
- Use test builders in `tests/builders/` for new tests

## More Docs

- `requirements.md` for feature requirements
- `data-model-design.md` for the full data model
- `LOGGING.md` for production logging guidance
- `DEPLOYMENT.md` for deployment steps
