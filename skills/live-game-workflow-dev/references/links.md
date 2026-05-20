# Live Game Workflow Dev Links

## Docs

- `AGENTS.md`
- `GLOSSARY.md`
- `frontend/README.md`
- `backend/README.md`

## Frontend Source

- Game detail page: `frontend/src/pages/GameDetailPage.tsx`
- Game detail data hook: `frontend/src/pages/hooks/useGameDetailPageData.ts`
- Point components: `frontend/src/components/points/`
- Live tracker split components: `frontend/src/components/points/liveTracker/`
- Game detail components: `frontend/src/components/games/detail/`
- Stoppage and turnover dialogs: `frontend/src/components/modals/`
- Field side utility: `frontend/src/utils/fieldSide.ts`
- Timeline utility: `frontend/src/utils/gameTimeline.ts`

## Backend Source

- Games router/CRUD/schema/model: `backend/app/routers/games.py`, `backend/app/crud/games.py`, `backend/app/schemas/game.py`, `backend/app/models/game.py`
- Points router/CRUD/schema/model: `backend/app/routers/points.py`, `backend/app/crud/points.py`, `backend/app/schemas/point.py`, `backend/app/models/point.py`
- Stoppages: `backend/app/routers/stoppages.py`, `backend/app/crud/stoppages.py`
- Turnovers: `backend/app/routers/turnovers.py`, `backend/app/crud/turnovers.py`
- Halftimes: `backend/app/routers/halftimes.py`, `backend/app/crud/halftimes.py`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/test_api/test_points* tests/test_api/test_games_api.py tests/test_api/test_stoppages_api.py tests/test_api/test_turnovers_api.py tests/test_api/test_halftimes_api.py -v
cd frontend && npm test -- GameDetailPage
cd frontend && npm test -- points
```
