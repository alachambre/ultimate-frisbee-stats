# Statistics Domain Dev Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `AGENTS.md`
- `STATISTICS_EVOLUTION_PLAN.md`
- `STATISTICS_PERFORMANCE_PLAN.md`
- `frontend/README.md`
- `backend/README.md`

## Backend Source

- Statistics router: `backend/app/routers/statistics.py`
- Exports router: `backend/app/routers/exports.py`
- Statistics facade: `backend/app/crud/statistics.py`
- Dataset builder: `backend/app/crud/statistics_dataset.py`
- Queries: `backend/app/crud/statistics_queries.py`
- Calculations: `backend/app/crud/statistics_calculations.py`
- Evolution: `backend/app/crud/statistics_evolution.py`
- Exports facade and sections: `backend/app/crud/statistics_exports*.py`
- Cache: `backend/app/statistics_cache.py`
- Schemas: `backend/app/schemas/statistics.py`

## Frontend Source

- Statistics page: `frontend/src/pages/StatisticsPage.tsx`
- Statistics data hook: `frontend/src/pages/hooks/useStatisticsPageData.ts`
- Statistics components: `frontend/src/components/statistics/`
- Statistics services: `frontend/src/services/statistics.ts`
- Statistics locales: `frontend/src/locales/en/statistics.json`, `frontend/src/locales/fr/statistics.json`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/test_crud/test_statistics*.py tests/test_api/test_statistics*.py -v
cd frontend && npm test -- StatisticsPage
cd frontend && npm test -- statistics
```
