# Backend API Dev Links

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
