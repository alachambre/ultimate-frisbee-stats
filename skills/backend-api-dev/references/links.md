# Backend API Dev Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `AGENTS.md`
- `backend/README.md`
- `README.md`

## Source

- FastAPI app: `backend/app/main.py`
- Database setup: `backend/app/database.py`
- Routers: `backend/app/routers/`
- CRUD: `backend/app/crud/`
- Models: `backend/app/models/`
- Schemas: `backend/app/schemas/`
- Auth dependencies: `backend/app/auth/`
- Backend tests: `backend/tests/`
- Test builders: `backend/tests/builders/`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/ -v
cd backend && source venv/bin/activate && pytest tests/test_api/ -v
cd backend && source venv/bin/activate && pytest tests/test_crud/ -v
```
