# App Context Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Core Docs

- `AGENTS.md`
- `README.md`
- `frontend/README.md`
- `backend/README.md`
- `GLOSSARY.md`
- `DEPLOYMENT.md`

## Source Entry Points

- Frontend app shell: `frontend/src/App.tsx`
- Frontend API client: `frontend/src/services/api.ts`
- Backend app: `backend/app/main.py`
- Backend database: `backend/app/database.py`
- Supabase config: `supabase/config.toml`

## Useful Commands

```bash
./dev.sh
cd frontend && npm test
cd frontend && npm run build
cd backend && source venv/bin/activate && pytest tests/ -v
```
