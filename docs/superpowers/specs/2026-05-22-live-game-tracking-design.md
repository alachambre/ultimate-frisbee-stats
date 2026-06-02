# Live Game Tracking Design

## Context

This spec records the agreed New UI direction for the live game tracking page. It refines the broader New UI redesign spec and the `All games` match hub design.

The live game page is the destination for `Go` from ready or live games. It is one page/component that adapts to permissions: team members can record the game, while public users can follow the public-safe live state.

Reference mockups:

- `.superpowers/brainstorm/18210-1779457497/content/live-game-cockpit-v4.html`
- `.superpowers/brainstorm/18210-1779457497/content/live-game-no-active-point-v3.html`

## Goals

- Make the page usable on a phone during a game.
- Keep game-level actions available without competing with point-recording actions.
- Keep the active point surface focused on what matters on the field.
- Use a restrained Material UI style consistent with the `All games` design.
- Support public spectator behavior without introducing a separate spectator page.
- Preserve existing permissions and old UI compatibility during the transition.

## Non-Goals

- Designing the final game history section in this spec.
- Designing a separate standalone spectator page.
- Reworking the point start, point completion, roster, or game edit dialogs.
- Changing backend contracts unless implementation later proves an additive endpoint is useful.

## Visual Direction

The page uses the same calm Material direction as the `All games` design:

- primary color: steel blue `#2F6690`
- `Paper` cards with modest radius
- compact action buttons with Material icons
- chips for point status and point context
- restrained borders and neutral backgrounds

The final implementation should use Material UI components and semantic theme colors. Do not hardcode colors in page components.

## Page Shell

The live game page header shows:

- back navigation to `All games`
- live status
- current score
- team names

The header remains compact on mobile and should keep the current score visible while recording.

The page is not a dashboard. The first screen should prioritize the current recording state and the next useful action.

## Game-Level Actions

Game-level actions remain available near the game score/header.

Required actions:

- `Roster`
- `Stats`
- `Edit`
- `Complete`

On mobile, these actions appear as a compact row below the score/header.

On desktop/tablet, these actions may move to a right rail so the main column stays focused on live tracking.

Do not put destructive actions such as delete in this primary row. Destructive actions should stay behind an overflow/admin path.

## Active Point State

When a point is running, the tracking card shows:

- `Current point`
- point number
- elapsed time
- status chip, for example `Running`
- possession chip, for example `Offense` or `Defense`
- gender ratio chip, for example `Women`
- current strategy
- comment, when present

The current point card should stay compact.

Do not show these items at the top of the card:

- field side
- pull inbound
- `Line valid`

Those details are either statistics-oriented or already implied by point start validation. They can remain in dialogs, details, or future history/analytics surfaces where relevant.

Point action controls remain separate from game-level actions.

On mobile, the current point action deck is sticky at the bottom and contains:

- primary action: `Finish point`
- secondary actions such as `Turnover`, `Stoppage`, `Line`, and `More`

On desktop/tablet, point actions can live inline in the main card because there is more space.

## No Active Point State

When no point is active, the live tracking card title is:

- `No active point`

The card explains that no point is currently running and that the next action is available at the bottom of the screen.

The card may show compact context such as:

- last point summary
- next expected gender ratio

On mobile, do not duplicate point actions inside the card. The actions appear once in the sticky bottom action area:

- primary action: `New point`
- secondary action: `Half time`

On desktop/tablet, where there is no mobile sticky deck, `New point` and `Half time` can live inside the main no-active-point card.

Do not show game history in this state for now. Game history will be designed separately.

## Spectator Behavior

The same route/component serves recorder and spectator needs.

Public users or users without recording permission:

- can see public-safe game score and live state
- can see the current active point context when public-safe
- cannot see recording controls
- see a quiet waiting state when no point is active

Team members:

- can start a new point
- can register half time
- can use current-point controls
- can access game-level actions according to existing permissions

The implementation must respect current rollout behavior. In enforced mode, hide or disable privileged controls when the user lacks the capability.

## Mobile Behavior

Mobile is the primary design target for live tracking.

Requirements:

- sticky bottom actions for recording
- large enough touch targets for field use
- compact current point card
- clear separation between game-level and point-level actions
- no duplicated actions
- no long explanatory text in the active recording path

The page can scroll, but the first screen should keep the score, game actions, current tracking state, and primary recording action easy to reach.

## Deferred: Game History

Game history is intentionally deferred.

The final history design should be revisited separately. Current open questions include:

- whether history starts directly below the tracking card
- how compact point rows should be
- what details appear in collapsed versus expanded rows
- how point chronology, line, turnovers, and halftime snapshots are exposed

Do not let this deferred work block the first live tracking page implementation.

## Testing And Verification

Implementation should include:

- React tests for active point state rendering
- React tests for no-active-point state rendering
- permission-aware tests that hide recording controls for spectator/public mode
- tests or Storybook-like fixture coverage for mobile action placement if available
- browser visual checks on mobile and desktop
- `npm test`
- `npm run build`

Backend tests are only required if implementation introduces a backend contract change.

## Approved Decisions

- `Go` from `All games` opens the live tracker page/component.
- There is no standalone spectator page for this flow.
- Game-level actions are `Roster`, `Stats`, `Edit`, and `Complete`.
- Game-level actions remain separate from point-level actions.
- Delete is not a primary game-level action.
- Field side and pull inbound should not be shown at the top of the current point card.
- `Line valid` should not be shown.
- Current point context should show offense/defense, gender ratio, strategy, and comment.
- Mobile point actions remain sticky.
- No-active-point title is `No active point`.
- No-active-point mobile actions are `New point` and `Half time`.
- `New point` and `Half time` should not be duplicated on mobile.
- No-active-point state should not include game history for now.
- Game history design is deferred.
