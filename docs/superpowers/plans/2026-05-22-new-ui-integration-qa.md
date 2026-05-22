# New UI Integration QA Plan

## Goal

Verify the new top-level UI mode as one coherent experience across the agreed flows: all games, record game, live spectator, statistics, and team setup.

## Constraints

- Keep the old UI available through the existing app-level toggle.
- Avoid adding scope unless tests or browser checks expose a real regression.
- Use existing backend contracts and existing setup/statistics pages where the redesign intentionally reuses them.

## Steps

1. Run broad frontend verification.
   - Run the full Vitest suite.
   - Run the frontend production build.

2. Browser-check the main new UI routes.
   - Confirm app-level UI switching still works.
   - Check desktop and mobile layouts for `/games`, `/record`, `/live`, `/statistics`, and `/team-setup`.
   - Verify the new shell can route into reused pages such as team detail, competitions, and strategies.

3. Fix any meaningful defects found by verification.
   - Keep fixes scoped to the affected new UI route, shell, locale, or test.
   - Re-run the relevant focused check after each fix.

4. Commit the integration slice.
   - Commit only plan or QA-driven stabilization changes.
   - Record any residual risk if local browser state, backend data, or screenshots limit verification.
