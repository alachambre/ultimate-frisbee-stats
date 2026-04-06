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
- `SUPABASE_URL` for the shared Supabase project URL.
- `SUPABASE_JWKS_URL` for backend JWT verification against Supabase Auth.
- `SUPABASE_SERVICE_ROLE_KEY` for backend-only admin account management flows.
- `INITIAL_ADMIN_AUTH_USER_ID` and `INITIAL_ADMIN_EMAIL` for the optional first-admin bootstrap.

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
