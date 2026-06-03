import { useMemo, useState, type ReactNode } from "react";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AdjustIcon from "@mui/icons-material/Adjust";
import BoltIcon from "@mui/icons-material/Bolt";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagIcon from "@mui/icons-material/Flag";
import ShieldIcon from "@mui/icons-material/Shield";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import LoadingState from "../../components/shared/LoadingState";
import TurnoverTypeStatsSection from "../../components/statistics/TurnoverTypeStatsSection";
import type {
  DefenseStrategyStats,
  OffenseStrategyStats,
  StrategyStatsBase,
  TeamStatsBase,
  TurnoverTypeBucket,
  TurnoverTypeStats,
} from "../../types";
import { TURNOVER_TYPES, getTurnoverTypeLabel } from "../../utils/turnoverTypes";

interface DatasetRecord {
  draws: number;
  losses: number;
  wins: number;
}

interface NewStatisticsCurrentStatsProps {
  gamesCount: number;
  isLoadingStrategyStats: boolean;
  isLoadingTeamStats: boolean;
  record: DatasetRecord;
  showFieldSideStats?: boolean;
  strategyStats?: StrategyStatsBase;
  teamStats?: TeamStatsBase;
}

type TurnoverPhaseKey = keyof TurnoverTypeStats;

interface KpiCardProps {
  caption?: string;
  icon: ReactNode;
  label: string;
  tone?: "primary" | "success" | "warning" | "danger";
  value: string | number;
}

interface MetricRowProps {
  context: string;
  label: string;
  tone?: "offense" | "defense";
  value: string;
  progress?: number;
}

const TURNOVER_PHASES: TurnoverPhaseKey[] = [
  "all_points",
  "started_on_offense",
  "started_on_defense",
];

function formatPercentage(value?: number, total?: number) {
  if (value === undefined || total === 0) {
    return "-";
  }

  return `${Math.round(value * 100)}%`;
}

function formatCount(value?: number) {
  return value ?? 0;
}

function getTopOffenseStrategy(
  strategyStats?: StrategyStatsBase
): OffenseStrategyStats | undefined {
  return [...(strategyStats?.offense_strategies ?? [])].sort(
    (left, right) => right.hold_rate - left.hold_rate
  )[0];
}

function getTopDefenseStrategy(
  strategyStats?: StrategyStatsBase
): DefenseStrategyStats | undefined {
  return [...(strategyStats?.defense_strategies ?? [])].sort(
    (left, right) => right.turnover_rate - left.turnover_rate
  )[0];
}

function hasStrategyData(strategyStats?: StrategyStatsBase) {
  return Boolean(
    strategyStats &&
      (strategyStats.offense_strategies.length > 0 ||
        strategyStats.defense_strategies.length > 0)
  );
}

function KpiCard({ caption, icon, label, tone = "primary", value }: KpiCardProps) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
        p: { xs: 1.75, sm: 2 },
      })}
    >
      <Stack spacing={1.5}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Box
            sx={(theme) => {
              const toneColor =
                tone === "success"
                  ? theme.palette.success.dark
                  : tone === "warning"
                    ? theme.colors.performance.low
                    : tone === "danger"
                      ? theme.palette.error.main
                      : theme.colors.newUi.primary;

              return {
                alignItems: "center",
                bgcolor: alpha(toneColor, 0.08),
                borderRadius: 1,
                color: toneColor,
                display: "inline-flex",
                height: 34,
                justifyContent: "center",
                width: 34,
              };
            }}
          >
            {icon}
          </Box>
          <Typography color="text.secondary" fontWeight={800} variant="body2">
            {label}
          </Typography>
        </Stack>
        <Box>
          <Typography fontWeight={900} lineHeight={1} variant="h4">
            {value}
          </Typography>
          {caption && (
            <Typography
              color="text.secondary"
              display="block"
              fontWeight={700}
              sx={{ mt: 0.75 }}
              variant="caption"
            >
              {caption}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function MetricRow({ context, label, progress, tone = "offense", value }: MetricRowProps) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        borderTop: `1px solid ${theme.palette.divider}`,
        display: "grid",
        gap: 2,
        gridTemplateColumns: "minmax(0, 1fr) auto",
        py: 1.5,
        "&:first-of-type": {
          borderTop: 0,
        },
      })}
    >
      <Box>
        <Typography fontWeight={850} variant="body2">
          {label}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {context}
        </Typography>
      </Box>
      <Stack alignItems="flex-end" spacing={0.75}>
        <Typography fontWeight={900} variant="h6">
          {value}
        </Typography>
        {progress !== undefined && (
          <LinearProgress
            value={Math.round(progress * 100)}
            variant="determinate"
            sx={(theme) => ({
              bgcolor: alpha(theme.palette.text.primary, 0.08),
              borderRadius: 999,
              height: 7,
              width: 112,
              "& .MuiLinearProgress-bar": {
                bgcolor:
                  tone === "defense"
                    ? theme.palette.success.dark
                    : theme.colors.newUi.primary,
                borderRadius: 999,
              },
            })}
          />
        )}
      </Stack>
    </Box>
  );
}

