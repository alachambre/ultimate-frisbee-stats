# Frontend Review Notes

Remove items from this list as they are addressed.

## Duplicated starting position toggle UI (Low)
Issue: The offense/defense toggle appears in both `StartPointDialog` and `PointPlayerSelection` with similar styling and behavior.
Suggested solution: Extract a reusable `StartingPositionToggle` component to keep UI and logic consistent.

## i18n gaps in shared UI (Low)
Issue: Some user-facing strings are hardcoded (e.g., in `PlayerSelectionList`) and not translated, which breaks full i18n coverage.
Suggested solution: Move user-visible strings into `common.json` (or appropriate namespace) and use `t(...)` for all UI labels and placeholders.

## Repeated loading/error boilerplate in pages (Low)
Issue: Many pages repeat the same `useQuery` + `LoadingState` + `ErrorState` pattern, which adds boilerplate and slight inconsistencies.
Suggested solution: Introduce a small `usePageQuery` hook or a `PageQueryState` wrapper component to standardize loading/error handling.

## Test gaps for shared UI and cache behavior (Low)
Issue: Core shared components like `Layout` and `PlayerSelectionList` are untested, and there are no tests guarding query-key consistency.
Suggested solution: Add focused tests for shared UI components and introduce a small unit test for query-key helpers once centralized.
