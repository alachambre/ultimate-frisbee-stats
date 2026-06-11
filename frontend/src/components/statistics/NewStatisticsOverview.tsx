import AssessmentIcon from "@mui/icons-material/Assessment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import type { TeamStatsBase } from "../../types";

interface DatasetRecord {
  draws: number;
  losses: number;
  wins: number;
}

interface NewStatisticsOverviewProps {
  gamesCount: number;
  record: DatasetRecord;
  teamStats?: TeamStatsBase;
}

function formatPercentage(value?: number, total?: number) {
  if (value === undefined || total === 0) {
    return "-";
  }

  return `${Math.round(value * 100)}%`;
}

function KpiCard({
  accentColor,
  caption,
  icon,
  label,
  value,
}: {
  accentColor: string;
  caption?: string;
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
        p: 2,
      })}
    >
      <Stack spacing={1}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              color: accentColor,
              height: 36,
              width: 36,
            }}
          >
            {icon}
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
        </Stack>
        <Typography fontWeight={900} variant="h4">
          {value}
        </Typography>
        {caption && (
          <Typography color="text.secondary" variant="caption">
            {caption}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export default function NewStatisticsOverview({
  gamesCount,
  record,
  teamStats,
}: NewStatisticsOverviewProps) {
  const { t } = useTranslation(["statistics", "games"]);
  const theme = useTheme();

  return (
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 6, md: 2.4 }}>
        <KpiCard
          accentColor={theme.colors.newUi.primary}
          icon={<AssessmentIcon fontSize="small" />}
          label={t("statistics:teamStats.gamesCount")}
          value={gamesCount}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 2.4 }}>
        <KpiCard
          accentColor={theme.palette.success.main}
          caption={
            record.draws > 0
              ? t("games:status.drawWithCount", {
                  count: record.draws,
                  defaultValue: "{{count}} draw",
                })
              : undefined
          }
          icon={<EmojiEventsIcon fontSize="small" />}
          label={t("statistics:teamStats.winLossRatio")}
          value={`${record.wins}/${record.losses}`}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 2.4 }}>
        <KpiCard
          accentColor={theme.colors.newUi.primary}
          caption={`${teamStats?.offense.points_won ?? 0}/${teamStats?.offense.points_started ?? 0}`}
          icon={<FlashOnIcon fontSize="small" />}
          label={t("statistics:newUi.overview.holdRate")}
          value={formatPercentage(
            teamStats?.offense.hold_rate,
            teamStats?.offense.points_started
          )}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 2.4 }}>
        <KpiCard
          accentColor={theme.colors.newUi.primary}
          caption={`${teamStats?.defense.points_won ?? 0}/${teamStats?.defense.points_started ?? 0}`}
          icon={<ShieldIcon fontSize="small" />}
          label={t("statistics:newUi.overview.breakRate")}
          value={formatPercentage(
            teamStats?.defense.break_rate,
            teamStats?.defense.points_started
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 2.4 }}>
        <KpiCard
          accentColor={theme.colors.pull.main}
          caption={`${teamStats?.defense.points_with_turnover ?? 0}/${teamStats?.defense.points_started ?? 0}`}
          icon={<SwapHorizIcon fontSize="small" />}
          label={t("statistics:newUi.overview.turnRate")}
          value={formatPercentage(
            teamStats?.defense.turnover_rate,
            teamStats?.defense.points_started
          )}
        />
      </Grid>
    </Grid>
  );
}
