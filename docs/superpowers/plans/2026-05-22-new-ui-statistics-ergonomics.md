# New UI Statistics Ergonomics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the new statistics page easier to scan on mobile while preserving the current statistics filters, permissions, and old UI behavior.

**Architecture:** Keep the backend and statistics data orchestration unchanged. Add an opt-in compact mode to the shared statistics configuration panel so the new UI can use a lighter presentation without changing the old statistics page defaults.

**Tech Stack:** React, TypeScript, Material UI, TanStack Query, Vitest, React Testing Library.

---

### Task 1: Compact Statistics Filter Summary

**Files:**
- Modify: `frontend/src/components/statistics/StatisticsConfigurationPanel.tsx`
- Modify: `frontend/src/new-ui/pages/NewStatisticsPage.tsx`
- Test: `frontend/src/new-ui/pages/__tests__/NewStatisticsPage.test.tsx`

- [ ] **Step 1: Add compact-mode props to the configuration panel**

Add optional props:

```ts
  density?: "standard" | "compact";
  summaryItems?: string[];
```

Default `density` to `"standard"` and `summaryItems` to `[]`.

- [ ] **Step 2: Render summary chips in compact mode**

In `StatisticsConfigurationPanel`, render small outlined chips next to the configuration title when `density === "compact"` and `summaryItems.length > 0`. Use existing `theme.palette.divider` and `Chip` from Material UI; do not introduce hardcoded colors.

- [ ] **Step 3: Lighten the expanded compact filter body**

For compact mode, remove the nested sticky bordered filter shell and use a simple `Box` with top padding. Keep standard mode unchanged for the old UI.

- [ ] **Step 4: Wire new UI statistics to compact mode**

In `NewStatisticsPage`, pass `density="compact"` and `summaryItems={statisticsContextItems}` to `StatisticsConfigurationPanel`.

- [ ] **Step 5: Add regression coverage**

In `NewStatisticsPage.test.tsx`, assert that the configuration starts collapsed but still surfaces the selected dataset context:

```ts
expect(screen.queryByLabelText("1. Team")).not.toBeInTheDocument();
expect(screen.getAllByText("Monkey Stats").length).toBeGreaterThanOrEqual(1);
```

- [ ] **Step 6: Verify**

Run:

```bash
cd frontend
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npx vitest run --no-file-parallelism --reporter=dot src/new-ui/pages/__tests__/NewStatisticsPage.test.tsx
PATH=/Users/a.lachambre/devtools/nvm/versions/node/v20.15.0/bin:$PATH npm run build
```

Expected: both commands pass. The build may still print the existing Node/Vite version warning and chunk-size warning.
