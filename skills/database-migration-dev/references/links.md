# Database Migration Dev Links

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
