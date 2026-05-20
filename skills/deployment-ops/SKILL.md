---
name: deployment-ops
description: Use when working on deployment documentation, Render backend configuration, Vercel frontend configuration, Supabase settings, environment variables, local production-like checks, or smoke tests.
---

# Deployment Ops

## Objective

Keep deployment changes repeatable and documented across Render, Vercel, Supabase, and local development.

## Preflight

Read `references/links.md`, `DEPLOYMENT.md`, and the relevant `.env.example` files before editing.

## Workflow

1. Identify the target: backend, frontend, Supabase, auth, or cross-service configuration.
2. Check which environment variables are required locally and in deployed environments.
3. Prefer documented configuration changes over one-off manual steps.
4. Keep public frontend env vars separate from backend secrets.
5. Add or update smoke-check guidance when routes, health checks, auth, or CORS behavior changes.
6. Run local build/tests where possible before reporting deployment readiness.

## Project Rules

- Backend health check is `GET /health` and should remain public.
- Frontend expects `VITE_API_BASE_URL`; auth UI requires Supabase URL and anon key.
- Backend auth enforcement is controlled by `AUTH_ENFORCEMENT_MODE`.
- Render free-tier cold starts are expected and the homepage wakes the backend through health checks.

## Stop Conditions

Stop and report a blocker when a step requires production secrets or direct hosted-environment access.
