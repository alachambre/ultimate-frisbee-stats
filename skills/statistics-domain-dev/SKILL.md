---
name: statistics-domain-dev
description: Use when working on statistics APIs, filtered datasets, reducers, team/player/strategy metrics, evolution charts, timeline charts, CSV exports, statistics caching, or statistics UI contracts.
---

# Statistics Domain Dev

## Objective

Change statistics behavior without splitting formulas, permissions, or contracts across unrelated layers.

## Preflight

Read `references/links.md`, `AGENTS.md`, `STATISTICS_EVOLUTION_PLAN.md`, and `STATISTICS_PERFORMANCE_PLAN.md` before editing.

## Workflow

1. Determine whether the change affects aggregate stats, player stats, strategy stats, evolution, timeline charts, exports, cache, or UI rendering.
2. Keep formulas backend-owned in the statistics CRUD/reducer layer.
3. Reuse shared dataset construction from `statistics_dataset.py` for filtered point datasets.
4. Keep query construction in `statistics_queries.py`, pure calculations in `statistics_calculations.py`, and facade behavior in `statistics.py`.
5. Preserve permission checks before statistics cache reads.
6. If the API contract changes, update backend schemas, frontend types/services, MSW handlers, and tests together.
7. Run targeted backend statistics tests and frontend statistics tests.

## Project Rules

- Team, player, and strategy statistics share turnover-type analytics contracts.
- Player filters restrict datasets to completed points containing every selected player.
- Player-statistics queries, player filters, and CSV exports require analyst/export capabilities when auth enforcement is active.
- Evolution metrics, labels, units, formats, and presets are backend-owned.
- CSV exports are backend-owned; frontend should trigger downloads rather than format statistics.

## Stop Conditions

Stop and report a blocker when the requested metric lacks a clear denominator, scope, or permission model.
