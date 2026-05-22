# New UI Record Game Detail Plan

## Goal

Make `/record/:gameId` a dedicated field-recording page in the new UI, optimized for mobile sideline use while reusing the existing live tracker behavior and backend contracts.

## Constraints

- Keep the old UI and existing `/games/:gameId` behavior unchanged.
- Reuse existing game data, live-state polling, point dialogs, roster dialog, and history components.
- Keep the page available only to `team_member` and above through the existing route guard.
- Do not rewrite point lifecycle behavior in this slice.

## Steps

1. Add page tests for the dedicated record detail route.
   - Verify ready games show field-focused score context and a start action.
   - Verify started games render the existing live tracker and history entry points.
   - Keep MSW payloads small and public contracts unchanged.

2. Implement `NewRecordGameDetailPage`.
   - Use `useGameDetailPageData`.
   - Reuse `LivePointTracker`, `GameRosterDialog`, `GameHistorySection`, and the existing mutation/invalidation helpers.
   - Render a compact mobile-first header, score panel, primary field actions, and secondary history section.

3. Route `/record/:gameId` to the new page.
   - Keep `/games/:gameId` on the existing detail page for review/after-game usage.
   - Preserve permission gating in `NewUiRoutes`.

4. Verify and commit.
   - Run focused tests for the new page and routes.
   - Run frontend typecheck through the commit hook.

## Next Step After This Slice

Once the record detail page is in place, evaluate the Statistics page because it is the remaining high-friction screen from the agreed design.
