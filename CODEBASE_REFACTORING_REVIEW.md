# Codebase Refactoring Review

Date: 2026-02-08  
Scope: Full repository (`backend/`, `frontend/`, `supabase/`)  
Focus: Readability, maintainability, SRP/SOLID alignment, and long-term delivery speed

## Method

- Reviewed architecture and hotspot files by size/branching density.
- Sampled core workflows (game detail, live point tracking, statistics, exports, stoppages).
- Reviewed test architecture and mock strategy.
- Prioritized recommendations by impact vs. implementation risk.

## Snapshot Signals (Hotspots)

- Large frontend modules:
  - `frontend/src/components/points/LivePointTracker.tsx` (~919 lines)
  - `frontend/src/pages/GameDetailPage.tsx` (~655 lines)
  - `frontend/src/pages/hooks/useStatisticsPageData.ts` (~492 lines)
  - `frontend/src/test/mocks/handlers.ts` (~1555 lines)
  - `frontend/src/types/index.ts` (~466 lines)
- Large backend modules:
  - `backend/app/crud/statistics_exports.py` (~749 lines)
  - `backend/app/crud/statistics_calculations.py` (~462 lines)
  - `backend/app/crud/points.py` (~327 lines)
  - `backend/app/crud/statistics.py` (~320 lines)
- Large test suites:
  - `backend/tests/test_api/test_statistics_api.py` (~1105 lines)
  - `frontend/src/components/modals/__tests__/ManagePlayersDialog.test.tsx` (~710 lines)

These files are not “bad” because they are large, but they are current maintainability risk centers.

## What Is Working Well

- Clear domain separation in backend folders (`models/`, `schemas/`, `crud/`, `routers/`).
- Good use of React Query and centralized query keys.
- Strong feature coverage in tests (especially points/statistics workflows).
- Consistent mobile-first UI direction and reusable roster/player selection work.

## Priority Refactoring Recommendations

## P0 — High Impact, Start First

### 1) Split `LivePointTracker` into focused modules (SRP)
**Status:** ✅ Done (2026-02-08)  
Implemented via `LivePointHeader`, `LivePointActionBar`, `LivePointContextCards`, `useLivePointState`, and `useLivePointMutations` under `frontend/src/components/points/liveTracker/`.

**Problem**  
`frontend/src/components/points/LivePointTracker.tsx` combines:
- query orchestration
- multiple mutations
- status-machine decisions
- styling decisions
- dialog composition

This violates Single Responsibility and increases regression risk.

**Refactor**  
- Keep a thin container: data + callbacks.
- Extract:
  - `LivePointHeader`
  - `LivePointActionBar`
  - `LivePointContextCards` (strategy/comment summary)
  - `useLivePointMutations(gameId, pointId, ...)`
  - `useLivePointState(currentPoint, calls, ...)`

**Expected gain**  
Faster UI iteration, smaller tests, safer feature additions (timeouts/weather/next events).

---

### 2) Split `GameDetailPage` into page shell + feature sections
**Status:** ✅ Done (2026-02-08)  
Implemented via `GameHeaderActions`, `GameScorePanel`, `GameRosterDialog`, `GameHistorySection`, and `useGameDetailPageData`.

**Problem**  
`frontend/src/pages/GameDetailPage.tsx` mixes routing, data loading, score header, roster dialog, history actions, many confirmation modals.

**Refactor**  
- Keep `GameDetailPage` as composition only.
- Extract:
  - `GameHeaderActions`
  - `GameScorePanel`
  - `GameRosterDialog`
  - `GameHistorySection`
  - `useGameDetailPageData(gameId)`

**Expected gain**  
Improved readability and testability; lower risk when changing one section.

---

### 3) Replace brittle `__dict__` mapping in backend game detail
**Status:** ✅ Done (2026-02-08)  
`backend/app/crud/games.py:get_game_detail` now returns an explicit contract mapping.

**Problem**  
`backend/app/crud/games.py:get_game_detail` returns `**game.__dict__` and appends computed fields.  
This is fragile (ORM internals leak, accidental field exposure, schema drift risk).

