# Deployment Ops Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `DEPLOYMENT.md`
- `README.md`
- `backend/README.md`
- `frontend/README.md`
- `SUPABASE_MIGRATION_FLOW.md`

## Config

- Backend env example: `backend/.env.example`
- Frontend env example: `frontend/.env.example`
- Vercel config: `frontend/vercel.json`
- Render config source: `backend/Procfile`
- Supabase config: `supabase/config.toml`

## Commands

```bash
cd frontend && npm run build
cd backend && source venv/bin/activate && pytest tests/test_api/test_health_api.py -v
```