function SideIcon({
  icon,
  side,
}: {
  icon: ReactNode;
  side: "offense" | "defense";
}) {
  return (
    <Box
      sx={(theme) => {
        const isOffense = side === "offense";
        const color = isOffense
          ? theme.colors.newUi.primary
          : theme.palette.success.dark;

        return {
          alignItems: "center",
          bgcolor: isOffense
            ? theme.colors.newUi.primarySoft
            : alpha(theme.palette.success.main, 0.1),
          borderRadius: "50%",
          color,
          display: "inline-flex",
          flexShrink: 0,
          height: 40,
          justifyContent: "center",
          width: 40,
        };
      }}
    >
      {icon}
    </Box>
  );
}

function StrategyMiniCard({
  metricLabel,
  metricValue,
  pointsPlayed,
  strategyName,
}: {
  metricLabel: string;
  metricValue: string;
  pointsPlayed: number;
  strategyName: string;
}) {
  const { t } = useTranslation("statistics");

  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: "minmax(0, 1fr) auto",
        p: 1.5,
      })}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={850} noWrap>
          {strategyName}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {t("strategyStats.pointsPlayedWithCount", {
            count: pointsPlayed,
            defaultValue: "{{count}} points played",
          })}
        </Typography>
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography fontWeight={900} variant="h6">
          {metricValue}
        </Typography>
        <Typography color="text.secondary" fontWeight={800} variant="caption">
          {metricLabel}
        </Typography>
      </Box>
    </Box>
  );
}

function StatsPanel({
  children,
  chipLabel,
  description,
  icon,
  side,
  title,
}: {
  children: ReactNode;
  chipLabel: string;
  description: string;
  icon: ReactNode;
  side: "offense" | "defense";
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
        p: { xs: 2, sm: 2.5 },
      })}
    >
      <Stack spacing={2}>
        <Stack
          alignItems="flex-start"
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack alignItems="center" direction="row" spacing={1.25}>
            <SideIcon icon={icon} side={side} />
            <Box>
              <Typography fontWeight={900} variant="h6">
                {title}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {description}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={chipLabel}
            size="small"
            sx={(theme) => ({
              bgcolor:
                side === "offense"
                  ? theme.colors.newUi.primarySoft
                  : alpha(theme.palette.success.main, 0.1),
              color:
                side === "offense"
                  ? theme.colors.newUi.primary
                  : theme.palette.success.dark,
              flexShrink: 0,
              fontWeight: 900,
            })}
          />
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function PhaseButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={(theme) => ({
        alignItems: "center",
        bgcolor: active ? theme.colors.newUi.primarySoft : theme.palette.background.paper,
        border: `1px solid ${
          active ? theme.colors.newUi.primaryBorder : theme.palette.divider
        }`,
        borderRadius: 1,
        color: active ? theme.colors.newUi.primary : theme.palette.text.secondary,
        display: "flex",
        fontWeight: 900,
        justifyContent: "space-between",
        minHeight: 44,
        px: 1.5,
        textAlign: "left",
        width: "100%",
      })}
    >
      <span>{label}</span>
      <Chip label={count} size="small" sx={{ fontWeight: 900 }} />
    </ButtonBase>
  );
}

function getTurnoverBucketEntries(bucket: TurnoverTypeBucket) {
  return TURNOVER_TYPES.map((turnoverType, index) => ({
    turnoverType,
    index,
    stats: bucket.by_type[turnoverType] ?? { count: 0, percentage: 0 },
  }))
    .filter((entry) => entry.stats.count > 0)
    .sort((left, right) => {
      if (right.stats.count !== left.stats.count) {
        return right.stats.count - left.stats.count;
      }
      return left.index - right.index;
    });
}