**Refactor**  
- Build an explicit response DTO/map (or Pydantic model factory).
- Return only contract fields used by `schemas.GameDetail`.

**Expected gain**  
Stronger API contracts, safer future DB/model changes.

---

### 4) Consolidate statistics scope orchestration
**Status:** ✅ Done (2026-02-08)  
`backend/app/crud/statistics.py` now uses shared scope helpers for player/team/strategy aggregations.

**Problem**  
`backend/app/crud/statistics.py` repeats similar logic across `game`, `competition`, `team` scopes:
- existence check
- fetch completed points
- fetch turnovers/stoppages
- run calculator

**Refactor**  
- Introduce internal scope config pattern:
  - entity fetcher
  - point fetcher
  - scope key (`game_id`, `competition_id`, `team_id`)
- Reuse one generic path for team/player/strategy stats.

**Expected gain**  
Less duplication, fewer inconsistencies, easier new scope additions.

---

### 5) Split CSV export builder by concern
**Status:** ✅ Done (2026-02-08)  
Split into `statistics_exports_formatters.py`, `statistics_exports_sections.py`, `statistics_exports_game.py`, `statistics_exports_competition.py`, `statistics_exports_team.py`; `statistics_exports.py` is now a thin facade.

**Problem**  
`backend/app/crud/statistics_exports.py` mixes formatting utilities, domain calculations, and scope-specific assembly in one large module.

**Refactor**  
- Split into:
  - `statistics_exports_formatters.py`
  - `statistics_exports_sections.py`
  - `statistics_exports_game.py`
  - `statistics_exports_competition.py`
  - `statistics_exports_team.py`

**Expected gain**  
Easier changes to CSV contract; lower risk when adding fields/detail modes.

---

### 6) Complete terminology migration: “call” → “stoppage” in frontend domain
**Status:** ✅ Done (2026-02-08)  
Domain/API internals now use stoppage naming (`services/stoppages.ts`, `Stoppage` types, `queryKeys.stoppages`) and legacy aliases are removed.  
Note: UI wording uses **stoppage** for generic interruption flow and keeps **Call** as a specific stoppage type.

**Problem**  
Backend moved to stoppages, but frontend still carries legacy naming (`calls.ts`, `Call` types, `queryKeys.calls`), which increases cognitive load and confusion.

**Refactor**  
- Rename frontend artifacts:
  - `services/calls.ts` → `services/stoppages.ts`
  - `Call` interfaces → `Stoppage`
  - `queryKeys.calls` → `queryKeys.stoppages`
  - component names/messages where appropriate

**Expected gain**  
Consistent ubiquitous language across stack; less onboarding friction.

## P1 — Medium-Term Improvements

### 7) Normalize API error parsing in frontend

**Problem**  
Repeated casts like `(error as { response?: { data?: { detail?: string } } })` across many dialogs/components.

**Refactor**  
- Add `utils/httpError.ts` with `getApiErrorMessage(error, fallback)`.
- Use in all dialogs and mutation error alerts.

**Expected gain**  
Cleaner components and consistent error behavior.

---

### 8) Reduce repeated `liveStats.find(...)` lookups in selection UIs

**Problem**  
In `ManagePlayersDialog`, helper methods repeatedly scan arrays for each card render.

**Refactor**  
- Build `const liveStatsByPlayerId = useMemo(() => new Map(...), [liveStats])`.
- Use O(1) lookups for points/time/highlight.

**Expected gain**  
Improved rendering performance and simpler code.

---

### 9) Unify theme source for app and tests

**Problem**  
Theme is duplicated between:
- `frontend/src/App.tsx`
- `frontend/src/test/test-utils.tsx`

Current values are already diverging (ex: defense colors).

**Refactor**  
- Extract shared `frontend/src/theme/index.ts` and import in both app and test utils.

**Expected gain**  
Reliable visual parity and fewer subtle test/UI mismatches.

---

### 10) Modularize MSW handlers by domain

**Problem**  
`frontend/src/test/mocks/handlers.ts` is monolithic and hard to maintain.

