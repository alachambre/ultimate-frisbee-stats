---
name: app-context
description: Use when a task needs orientation in the Monkey Statistics codebase before implementation, review, testing, or planning. Loads the local architecture, conventions, important docs, commands, and likely files to inspect.
---

# App Context

## Objective

Build a compact, task-specific map of the project before changing code or delegating work.

## Preflight

Read `references/links.md`, then open only the docs and source files relevant to the task.

## Workflow

1. Classify the task: frontend, backend, statistics, auth, database, live game workflow, deployment, tests, or docs.
2. Read `AGENTS.md` first for project-specific rules.
3. Read the narrow docs listed in `references/links.md` for that task area.
4. Identify the owning source folders, existing tests, and commands to verify the change.
5. Return a short orientation: likely files, existing conventions, risks, and recommended next skill or agent.

## Important Project Facts

- Monkey Statistics is a mobile-first PWA for tracking ultimate frisbee games.
- Frontend: React, TypeScript, Vite, Material UI, TanStack Query, i18n, Chart.js.
- Backend: FastAPI, SQLAlchemy, SQLite locally, PostgreSQL/Supabase in production.
- Tests: Pytest for backend, Vitest, MSW, and React Testing Library for frontend.
- Deployment: Render backend, Vercel frontend, Supabase database/auth.

## Stop Conditions

Stop with a concise blocker when the task needs secrets, live deployment access, or a running service that is not available locally.
