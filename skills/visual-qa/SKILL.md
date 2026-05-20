---
name: visual-qa
description: Use when verifying local frontend changes in a browser across mobile and desktop layouts, including responsive layout, navigation, overflowing text, forms, charts, and UI states.
---

# Visual QA

## Objective

Verify the rendered app, not only the source code, after visual or interaction changes.

## Preflight

Read `references/links.md`, identify the route(s) affected, and confirm whether frontend and backend dev servers are needed.

## Workflow

1. Start the app with `./dev.sh` or the specific frontend/backend commands if it is not already running.
2. Open the relevant route locally.
3. Check at least one mobile viewport and one desktop viewport.
4. Exercise the changed workflow, including empty/loading/error states when practical.
5. Inspect for text overflow, clipped controls, inconsistent spacing, broken navigation, permission notices, and chart rendering issues.
6. Report screenshots or concrete observations when a browser tool is available.

## Project Rules

- The app is mobile-first and used on sidelines during games.
- Controls must remain usable on small screens.
- Do not approve visual changes from code inspection alone when browser verification is practical.

## Stop Conditions

Stop and report a blocker when the route cannot be reached because the backend, auth, seed data, or required environment variables are missing.
