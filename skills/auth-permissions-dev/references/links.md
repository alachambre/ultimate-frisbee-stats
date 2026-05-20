# Auth Permissions Dev Links

These paths are discovery hints. Always verify that a referenced file still exists and inspect the current code before relying on it. If a path, owner, or workflow is stale, update this reference as part of the change.

## Docs

- `AGENTS.md`
- `backend/README.md`
- `frontend/README.md`

## Backend Source

- Auth package: `backend/app/auth/`
- Auth router: `backend/app/routers/auth.py`
- Users router: `backend/app/routers/users.py`
- User management service: `backend/app/services/user_management.py`
- User schema/model/crud: `backend/app/schemas/user.py`, `backend/app/models/user.py`, `backend/app/crud/users.py`

## Frontend Source

- Auth provider and helpers: `frontend/src/auth/`
- Permission notice: `frontend/src/components/shared/PermissionNotice.tsx`
- Admin users page: `frontend/src/pages/AdminUsersPage.tsx`
- Auth service: `frontend/src/services/auth.ts`
- Users service: `frontend/src/services/users.ts`

## Commands

```bash
cd backend && source venv/bin/activate && pytest tests/test_auth tests/test_api/test_auth_api.py tests/test_api/test_users_api.py tests/test_api/test_route_authorization_api.py -v
cd frontend && npm test -- auth
```