function TurnoverBucketCard({
  bucket,
  positive,
  title,
}: {
  bucket: TurnoverTypeBucket;
  positive: boolean;
  title: string;
}) {
  const { t } = useTranslation(["statistics", "points"]);
  const entries = getTurnoverBucketEntries(bucket);

  return (
    <Box
      sx={(theme) => {
        const color = positive
          ? theme.palette.success.dark
          : theme.colors.performance.low;

        return {
          bgcolor: alpha(color, positive ? 0.04 : 0.05),
          border: `1px solid ${alpha(color, positive ? 0.24 : 0.28)}`,
          borderRadius: 1,
          p: 1.75,
        };
      }}
    >
      <Stack
        alignItems="baseline"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 1.5 }}
      >
        <Typography fontWeight={900} variant="subtitle2">
          {title}
        </Typography>
        <Typography color="text.secondary" fontWeight={800} variant="caption">
          {bucket.total_turnovers === 1
            ? t("statistics:turnoverTypeStats.turnoverCountSingle")
            : t("statistics:turnoverTypeStats.turnoverCountPlural", {
                count: bucket.total_turnovers,
              })}
        </Typography>
      </Stack>

      {entries.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {t("statistics:turnoverTypeStats.emptyBucket")}
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {entries.map(({ turnoverType, stats }) => (
            <Box key={turnoverType}>
              <Stack
                alignItems="baseline"
                direction="row"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 0.5 }}
              >
                <Typography fontWeight={800} variant="body2">
                  {getTurnoverTypeLabel(t, turnoverType)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {Math.round(stats.percentage * 100)}% ({stats.count})
                </Typography>
              </Stack>
              <LinearProgress
                value={Math.round(stats.percentage * 100)}
                variant="determinate"
                sx={(theme) => {
                  const color = positive
                    ? theme.palette.success.dark
                    : theme.colors.performance.low;

                  return {
                    bgcolor: alpha(color, 0.14),
                    borderRadius: 999,
                    height: 7,
                    "& .MuiLinearProgress-bar": {
                      bgcolor: color,
                      borderRadius: 999,
                    },
                  };
                }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function getPhaseTurnoverTotal(
  turnoverTypeStats: TurnoverTypeStats,
  phaseKey: TurnoverPhaseKey
) {
  const phase = turnoverTypeStats[phaseKey];
  return (
    phase.our_possession_turnovers.total_turnovers +
    phase.opponent_possession_turnovers.total_turnovers
  );
}

function hasTrackedOffenseFieldSideStats(teamStats?: TeamStatsBase): boolean {
  if (!teamStats) {
    return false;
  }

  return (
    teamStats.field_side_stats.table_left.offense.points_started +
      teamStats.field_side_stats.table_right.offense.points_started >
    0
  );
}

function hasTrackedDefenseFieldSideStats(teamStats?: TeamStatsBase): boolean {
  if (!teamStats) {
    return false;
  }

  return (
    teamStats.field_side_stats.table_left.defense.points_started +
      teamStats.field_side_stats.table_right.defense.points_started >
    0
  );
}

function FieldSideMetricRow({
  count,
  label,
  percentage,
  tone,
  total,
}: {
  count: number;
  label: string;
  percentage: number;
  tone: "offense" | "defense";
  total: number;
}) {
  const hasData = total > 0;

  return (
    <Box>
      <Stack alignItems="baseline" direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary" fontWeight={800} variant="body2">
          {label}
        </Typography>
        <Typography fontWeight={900} variant="body2">
          {hasData ? `${Math.round(percentage * 100)}%` : "-"} ({count}/{total})
        </Typography>
      </Stack>
      <LinearProgress
        value={hasData ? Math.round(percentage * 100) : 0}
        variant="determinate"
        sx={(theme) => ({
          bgcolor: alpha(
            tone === "defense" ? theme.palette.success.main : theme.colors.newUi.primary,
            0.12
          ),
          borderRadius: 999,
          height: 7,
          mt: 0.75,
          "& .MuiLinearProgress-bar": {
            bgcolor:
              tone === "defense"
                ? theme.palette.success.dark
                : theme.colors.newUi.primary,
            borderRadius: 999,
          },
        })}
      />
    </Box>
  );
}

function FieldSideMetricCard({
  children,
  icon,
  side,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  side: "offense" | "defense";
  title: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        bgcolor:
          side === "defense"
            ? alpha(theme.palette.success.main, 0.04)
            : theme.colors.newUi.primarySoft,
        border: `1px solid ${
          side === "defense"
            ? alpha(theme.palette.success.main, 0.18)
            : theme.colors.newUi.primaryBorder
        }`,
        borderRadius: 1,
        p: 2,
      })}
    >
      <Stack spacing={1.5}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <SideIcon icon={icon} side={side} />
          <Typography fontWeight={900} variant="subtitle1">
            {title}
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function FieldSideStatsSection({
  teamStats,
}: {
  teamStats?: TeamStatsBase;
}) {
  const { t } = useTranslation("statistics");
  const showOffense = hasTrackedOffenseFieldSideStats(teamStats);
  const showDefense = hasTrackedDefenseFieldSideStats(teamStats);

  if (!teamStats || (!showOffense && !showDefense)) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: { xs: 2, sm: 2.5 },
      })}
    >
      <Stack spacing={2}>
        <Box>
          <Typography fontWeight={900} variant="h6">
            {t("teamStats.advancedStats")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t("teamStats.holdByFieldSide")} / {t("teamStats.breakByFieldSide")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          {showOffense && (
            <FieldSideMetricCard
              icon={<BoltIcon fontSize="small" />}
              side="offense"
              title={t("teamStats.holdByFieldSide")}
            >
              <FieldSideMetricRow
                count={teamStats.field_side_stats.table_left.offense.points_won}
                label={t("teamStats.leftSide")}
                percentage={teamStats.field_side_stats.table_left.offense.hold_rate}
                tone="offense"
                total={teamStats.field_side_stats.table_left.offense.points_started}
              />
              <FieldSideMetricRow
                count={teamStats.field_side_stats.table_right.offense.points_won}
                label={t("teamStats.rightSide")}
                percentage={teamStats.field_side_stats.table_right.offense.hold_rate}
                tone="offense"
                total={teamStats.field_side_stats.table_right.offense.points_started}
              />
            </FieldSideMetricCard>
          )}
          {showDefense && (
            <FieldSideMetricCard
              icon={<ShieldIcon fontSize="small" />}
              side="defense"
              title={t("teamStats.breakByFieldSide")}
            >
              <FieldSideMetricRow
                count={teamStats.field_side_stats.table_left.defense.points_won}
                label={t("teamStats.leftSide")}
                percentage={teamStats.field_side_stats.table_left.defense.break_rate}
                tone="defense"
                total={teamStats.field_side_stats.table_left.defense.points_started}
              />
              <FieldSideMetricRow
                count={teamStats.field_side_stats.table_right.defense.points_won}
                label={t("teamStats.rightSide")}
                percentage={teamStats.field_side_stats.table_right.defense.break_rate}
                tone="defense"
                total={teamStats.field_side_stats.table_right.defense.points_started}
              />
            </FieldSideMetricCard>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

function TurnoverTypesSection({
  turnoverTypeStats,
}: {
  turnoverTypeStats?: TurnoverTypeStats;
}) {
  const { t } = useTranslation("statistics");
  const [activePhase, setActivePhase] = useState<TurnoverPhaseKey>("all_points");

  if (!turnoverTypeStats) {
    return null;
  }

  const phase = turnoverTypeStats[activePhase];

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        mt: 2,
        p: { xs: 2, sm: 2.5 },
      })}
    >
      <Stack spacing={2}>
        <Stack
          alignItems="flex-start"
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Stack alignItems="center" direction="row" spacing={1.25}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: theme.colors.newUi.primarySoft,
                borderRadius: 1,
                color: theme.colors.newUi.primary,
                display: "inline-flex",
                height: 40,
                justifyContent: "center",
                width: 40,
              })}
            >
              <AccountTreeIcon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={900} variant="h6">
                {t("turnoverTypeStats.title")}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {t("newUi.currentStats.turnoverTypesDescription")}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={t(`turnoverTypeStats.${phaseLabelKey(activePhase)}`)}
            size="small"
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        <Box
          sx={{
            alignItems: "flex-start",
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "230px minmax(0, 1fr)" },
          }}
        >
          <Stack spacing={1}>
            {TURNOVER_PHASES.map((phaseKey) => (
              <PhaseButton
                active={activePhase === phaseKey}
                count={getPhaseTurnoverTotal(turnoverTypeStats, phaseKey)}
                key={phaseKey}
                label={t(`turnoverTypeStats.${phaseLabelKey(phaseKey)}`)}
                onClick={() => setActivePhase(phaseKey)}
              />
            ))}
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <TurnoverBucketCard
              bucket={phase.opponent_possession_turnovers}
              positive
              title={t("turnoverTypeStats.opponentPossessionTurnovers")}
            />
            <TurnoverBucketCard
              bucket={phase.our_possession_turnovers}
              positive={false}
              title={t("turnoverTypeStats.ourPossessionTurnovers")}
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

