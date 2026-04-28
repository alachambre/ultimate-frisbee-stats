# Statistics Evolution Plan

## Goal

Add a team-level statistics evolution view that shows how selected statistics change game after game. The first version should reuse the existing `/statistics` filter workflow:

- Team selection is required.
- Competition and game filters restrict the dataset.
- Player cohort filters apply when the user has the required analyst capability.
- Games with no completed points are omitted from the evolution series.
- The backend owns the available metric catalog, metric formulas, and default preset.

The first delivery is intentionally team-statistics only. Strategy evolution can be added later, probably in a separate area or tab so the statistics page does not become too dense.

## Product Decisions

- Default view: `Turnover battle`, showing our turnovers and opponent turnovers per game.
- Chart mode selector: `Auto`, `Line`, `Bar`.
- `Auto` uses bars for count metrics and lines for rate/percentage metrics.
- Multi-metric selection is allowed only within compatible metric units/groups. No dual-axis chart in v1.
- Empty games are omitted, not shown as zero.
- Backend response includes enough metric metadata for frontend labels, formatting, compatibility, defaults, and tooltips.
- Existing aggregate Team tab formulas remain the source of truth.

## Metric Semantics

Milestone 1 should audit and lock the first metric catalog against the current Team tab formulas.

### Count Metrics

| Metric ID | Label | Formula |
| --- | --- | --- |
| `total_our_turnovers` | Our turnovers | `offense.our_turnovers + defense.our_turnovers` |
| `total_opponent_turnovers` | Opponent turnovers | `offense.opponent_turnovers + defense.opponent_turnovers` |
| `offense_our_turnovers` | Our offensive turnovers | `offense.our_turnovers` |
| `defense_opponent_turnovers` | Opponent turnovers on our defense | `defense.opponent_turnovers` |
| `points_won` | Points won | completed points won |
| `points_lost` | Points lost | completed points lost |
| `holds` | Holds | offensive points won |
| `breaks` | Breaks | defensive points won |

### Rate Metrics

These should match the Team tab cards.

| Metric ID | Label | Formula |
| --- | --- | --- |
| `offense_hold_rate` | Hold rate | offensive points won / offensive points played |
| `offense_clean_hold_rate` | Clean hold rate | offensive points won without us committing a turnover / offensive points played |
| `defense_turnover_rate` | Turnover rate | defensive points where at least one turnover occurred / defensive points played |
| `defense_break_rate` | Break rate | defensive points won / defensive points played |
| `defense_clean_break_rate` | Clean break rate | defensive points won without us committing a turnover / defensive points played |
| `defense_conversion_rate` | Conversion rate | defensive points won / defensive points where at least one turnover occurred |
| `defense_clean_conversion_rate` | Clean conversion rate | defensive points won without us committing a turnover / defensive points won |
| `defense_pull_inbound_rate` | Pull inbound rate | inbound tracked pulls / tracked pulls |

### Tooltip Cleanup

Clean conversion rate currently has the right value but a confusing tooltip. Update it to:

> Percentage of breaks won without us committing a turnover.

While auditing, clarify any other tooltip that mixes denominator and outcome language. Prefer short definitions that name both numerator and denominator.

## Backend Contract Draft

Add a team evolution endpoint, likely:

`GET /statistics/teams/{team_id}/evolution`

Query params:

- `competition_ids`: repeated optional IDs.
- `game_ids`: repeated optional IDs.
- `player_ids`: repeated optional IDs, analyst-only when enforcement is active.

Response shape draft:

```json
{
  "team_id": 1,
  "filters": {
    "competition_ids": [10, 11],
    "game_ids": [],
    "player_ids": []
  },
  "default_preset_id": "turnover_battle",
  "omitted_games_count": 2,
  "metrics": [
    {
      "id": "total_our_turnovers",
      "label": "Our turnovers",
      "description": "Total turnovers committed by us in the game.",
      "unit": "count",
      "group": "turnovers",
      "format": "integer",
      "higher_is_better": false
    }
  ],
  "presets": [
    {
      "id": "turnover_battle",
      "label": "Turnover battle",
      "metric_ids": ["total_our_turnovers", "total_opponent_turnovers"]
    }
  ],
  "games": [
    {
      "game_id": 123,
      "competition_id": 10,
      "competition_name": "Spring Cup",
      "opponent_name": "Rival Team",
      "date": "2026-04-09T08:30:00Z",
      "our_score": 13,
      "opponent_score": 9,
      "completed_points": 22,
      "metrics": {
        "total_our_turnovers": 8,
        "total_opponent_turnovers": 11
      }
    }
  ]
}
```

