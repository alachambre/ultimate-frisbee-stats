# New UI Statistics Results Ergonomics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the new UI statistics results easier to scan on mobile without changing formulas, backend contracts, permissions, or the old statistics page.

**Architecture:** Add a presentation-density prop to the existing statistics result components. The old `/statistics` page keeps the default standard density; `NewStatisticsPage` opts into compact density for the reused result tabs.

**Tech Stack:** React, TypeScript, Material UI, TanStack Query, Vitest, React Testing Library.

---

### Task 1: Compact Result Tabs

**Files:**
- Modify: `frontend/src/components/statistics/CompetitionStatisticsTabs.tsx`
- Modify: `frontend/src/components/statistics/TeamStatistics.tsx`
- Modify: `frontend/src/components/statistics/StrategyStatistics.tsx`
- Modify: `frontend/src/components/statistics/StatisticsEvolutionTable.tsx`
- Modify: `frontend/src/new-ui/pages/NewStatisticsPage.tsx`
- Test: `frontend/src/components/statistics/__tests__/TeamStatistics.test.tsx`
- Test: `frontend/src/components/statistics/__tests__/StrategyStatistics.test.tsx`
- Test: `frontend/src/components/statistics/__tests__/StatisticsEvolutionTable.test.tsx`

- [ ] **Step 1: Add density props**

Add `density?: "standard" | "compact"` to `CompetitionStatisticsTabs`, `TeamStatistics`, `StrategyStatistics`, and `StatisticsEvolutionTable`. Default to `"standard"` in every component.

- [ ] **Step 2: Keep old UI behavior unchanged**

Do not pass `density` from `frontend/src/pages/StatisticsPage.tsx`. Standard density must still render the existing section titles and spacing.

- [ ] **Step 3: Compact team statistics**

In compact mode, hide the top `Team statistics` title, reduce root padding, reduce section margins, and tighten grid spacing. Keep all metric cards, turnover summaries, field-side details, and turnover-type analytics unchanged.

- [ ] **Step 4: Compact strategy statistics**

In compact mode, hide the top `Strategies statistics` title, reduce section margins, and render strategy cards as quiet bordered Material UI surfaces. Keep expansion behavior and all metrics unchanged.

- [ ] **Step 5: Compact evolution**

In compact mode, reduce the evolution title size and root padding, but keep chart controls, table, metric compatibility, and lazy chart behavior unchanged.

- [ ] **Step 6: Wire the new UI**

Pass `density="compact"` from `NewStatisticsPage` to `CompetitionStatisticsTabs`.

- [ ] **Step 7: Verify with focused tests and browser QA**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npx vitest run --no-file-parallelism --reporter=dot src/components/statistics/__tests__/TeamStatistics.test.tsx src/components/statistics/__tests__/StrategyStatistics.test.tsx src/components/statistics/__tests__/StatisticsEvolutionTable.test.tsx src/new-ui/pages/__tests__/NewStatisticsPage.test.tsx src/pages/__tests__/StatisticsPage.test.tsx
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

Browser-check `/statistics` in the new UI at mobile and desktop widths for no horizontal overflow and visible tab content.
