# Test Verification Links

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
