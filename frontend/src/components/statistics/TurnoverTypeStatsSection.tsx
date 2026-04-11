import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type {
  TurnoverType,
  TurnoverTypeBucket,
  TurnoverTypePhaseStats,
  TurnoverTypeStats,
} from "../../types";
import { TURNOVER_TYPES, getTurnoverTypeLabel } from "../../utils/turnoverTypes";

interface TurnoverTypeStatsSectionProps {
  turnoverTypeStats?: TurnoverTypeStats;
  title?: string | null;
  defaultExpandedIndex?: number | null;
  phaseKeys?: Array<keyof TurnoverTypeStats>;
  singlePhaseLayout?: boolean;
  titleVariant?: "h6" | "subtitle2";
}

interface TurnoverBucketCardProps {
  title: string;
  bucket: TurnoverTypeBucket;
  positive: boolean;
}

const PHASE_CONFIG: Array<{
  key: keyof TurnoverTypeStats;
  labelKey: string;
}> = [
  { key: "all_points", labelKey: "turnoverTypeStats.allPoints" },
  { key: "started_on_offense", labelKey: "turnoverTypeStats.startedOnOffense" },
  { key: "started_on_defense", labelKey: "turnoverTypeStats.startedOnDefense" },
];

function buildEmptyBucket(): TurnoverTypeBucket {
  return {
    total_turnovers: 0,
    by_type: Object.fromEntries(
      TURNOVER_TYPES.map((turnoverType) => [
        turnoverType,
        { count: 0, percentage: 0 },
      ]),
    ) as Record<TurnoverType, { count: number; percentage: number }>,
  };
}

function buildEmptyPhaseStats(): TurnoverTypePhaseStats {
  return {
    our_possession_turnovers: buildEmptyBucket(),
    opponent_possession_turnovers: buildEmptyBucket(),
  };
}

function getDisplayEntries(bucket: TurnoverTypeBucket) {
  const indexedTypes = TURNOVER_TYPES.map((turnoverType, index) => ({
    turnoverType,
    index,
    stats: bucket.by_type[turnoverType],
  }));

  return indexedTypes
    .filter((entry) => entry.stats.count > 0)
    .sort((left, right) => {
      if (right.stats.count !== left.stats.count) {
        return right.stats.count - left.stats.count;
      }
      return left.index - right.index;
    });
}

function TurnoverBucketCard({
  title,
  bucket,
  positive,
}: TurnoverBucketCardProps) {
  const theme = useTheme();
  const { t } = useTranslation(["statistics", "points"]);
  const entries = getDisplayEntries(bucket);
  const accentColor = positive
    ? theme.colors.performance.veryHigh
    : theme.colors.performance.low;

  return (
    <Paper
      role="group"
      aria-label={title}
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        borderColor: alpha(accentColor, 0.28),
        backgroundColor: alpha(accentColor, 0.03),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: accentColor,
            fontWeight: 700,
          }}
        >
          {bucket.total_turnovers === 1
            ? t("statistics:turnoverTypeStats.turnoverCountSingle")
            : t("statistics:turnoverTypeStats.turnoverCountPlural", {
                count: bucket.total_turnovers,
              })}
        </Typography>
      </Box>

      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("statistics:turnoverTypeStats.emptyBucket")}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {entries.map(({ turnoverType, stats }) => (
            <Box key={turnoverType}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 2,
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  {getTurnoverTypeLabel(t, turnoverType)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(stats.percentage * 100)}% ({stats.count})
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round(stats.percentage * 100)}
                sx={{
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: alpha(accentColor, 0.12),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: accentColor,
                  },
                }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function TurnoverTypeStatsSection({
  turnoverTypeStats,
  title,
  defaultExpandedIndex = 0,
  phaseKeys,
  singlePhaseLayout = false,
  titleVariant = "h6",
}: TurnoverTypeStatsSectionProps) {
  const { t } = useTranslation("statistics");
  const phaseStats = turnoverTypeStats ?? {
    all_points: buildEmptyPhaseStats(),
    started_on_offense: buildEmptyPhaseStats(),
    started_on_defense: buildEmptyPhaseStats(),
  };
  const visiblePhases = PHASE_CONFIG.filter(
    (phaseConfig) => !phaseKeys || phaseKeys.includes(phaseConfig.key),
  );

  if (singlePhaseLayout && visiblePhases.length === 1) {
    const phase = phaseStats[visiblePhases[0].key];

    return (
      <Box sx={{ mt: title === null ? 2 : 4 }}>
        {title !== null && (
          <Typography variant={titleVariant} sx={{ mb: 2 }} fontWeight={titleVariant === "subtitle2" ? "bold" : undefined}>
            {title ?? t("turnoverTypeStats.title")}
          </Typography>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TurnoverBucketCard
              title={t("turnoverTypeStats.opponentPossessionTurnovers")}
              bucket={phase.opponent_possession_turnovers}
              positive
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TurnoverBucketCard
              title={t("turnoverTypeStats.ourPossessionTurnovers")}
              bucket={phase.our_possession_turnovers}
              positive={false}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: title === null ? 2 : 4 }}>
      {title !== null && (
        <Typography variant={titleVariant} sx={{ mb: 2 }} fontWeight={titleVariant === "subtitle2" ? "bold" : undefined}>
          {title ?? t("turnoverTypeStats.title")}
        </Typography>
      )}

      <Stack spacing={0}>
        {visiblePhases.map((phaseConfig, index) => {
          const phase = phaseStats[phaseConfig.key];

          return (
            <Accordion
              key={phaseConfig.key}
              disableGutters
              defaultExpanded={defaultExpandedIndex === index}
              elevation={0}
              sx={{
                bgcolor: "transparent",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: 0,
                  minHeight: "unset",
                  borderTop: index === 0 ? 0 : 1,
                  borderColor: "divider",
                  "& .MuiAccordionSummary-content": {
                    my: 1.75,
                  },
                  "& .MuiAccordionSummary-content.Mui-expanded": {
                    my: 1.75,
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {t(phaseConfig.labelKey)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: 0,
                  pt: 0,
                  pb: 2,
                }}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TurnoverBucketCard
                      title={t("turnoverTypeStats.opponentPossessionTurnovers")}
                      bucket={phase.opponent_possession_turnovers}
                      positive
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TurnoverBucketCard
                      title={t("turnoverTypeStats.ourPossessionTurnovers")}
                      bucket={phase.our_possession_turnovers}
                      positive={false}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
}
