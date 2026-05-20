---
name: live-game-workflow-dev
description: Use when working on live game tracking workflows: point lifecycle, active point state, player selection, pull/strategy tracking, turnovers, stoppages, halftimes, field side, roster interactions, game history, or live-state polling.
---

# Live Game Workflow Dev

## Objective

Preserve sideline usability and data correctness across the live point tracking workflow.

## Preflight

Read `references/links.md`, `AGENTS.md`, and `GLOSSARY.md` before editing live game behavior.

## Workflow

1. Identify which part of the workflow changes: roster, point start, running point, scoring, completion, turnovers, stoppages, halftime, game end, history, or live-state polling.
2. Preserve the point lifecycle: `ready -> running -> scored -> completed`.
3. Keep live tracker polling consolidated through `GET /games/{game_id}/live-state` when possible.
4. Use existing dialogs and live tracker subcomponents under `components/points/` before adding new patterns.
5. Update backend router/CRUD/schema tests and frontend workflow tests together when the contract changes.
6. Check mobile layout through visual QA for interaction-heavy changes.

## Project Rules

- Live point tracker internals are split under `frontend/src/components/points/liveTracker/`; keep `LivePointTracker.tsx` as a composition shell.
- `stoppage` is the generic interruption concept; `Call` is a specific stoppage type and stays in English.
- Field side is selected on the first point of each half and inferred for later points.
- Halftime is a dedicated entity and appears in game history.
- Public-safe turnover history should prefer `GET /games/{game_id}/turnovers` when enriching recaps.

## Stop Conditions

Stop and ask for clarification when a workflow change would alter official game semantics or invalidate existing recorded data.
