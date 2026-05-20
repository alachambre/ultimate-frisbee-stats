---
name: test-verification
description: Use when deciding which backend, frontend, build, or browser verification commands to run after a code change in Monkey Statistics.
---

# Test Verification

## Objective

Choose the smallest useful verification set first, then broaden when the change touches shared behavior.

## Preflight

Read `references/links.md` and inspect the changed files before selecting commands.

## Workflow

1. Map changed files to backend, frontend, statistics, auth, database, live game, deployment, or docs.
2. Run targeted tests first.
3. Run broader test suites when contracts, shared utilities, auth, statistics, routing, or build behavior changed.
4. For visual UI changes, run browser verification after unit tests when a dev server is available.
5. Report exact commands, pass/fail status, and any residual risk.

## Test Selection Heuristics

- Backend router/CRUD/schema: matching `backend/tests/test_api/` and `backend/tests/test_crud/`.
- Backend auth: `backend/tests/test_auth/` plus route authorization tests.
- Statistics: backend statistics CRUD/API/cache tests plus frontend statistics tests if the contract changed.
- Frontend component/page: matching Vitest page/component tests and locale parity when copy changes.
- Build/routing/types: `cd frontend && npm run build`.

## Stop Conditions

Stop and report a blocker when tests need unavailable secrets or external services.
