---
name: frontend-ui-dev
description: Use when implementing or modifying React, TypeScript, Material UI, routing, TanStack Query, frontend services, i18n-backed UI copy, or responsive UI behavior in Monkey Statistics.
---

# Frontend UI Dev

## Objective

Implement production-like frontend changes that fit the existing app structure, mobile-first UI, auth model, and test setup.

## Preflight

Read `references/links.md`, `AGENTS.md`, and `frontend/README.md` before editing.

## Workflow

1. Locate the owning route page, component folder, service module, types, tests, and locale namespaces.
2. Reuse existing Material UI patterns, shared components, query keys, and service modules.
3. Keep route-level code splitting from `frontend/src/App.tsx`; lazy-load heavier screens and charts.
4. Handle loading, empty, error, and permission states when the workflow can reach them.
5. Update EN and FR locale files together when adding user-facing text.
6. Add or adjust focused tests with React Testing Library and MSW when behavior changes.
7. Run `npm test` from `frontend`; run `npm run build` for broader type, routing, or bundling changes.

## Project Rules

- Use Material UI v7 and the semantic theme from `frontend/src/App.tsx`.
- Do not hardcode component colors; use theme palette, `theme.colors.*`, or `theme.gradients.*`.
- Preserve auth consumption through `AuthProvider`, `RequireMinimumRole`, capabilities, and `/auth/me`.
- In enforced auth mode, protected pages should show in-app permission notices instead of silent redirects.
- Use API modules in `frontend/src/services/` and stable keys from `frontend/src/utils/queryKeys.ts`.
- Keep sport terminology consistent with `GLOSSARY.md`.
- Prefer composition components under `frontend/src/components/<domain>/` over adding complex logic directly to page files.

## UI quality rules
- Do not invent a new visual style.
- Use existing design-system components first.
- Match spacing, typography, colors, and interaction patterns from existing screens.
- Build responsive states: mobile, tablet, desktop.
- Include loading, empty, error, disabled, hover, and focus states.
- Before final answer, run lint/typecheck and visually inspect in browser.

## Stop Conditions

Stop and report a blocker when the UI change requires an undefined backend contract or missing auth capability.
