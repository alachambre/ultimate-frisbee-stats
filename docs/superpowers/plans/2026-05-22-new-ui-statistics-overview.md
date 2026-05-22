# New UI Statistics Overview Plan

## Goal

Replace the new UI statistics placeholder with a coach-overview screen that feels lighter than the legacy statistics page while preserving the current filter and permission behavior.

## Constraints

- Keep the old `/statistics` implementation unchanged when the old UI is active.
- Reuse existing statistics query orchestration and backend contracts.
- Preserve filters by competition, game, and player where permissions allow.
- Respect current role behavior: team and strategy stats for `team_member`, player filters/player stats/export only when allowed.
- Keep the selected top-level new UI team as the default statistics team.

## Steps

1. Add a small new UI statistics overview component and tests.
   - Show games, record, hold rate, break rate, and turnover creation rate.
   - Handle loading/no-data states without forcing the heavy tabs into view first.

2. Implement `NewStatisticsPage`.
   - Use `useStatisticsPageData` and current access checks.
   - Sync the new UI selected team into the statistics URL selection when needed.
   - Render a compact header, collapsed filters, overview cards, and existing `CompetitionStatisticsTabs`.

3. Verify and commit.
   - Run focused new UI statistics tests and locale parity.
   - Let the pre-commit hook run lint and TypeScript.

## Next Step After This Slice

After this, evaluate whether the statistics tabs themselves need a dedicated new UI treatment or whether the next higher-value slice is team setup.
