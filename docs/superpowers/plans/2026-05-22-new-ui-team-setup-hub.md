# New UI Team Setup Hub Plan

## Goal

Replace the new UI team setup placeholder with a simple configuration hub that keeps current team, roster, line, competition, and strategy management usable from the new UI.

## Constraints

- Keep this slice intentionally light; team configuration is not the main redesign focus.
- Reuse existing management pages and dialogs rather than rebuilding forms.
- Keep mobile access simple for quick edits such as adding a strategy during a game.
- Preserve current role gating with `team_member` access.

## Steps

1. Add tests for the team setup hub.
   - Verify selected-team summary and links to roster/lines, competitions/games, and strategies.
   - Verify new UI routes keep legacy setup screens routable inside the new shell.

2. Implement `NewTeamSetupPage`.
   - Render a compact selected-team summary.
   - Provide clear cards/buttons for team roster and lines, competitions/games, and strategies.
   - Handle loading/error/no-team states.

3. Extend `NewUiRoutes` with setup routes.
   - Route `/teams`, `/teams/:teamId`, `/competitions`, `/competitions/:competitionId`, `/lines/:lineId`, and `/strategies` to the existing pages under the new shell.
   - Keep the routes behind the same member guard where appropriate.

4. Verify and commit.
   - Run focused team setup, route, and locale tests.
   - Let the commit hook run lint and TypeScript.