## Milestones

### Milestone 1: Metric Audit And Tooltip Cleanup - Done

Purpose: make sure metric names, formulas, and descriptions are ready before creating a new chart surface.

Backend tasks:

- Add backend schema types for metric metadata and presets.
- Add a backend-owned metric catalog for team evolution.
- Add tests for metric IDs, units, default preset, and descriptions.

Frontend tasks:

- Fix the clean conversion tooltip.
- Clarify any other Team tab tooltip found confusing during the audit.
- Keep the aggregate Team tab behavior unchanged.

Acceptance criteria:

- Team tab values are unchanged.
- Tooltip copy is clearer and matches current formulas.
- Metric catalog tests cover the default `turnover_battle` preset and all v1 metric IDs.

### Milestone 2: Backend Evolution Endpoint - Done

Purpose: produce chart-ready chronological per-game data without touching the UI yet.

Backend tasks:

- Implement `GET /statistics/teams/{team_id}/evolution`.
- Reuse existing statistics query/filter behavior and team-stat reducers where possible.
- Apply competition, game, and permitted player cohort filters.
- Omit games with zero completed points.
- Sort games chronologically by scheduled game date, with stable tie-breakers.
- Return metric catalog, presets, omitted count, and per-game metric values.

Acceptance criteria:

- API tests cover no filters, competition filters, game filters, player cohort filters, omitted empty games, and chronological ordering.
- Authorization matches team statistics access; player filters remain analyst-only when enforcement is active.
- Existing statistics endpoints keep passing unchanged.

### Milestone 3: Frontend Data Hook And Table Preview

Purpose: wire the endpoint into the statistics workflow and validate data correctness before chart work.

Frontend tasks:

- Add service/types/query key for team evolution.
- Extend `useStatisticsPageData` or add a focused hook for evolution data.
- Add an Evolution section/tab behind existing `/statistics` filters.
- Render a simple table with games as rows and default preset metrics as columns.
- Show loading, error, empty, and omitted-games states.

Acceptance criteria:

- Selecting team/competition/game filters updates the table.
- Games with no completed points do not appear.
- Permission gating matches the current Team tab behavior.
- No chart dependency is introduced in this milestone.

### Milestone 4: Chart UI

Purpose: deliver the actual evolution graph.

Frontend tasks:

- Add metric selector driven by backend catalog.
- Enforce same-unit/compatible metric selection.
- Default to the `turnover_battle` preset.
- Add chart mode control: `Auto`, `Line`, `Bar`.
- Render with the existing Chart.js stack.
- Use local-time game date formatting in labels/tooltips.
- Include opponent, competition, score, completed points, and metric values in tooltips.

Acceptance criteria:

- Counts and rates cannot be mixed in the same chart.
- `Auto`, `Line`, and `Bar` modes all render correctly.
- The chart is usable on mobile.
- Chart empty state is clear when the filtered dataset has fewer than one completed game.

### Milestone 5: Polish, Tests, And Documentation

Purpose: make the feature durable and ready for broader use.

Tasks:

- Add focused component tests for metric selection, compatibility filtering, chart mode, and empty states.
- Add MSW handler support for the evolution endpoint.
- Add or update docs where the statistics workflow is described.
- Check frontend bundle impact and keep route-level code splitting intact.
- Consider whether a CSV export for evolution data is useful later, but do not include it in v1 unless explicitly needed.

Acceptance criteria:

- Backend tests pass.
- Frontend tests pass.
- `npm run build` passes.
- The plan for strategy evolution remains separate and unblocked by v1 decisions.

## Open Questions For Later

- Should strategy evolution live under the same Evolution tab with a scope switch, or in a separate Strategy Evolution section?
- Should the evolution endpoint eventually support rolling averages?
- Should the chart allow normalized values when comparing teams or competitions of very different game lengths?
- Should evolution data be exportable as CSV?

## Risks And Guardrails

- Avoid dual-axis charts in v1; they are easy to misread.
- Avoid duplicating formulas in the frontend. The backend should compute metric values.
- Keep the metric catalog stable once exposed. Add new metric IDs instead of changing existing semantics.
- Keep player cohort filtering aligned with existing analyst-only enforcement.
- Omit empty games consistently so trend lines do not imply false zero performance.