function phaseLabelKey(phaseKey: TurnoverPhaseKey) {
  if (phaseKey === "started_on_offense") {
    return "startedOnOffense";
  }
  if (phaseKey === "started_on_defense") {
    return "startedOnDefense";
  }
  return "allPoints";
}

function StrategyProgressRow({
  count,
  label,
  percentage,
  side,
  total,
}: {
  count: number;
  label: string;
  percentage: number;
  side: "offense" | "defense";
  total: number;
}) {
  const hasData = total > 0;

  return (
    <Box>
      <Stack alignItems="baseline" direction="row" justifyContent="space-between" spacing={2}>
        <Typography color="text.secondary" fontWeight={800} variant="body2">
          {label}
        </Typography>
        <Typography fontWeight={900} variant="body2">
          {hasData ? `${Math.round(percentage * 100)}%` : "-"} ({count}/{total})
        </Typography>
      </Stack>
      <LinearProgress
        value={hasData ? Math.round(percentage * 100) : 0}
        variant="determinate"
        sx={(theme) => ({
          bgcolor:
            side === "defense"
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.colors.newUi.primary, 0.12),
          borderRadius: 999,
          height: 7,
          mt: 0.75,
          "& .MuiLinearProgress-bar": {
            bgcolor:
              side === "defense"
                ? theme.palette.success.dark
                : theme.colors.newUi.primary,
            borderRadius: 999,
          },
        })}
      />
    </Box>
  );
}

