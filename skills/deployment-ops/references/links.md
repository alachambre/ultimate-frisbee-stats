# Deployment Ops Links

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
