---
name: project-knowledge-update
description: Use when an implementation or investigation proves that project-owned docs, AGENTS.md, setup notes, or local guidance are stale, incomplete, or misleading.
---

# Project Knowledge Update

## Objective

Keep repo-owned guidance accurate without mixing documentation cleanup into unrelated implementation work.

## Preflight

Read `references/links.md` and identify the exact stale or missing guidance before editing.

## Workflow

1. Confirm the knowledge gap from code, tests, docs, or a completed investigation.
2. Choose the smallest project-owned document that should carry the update.
3. Patch only the stale or missing guidance.
4. Avoid duplicating large details across docs; link to existing docs when possible.
5. Report what was updated and why.

## Good Candidates

- `AGENTS.md` when a durable agent-facing convention changes.
- `frontend/README.md` or `backend/README.md` when local dev or architecture guidance changes.
- `DEPLOYMENT.md` when deployment steps or env vars change.
- `GLOSSARY.md` when sport terminology rules change.

## Stop Conditions

Stop and report external or uncertain documentation gaps instead of inventing guidance.