**Refactor**  
- Split into `handlers/teams.ts`, `handlers/games.ts`, `handlers/points.ts`, `handlers/statistics.ts`, etc.
- Keep shared in-memory store and reset function in dedicated mock state module.

**Expected gain**  
Faster test maintenance and easier endpoint evolution.

---

### 11) Break oversized tests into scenario-focused suites

**Problem**  
Several tests are very long and mix many concerns (setup + behavior matrix in one file).

**Refactor**  
- Split by behavior groups (e.g., point lifecycle, stoppage behavior, halftime behavior, roster behavior).
- Keep helper fixtures/builders close to domain under `__tests__/builders`.

**Expected gain**  
Faster diagnosis, clearer intent, easier selective runs.

---

### 12) Enforce query key consistency

**Problem**  
Most code uses `queryKeys`, but some modules still declare ad-hoc arrays inline.

**Refactor**  
- Move all keys into `frontend/src/utils/queryKeys.ts`.
- Optionally add lint rule/convention checks in review checklist.

**Expected gain**  
Safer cache invalidation and easier refactors.

## P2 — Structural/Platform Hardening

### 13) Move backend startup lifecycle to `lifespan` and gate `init_db`

**Problem**  
`backend/app/main.py` uses `@app.on_event("startup")` and always calls `init_db()`.  
`backend/app/database.py:init_db()` runs `Base.metadata.create_all`.

**Risk**  
Conflicts with migration-driven production workflows over time.

**Refactor**  
- Use FastAPI `lifespan`.
- Run `init_db()` only in local/dev mode.
- Keep production schema changes migration-only (Supabase SQL / Alembic).

---

### 14) Adopt SQLAlchemy 2.0 declarative style fully

**Problem**  
`backend/app/models/base.py` still uses legacy `sqlalchemy.ext.declarative.declarative_base`.

**Refactor**  
- Migrate to modern `DeclarativeBase` style with typed mapped columns over time.

**Expected gain**  
Better typing, future-proof ORM usage, cleaner model contracts.

---

### 15) Reduce “god” barrel exports for service/crud boundaries

**Problem**  
`backend/app/crud/__init__.py` and `frontend/src/services/index.ts` re-export many symbols.  
Convenient, but increases accidental coupling and import ambiguity.

**Refactor**  
- Prefer domain imports in core modules (`crud.points`, `services/points`).
- Keep barrel exports for high-level entry points only.

**Expected gain**  
Clearer module boundaries and easier ownership.

## SOLID Lens (Current Pain Points)

- **S (Single Responsibility):** `LivePointTracker`, `GameDetailPage`, `statistics_exports.py`.
- **O (Open/Closed):** Scope-specific stats logic duplicates make new scopes harder.
- **L (Liskov):** No major direct issue found.
- **I (Interface Segregation):** Large global types file (`frontend/src/types/index.ts`) couples unrelated domains.
- **D (Dependency Inversion):** UI components directly depend on low-level API/error formats.

## Suggested Execution Plan

### Phase 1 (1–2 weeks)
- Split `LivePointTracker` and `GameDetailPage`.
- Add shared error parser helper.
- Complete `call`→`stoppage` naming alignment in frontend.

### Phase 2 (1–2 weeks)
- Refactor backend statistics facade and CSV exports by concern.
- Standardize query keys and theme source.
- Split MSW handlers.

### Phase 3 (1 week)
- Lifecycle hardening (`lifespan`, migration-only prod schema changes).
- Progressive SQLAlchemy 2 typed model cleanup.
- Test-suite decomposition pass.

## Quick Wins Checklist (Low Risk)

- [ ] Add `getApiErrorMessage` utility and replace inline casts.
- [ ] Build `liveStatsByPlayerId` maps in player selection dialogs.
- [ ] Extract shared theme to one file.
- [ ] Replace remaining inline query keys.
- [x] Rename `calls.ts`/`Call` frontend artifacts to stoppage naming.

## Optional Follow-Up Deliverables

If useful, next step can be a concrete implementation ticket list (Jira-style) with:
- file-level tasks
- acceptance criteria
- estimated effort per ticket
- dependency ordering for safe rollout.
