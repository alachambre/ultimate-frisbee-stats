---
name: backend-api-dev
description: Use when implementing or modifying FastAPI routes, Pydantic schemas, SQLAlchemy models, CRUD modules, backend services, API contracts, or backend tests in Monkey Statistics.
---

# Backend API Dev

## Objective

Implement backend behavior with explicit API contracts, clear domain boundaries, and focused tests.

## Preflight

Read `references/links.md`, `AGENTS.md`, and `backend/README.md` before editing.

## Workflow

1. Identify the domain owner across `routers/`, `schemas/`, `crud/`, `models/`, and `tests/`.
2. Keep request and response contracts explicit in Pydantic schemas.
3. Put database access in `crud/`; keep routers focused on HTTP, auth dependencies, validation, and response shape.
4. Use existing auth dependencies and redaction helpers instead of ad hoc checks.
5. Keep SQLite local behavior and PostgreSQL/Supabase production behavior compatible.
6. Add targeted CRUD/API tests using builders from `backend/tests/builders/`.
7. Run the relevant Pytest subset; expand to `pytest tests/ -v` when shared behavior changed.

## Project Rules

- Public spectator reads must use centralized redaction.
- Route authorization should use the shared auth dependency layer.
- `GET /health` must remain public and lightweight.
- Statistics-affecting mutations should clear the statistics cache when relevant.
- Avoid `__dict__` passthrough for API responses; return explicit fields.

## Stop Conditions

Stop and report a blocker when a change needs an unresolved product decision, migration strategy, or production secret.
