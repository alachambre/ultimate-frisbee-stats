# Visual QA Links

## Docs

- `AGENTS.md`
- `frontend/README.md`

## Source

- App routes: `frontend/src/App.tsx`
- Layout: `frontend/src/components/Layout.tsx`
- Shared states: `frontend/src/components/shared/`
- Changed route/page/component files for the task

## Commands

```bash
./dev.sh
cd frontend && npm run dev
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
