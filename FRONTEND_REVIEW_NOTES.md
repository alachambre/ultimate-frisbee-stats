# Frontend Review Notes

Remove items from this list as they are addressed.

## Hardcoded colors in components (Medium)
Issue: Multiple components use hardcoded color values like `"white"` and `rgba(...)` instead of theme tokens, which violates the “zero hardcoded colors” rule and makes theming harder.
Suggested solution: Replace hardcoded colors with theme tokens such as `theme.palette.common.white`, `alpha(theme.palette.common.white, 0.2)`, or add semantic tokens in the theme if needed.

## Duplicated player selection and gender validation logic (Medium)
Issue: Player selection UI and gender validation logic appear in multiple places (`ManagePlayersDialog`, `PlayerSelectionUI`, `PointPlayerSelection`, `PlayerSelector`), which increases maintenance cost and risk of divergence.
Suggested solution: Extract shared logic into a hook (e.g., `usePlayerSelection`) and utilities for ABBA/gender validation, and reuse a single selection component where possible.

## Duplicated starting position toggle UI (Low)
Issue: The offense/defense toggle appears in both `StartPointDialog` and `PointPlayerSelection` with similar styling and behavior.
Suggested solution: Extract a reusable `StartingPositionToggle` component to keep UI and logic consistent.

## i18n gaps in shared UI (Low)
Issue: Some user-facing strings are hardcoded (e.g., in `PlayerSelectionUI`) and not translated, which breaks full i18n coverage.
Suggested solution: Move user-visible strings into `common.json` (or appropriate namespace) and use `t(...)` for all UI labels and placeholders.

## Repeated loading/error boilerplate in pages (Low)
Issue: Many pages repeat the same `useQuery` + `LoadingState` + `ErrorState` pattern, which adds boilerplate and slight inconsistencies.
Suggested solution: Introduce a small `usePageQuery` hook or a `PageQueryState` wrapper component to standardize loading/error handling.

## Test gaps for shared UI and cache behavior (Low)
Issue: Core shared components like `Layout` and `PlayerSelectionUI` are untested, and there are no tests guarding query-key consistency.
Suggested solution: Add focused tests for shared UI components and introduce a small unit test for query-key helpers once centralized.
