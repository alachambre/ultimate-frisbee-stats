---
name: auth-permissions-dev
description: Use when implementing or reviewing authentication, roles, capabilities, permission notices, public redaction, admin user management, Supabase Auth integration, or auth rollout modes.
---

# Auth Permissions Dev

## Objective

Keep frontend and backend permission behavior coherent across rollout modes and public spectator surfaces.

## Preflight

Read `references/links.md`, `AGENTS.md`, `backend/README.md`, and `frontend/README.md` before editing.

## Workflow

1. Identify the affected role or capability: `public`, `team_member`, `team_analyst`, or `admin`.
2. Check backend dependencies and frontend capability helpers before adding any new gate.
3. Preserve the `/auth/me` bootstrap contract.
4. For public reads, use backend redaction serializers instead of custom response filtering.
5. Respect `AUTH_ENFORCEMENT_MODE`: `off`, `shadow`, and `enforced`.
6. Update backend auth tests and frontend auth tests together when the contract or gating changes.

## Project Rules

- Admin user management under `/users` is backend-enforced and strict admin-only.
- Frontend admin route `/admin/users` should stay strictly admin-only in the UI.
- In `off` or `shadow`, rollout should remain safe for incremental deployment.
- In `enforced`, protected UI should render permission notices rather than silently redirecting.
- Permission checks must happen before statistics cache reads.

## Stop Conditions

Stop and report a blocker when a requested permission change is ambiguous between product rollout behavior and security enforcement.
