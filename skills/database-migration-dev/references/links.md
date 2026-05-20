# Database Migration Dev Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `AGENTS.md`
- `backend/README.md`
- `SUPABASE_MIGRATION_FLOW.md`
- `supabase/config.toml`

## Source

- Supabase migrations: `supabase/migrations/`
- SQLAlchemy models: `backend/app/models/`
- Pydantic schemas: `backend/app/schemas/`
- Database setup: `backend/app/database.py`
- CRUD modules: `backend/app/crud/`
- Backend tests: `backend/tests/`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/test_crud/ -v
cd backend && source venv/bin/activate && pytest tests/test_api/ -v
```
