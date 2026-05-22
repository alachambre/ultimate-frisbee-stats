# New UI Product Polish QA Plan

## Goal

Run a validation-driven polish pass on the opt-in new UI and fix only high-signal issues found while using the app.

## Scope

- Public spectator flow: all games and live game pages.
- Member field flow: record game queue and record detail entrypoints.
- Analyst flow: statistics coach overview and configuration panel.
- Setup flow: team setup hub and reused management routes.
- Mobile navigation and small-screen usability.

## Steps

1. Browser-walk the new UI on desktop.
   - Check `/games`, `/live`, `/record`, `/statistics`, `/team-setup`, and reused setup routes.
   - Verify old/new UI switching remains reachable.

2. Browser-walk the field-facing routes on mobile.
   - Check mobile drawer navigation.
   - Check record and live screens for clipped text, awkward spacing, or broken controls.

3. Inspect any issue in code and fix only primary-flow defects.
   - Keep changes scoped to the affected route/component.
   - Add focused regression coverage for behavior changes.

4. Verify and commit.
   - Run focused frontend tests for changed files.
   - Run broader frontend verification when routing, shared state, or layout changes.
