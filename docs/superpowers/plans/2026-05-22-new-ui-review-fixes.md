# New UI Review Fixes Plan

## Goal

Address the two important review findings before considering the new UI redesign slice complete.

## Steps

1. Fix routed live spectator selection.
   - Keep `/live` auto-selecting the first currently live game.
   - Keep `/live/:gameId` scoped to the requested game only.
   - Show a clear not-live state when the requested game is not currently live.
   - Add regression coverage proving `/live/:gameId` does not fall back to a different live game.

2. Fix new statistics team selection.
   - Keep the app shell selected team as the new UI source of truth.
   - When the statistics configuration team selector changes, update both the app selected team and the statistics query selection.
   - Add regression coverage proving the app-level selected team changes when the statistics selector changes.

3. Verify and commit.
   - Run focused live/statistics/locale tests.
   - Run the serial frontend suite and production build if focused tests pass.