function StrategyAccordion({
  children,
  icon,
  mainMetricLabel,
  mainMetricValue,
  pointsPlayed,
  side,
  strategyName,
}: {
  children: ReactNode;
  icon: ReactNode;
  mainMetricLabel: string;
  mainMetricValue: string;
  pointsPlayed: number;
  side: "offense" | "defense";
  strategyName: string;
}) {
  const { t } = useTranslation("statistics");

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        "&:before": { display: "none" },
        "&.Mui-expanded": {
          borderColor:
            side === "defense"
              ? alpha(theme.palette.success.main, 0.32)
              : theme.colors.newUi.primaryBorder,
        },
      })}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 72,
          px: 1.5,
          py: 0.75,
          "& .MuiAccordionSummary-content": {
            m: 0,
          },
          "& .MuiAccordionSummary-content.Mui-expanded": {
            m: 0,
          },
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ minWidth: 0, width: "100%" }}
        >
          <Stack alignItems="center" direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
            <SideIcon icon={icon} side={side} />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900} noWrap>
                {strategyName}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {t("strategyStats.pointsPlayedWithCount", {
                  count: pointsPlayed,
                  defaultValue: "{{count}} points played",
                })}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ flexShrink: 0, textAlign: "right" }}>
            <Typography fontWeight={900} variant="h6">
              {mainMetricValue}
            </Typography>
            <Typography color="text.secondary" fontWeight={800} variant="caption">
              {mainMetricLabel}
            </Typography>
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        sx={(theme) => ({
          bgcolor:
            side === "defense"
              ? alpha(theme.palette.success.main, 0.04)
              : theme.colors.newUi.primarySoft,
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 1.5,
        })}
      >
        <Stack spacing={1.5}>{children}</Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function StrategyDetails({
  isLoading,
  strategyStats,
}: {
  isLoading: boolean;
  strategyStats?: StrategyStatsBase;
}) {
  const { t } = useTranslation("statistics");

  if (isLoading) {
    return <LoadingState showColdStartHint={false} />;
  }

  if (!hasStrategyData(strategyStats)) {
    return null;
  }

  const offenseStrategies = [...(strategyStats?.offense_strategies ?? [])].sort(
    (left, right) => right.hold_rate - left.hold_rate
  );
  const defenseStrategies = [...(strategyStats?.defense_strategies ?? [])].sort(
    (left, right) => right.turnover_rate - left.turnover_rate
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography fontWeight={900} variant="h6">
          {t("newUi.currentStats.strategyDetails")}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t("newUi.currentStats.strategyDetailsDescription")}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {offenseStrategies.length > 0 && (
          <Paper
            elevation={0}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
            })}
          >
            <Stack spacing={1.25}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <SideIcon icon={<BoltIcon fontSize="small" />} side="offense" />
                <Typography fontWeight={900} variant="subtitle1">
                  {t("strategyStats.offenseStrategies")}
                </Typography>
              </Stack>
              {offenseStrategies.map((strategy) => (
                <StrategyAccordion
                  icon={<BoltIcon fontSize="small" />}
                  key={strategy.strategy_id}
                  mainMetricLabel={t("strategyStats.holdRate")}
                  mainMetricValue={formatPercentage(
                    strategy.hold_rate,
                    strategy.points_played
                  )}
                  pointsPlayed={strategy.points_played}
                  side="offense"
                  strategyName={strategy.strategy_name}
                >
                  <StrategyProgressRow
                    count={strategy.points_won}
                    label={t("strategyStats.holdRate")}
                    percentage={strategy.hold_rate}
                    side="offense"
                    total={strategy.points_played}
                  />
                  <StrategyProgressRow
                    count={strategy.clean_holds}
                    label={t("strategyStats.cleanHolds")}
                    percentage={strategy.clean_hold_rate}
                    side="offense"
                    total={strategy.points_played}
                  />
                  <StrategyProgressRow
                    count={strategy.quick_scores}
                    label={t("strategyStats.quickScores")}
                    percentage={strategy.quick_score_rate}
                    side="offense"
                    total={strategy.points_played}
                  />
                </StrategyAccordion>
              ))}
            </Stack>
          </Paper>
        )}

        {defenseStrategies.length > 0 && (
          <Paper
            elevation={0}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
            })}
          >
            <Stack spacing={1.25}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <SideIcon icon={<ShieldIcon fontSize="small" />} side="defense" />
                <Typography fontWeight={900} variant="subtitle1">
                  {t("strategyStats.defenseStrategies")}
                </Typography>
              </Stack>
              {defenseStrategies.map((strategy) => (
                <StrategyAccordion
                  icon={<ShieldIcon fontSize="small" />}
                  key={strategy.strategy_id}
                  mainMetricLabel={t("strategyStats.turnoverRate")}
                  mainMetricValue={formatPercentage(
                    strategy.turnover_rate,
                    strategy.points_played
                  )}
                  pointsPlayed={strategy.points_played}
                  side="defense"
                  strategyName={strategy.strategy_name}
                >
                  <StrategyProgressRow
                    count={strategy.points_with_turnover}
                    label={t("strategyStats.turnoverRate")}
                    percentage={strategy.turnover_rate}
                    side="defense"
                    total={strategy.points_played}
                  />
                  <StrategyProgressRow
                    count={strategy.points_won}
                    label={t("strategyStats.breakRate")}
                    percentage={strategy.break_rate}
                    side="defense"
                    total={strategy.points_played}
                  />
                  {strategy.turnover_type_stats && (
                    <TurnoverTypeStatsSection
                      phaseKeys={["started_on_defense"]}
                      singlePhaseLayout
                      title={t("strategyStats.turnoverTypesForStrategy", {
                        strategyName: strategy.strategy_name,
                      })}
                      titleVariant="subtitle2"
                      turnoverTypeStats={strategy.turnover_type_stats}
                    />
                  )}
                </StrategyAccordion>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default function NewStatisticsCurrentStats({
  gamesCount,
  isLoadingStrategyStats,
  isLoadingTeamStats,
  record,
  showFieldSideStats = false,
  strategyStats,
  teamStats,
}: NewStatisticsCurrentStatsProps) {
  const { t } = useTranslation(["statistics", "games", "common"]);
  const topOffenseStrategy = useMemo(
    () => getTopOffenseStrategy(strategyStats),
    [strategyStats]
  );
  const topDefenseStrategy = useMemo(
    () => getTopDefenseStrategy(strategyStats),
    [strategyStats]
  );

  if (isLoadingTeamStats) {
    return <LoadingState showColdStartHint={false} />;
  }

  const offensePoints = teamStats?.offense.points_started ?? 0;
  const defensePoints = teamStats?.defense.points_started ?? 0;
  const totalPoints = teamStats?.total_completed_points ?? 0;
  const ourTurns =
    (teamStats?.offense.our_turnovers ?? 0) + (teamStats?.defense.our_turnovers ?? 0);
  const opponentTurns =
    (teamStats?.offense.opponent_turnovers ?? 0) +
    (teamStats?.defense.opponent_turnovers ?? 0);
  const cleanWonPoints =
    (teamStats?.offense.points_won_no_turnover ?? 0) +
    (teamStats?.defense.points_won_no_turnover ?? 0);
  const wonPoints =
    (teamStats?.offense.points_won ?? 0) + (teamStats?.defense.points_won ?? 0);
  const cleanWonPointRate =
    wonPoints > 0 ? cleanWonPoints / wonPoints : undefined;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(5, minmax(0, 1fr))",
          },
          "& > :last-child": {
            gridColumn: { xs: "1 / -1", md: "auto" },
          },
        }}
      >
        <KpiCard
          caption={
            record.draws > 0
              ? t("games:status.drawWithCount", {
                  count: record.draws,
                  defaultValue: "{{count}} draw",
                })
              : t("statistics:newUi.currentStats.noDraw")
          }
          icon={<FlagIcon fontSize="small" />}
          label={t("statistics:teamStats.winLossRatio")}
          value={`${record.wins}-${record.losses}`}
        />
        <KpiCard
          caption={t("statistics:newUi.currentStats.holdCaption", {
            count: teamStats?.offense.points_won ?? 0,
            total: offensePoints,
          })}
          icon={<BoltIcon fontSize="small" />}
          label={t("statistics:newUi.currentStats.holdRate")}
          value={formatPercentage(teamStats?.offense.hold_rate, offensePoints)}
        />
        <KpiCard
          caption={t("statistics:newUi.currentStats.breakCaption", {
            count: teamStats?.defense.points_won ?? 0,
            total: defensePoints,
          })}
          icon={<ShieldIcon fontSize="small" />}
          label={t("statistics:newUi.currentStats.breakRate")}
          tone="success"
          value={formatPercentage(teamStats?.defense.break_rate, defensePoints)}
        />
        <KpiCard
          caption={t("statistics:newUi.currentStats.turnoversCaption")}
          icon={<SwapHorizIcon fontSize="small" />}
          label={t("statistics:newUi.currentStats.turnovers")}
          tone={ourTurns > opponentTurns ? "warning" : "success"}
          value={`${ourTurns}-${opponentTurns}`}
        />
        <KpiCard
          caption={t("statistics:newUi.currentStats.cleanWinsCaption", {
            count: cleanWonPoints,
            total: wonPoints,
          })}
          icon={<AdjustIcon fontSize="small" />}
          label={t("statistics:newUi.currentStats.cleanWins")}
          value={formatPercentage(cleanWonPointRate, wonPoints)}
        />
      </Box>

      <Box
        sx={{
          alignItems: "stretch",
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 2fr)" },
        }}
      >
        <StatsPanel
          chipLabel={t("statistics:newUi.currentStats.pointsCount", {
            count: offensePoints,
          })}
          description={t("statistics:newUi.currentStats.offenseDescription")}
          icon={<BoltIcon fontSize="small" />}
          side="offense"
          title={t("statistics:teamStats.offense")}
        >
          <Typography
            color="text.secondary"
            fontWeight={850}
            letterSpacing={0.6}
            textTransform="uppercase"
            variant="caption"
          >
            {t("statistics:newUi.currentStats.coreMetrics")}
          </Typography>
          <Box>
            <MetricRow
              context={t("statistics:tooltips.holdRate")}
              label={t("statistics:teamStats.hold")}
              progress={teamStats?.offense.hold_rate}
              value={formatPercentage(teamStats?.offense.hold_rate, offensePoints)}
            />
            <MetricRow
              context={t("statistics:tooltips.cleanPointRate")}
              label={t("statistics:teamStats.cleanHold")}
              progress={teamStats?.offense.clean_hold_rate}
              value={formatPercentage(
                teamStats?.offense.clean_hold_rate,
                offensePoints
              )}
            />
            <MetricRow
              context={t("statistics:newUi.currentStats.ourTurnsOffenseContext")}
              label={t("statistics:newUi.currentStats.ourTurnsOffense")}
              value={String(formatCount(teamStats?.offense.our_turnovers))}
            />
          </Box>

          {topOffenseStrategy && (
            <Box
              sx={(theme) => ({
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 1.5,
              })}
            >
              <Typography
                color="text.secondary"
                fontWeight={850}
                letterSpacing={0.6}
                textTransform="uppercase"
                variant="caption"
              >
                {t("statistics:newUi.currentStats.bestOffenseStrategy")}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StrategyMiniCard
                  metricLabel={t("statistics:strategyStats.holdRate")}
                  metricValue={formatPercentage(
                    topOffenseStrategy.hold_rate,
                    topOffenseStrategy.points_played
                  )}
                  pointsPlayed={topOffenseStrategy.points_played}
                  strategyName={topOffenseStrategy.strategy_name}
                />
              </Box>
            </Box>
          )}
        </StatsPanel>

        <StatsPanel
          chipLabel={t("statistics:newUi.currentStats.pointsCount", {
            count: defensePoints,
          })}
          description={t("statistics:newUi.currentStats.defenseDescription")}
          icon={<ShieldIcon fontSize="small" />}
          side="defense"
          title={t("statistics:teamStats.defense")}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <Box>
              <Typography
                color="text.secondary"
                fontWeight={850}
                letterSpacing={0.6}
                textTransform="uppercase"
                variant="caption"
              >
                {t("statistics:newUi.currentStats.coreMetrics")}
              </Typography>
              <Box>
                <MetricRow
                  context={t("statistics:tooltips.turnoverRate")}
                  label={t("statistics:teamStats.turnover")}
                  progress={teamStats?.defense.turnover_rate}
                  tone="defense"
                  value={formatPercentage(
                    teamStats?.defense.turnover_rate,
                    defensePoints
                  )}
                />
                <MetricRow
                  context={t("statistics:tooltips.breakRate")}
                  label={t("statistics:teamStats.break")}
                  progress={teamStats?.defense.break_rate}
                  tone="defense"
                  value={formatPercentage(teamStats?.defense.break_rate, defensePoints)}
                />
                <MetricRow
                  context={t("statistics:tooltips.cleanBreakRate")}
                  label={t("statistics:teamStats.cleanBreak")}
                  progress={teamStats?.defense.clean_break_rate}
                  tone="defense"
                  value={formatPercentage(
                    teamStats?.defense.clean_break_rate,
                    defensePoints
                  )}
                />
              </Box>
            </Box>

            <Box>
              <Typography
                color="text.secondary"
                fontWeight={850}
                letterSpacing={0.6}
                textTransform="uppercase"
                variant="caption"
              >
                {t("statistics:newUi.currentStats.advancedDefense")}
              </Typography>
              <Box>
                <MetricRow
                  context={t("statistics:tooltips.conversionRate")}
                  label={t("statistics:teamStats.conversion")}
                  progress={teamStats?.defense.conversion_rate}
                  tone="defense"
                  value={formatPercentage(
                    teamStats?.defense.conversion_rate,
                    teamStats?.defense.points_with_turnover
                  )}
                />
                <MetricRow
                  context={t("statistics:tooltips.cleanConversionRate")}
                  label={t("statistics:teamStats.cleanConversion")}
                  progress={teamStats?.defense.clean_conversion_rate}
                  tone="defense"
                  value={formatPercentage(
                    teamStats?.defense.clean_conversion_rate,
                    teamStats?.defense.points_with_turnover
                  )}
                />
                <MetricRow
                  context={t("statistics:tooltips.pullRate")}
                  label={t("statistics:teamStats.pullInbound")}
                  progress={teamStats?.defense.pull_stats.inbound_rate}
                  tone="defense"
                  value={formatPercentage(
                    teamStats?.defense.pull_stats.inbound_rate,
                    teamStats?.defense.pull_stats.total_pulls
                  )}
                />
              </Box>
            </Box>
          </Box>

          {topDefenseStrategy && (
            <Box
              sx={(theme) => ({
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 1.5,
              })}
            >
              <Typography
                color="text.secondary"
                fontWeight={850}
                letterSpacing={0.6}
                textTransform="uppercase"
                variant="caption"
              >
                {t("statistics:newUi.currentStats.bestDefenseStrategy")}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StrategyMiniCard
                  metricLabel={t("statistics:strategyStats.turnoverRate")}
                  metricValue={formatPercentage(
                    topDefenseStrategy.turnover_rate,
                    topDefenseStrategy.points_played
                  )}
                  pointsPlayed={topDefenseStrategy.points_played}
                  strategyName={topDefenseStrategy.strategy_name}
                />
              </Box>
            </Box>
          )}
        </StatsPanel>
      </Box>

      <TurnoverTypesSection turnoverTypeStats={teamStats?.turnover_type_stats} />

      {showFieldSideStats && <FieldSideStatsSection teamStats={teamStats} />}

      <StrategyDetails
        isLoading={isLoadingStrategyStats}
        strategyStats={strategyStats}
      />

      {totalPoints === 0 && gamesCount === 0 && (
        <Paper
          elevation={0}
          sx={(theme) => ({
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            color: "text.secondary",
            p: 3,
            textAlign: "center",
          })}
        >
          <Typography>{t("common:messages.noData")}</Typography>
        </Paper>
      )}
    </Stack>
  );
}
