# Test Verification Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `AGENTS.md`
- `frontend/README.md`
- `backend/README.md`

## Test Roots

- Backend tests: `backend/tests/`
- Backend builders: `backend/tests/builders/`
- Frontend tests: `frontend/src/**/__tests__/`
- Frontend test utils: `frontend/src/test/test-utils.tsx`
- MSW handlers: `frontend/src/test/mocks/handlers.ts`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/ -v
cd frontend && npm test
cd frontend && npm run build
```
