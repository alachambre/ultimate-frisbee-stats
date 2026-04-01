import { Box, Chip, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import PointTimer from "../PointTimer";
import { LivePointMixityIndicator } from "./LivePointMixityIndicator";
import type { PointWithPlayers } from "../../../types";
import type { GenderRatio } from "../../../utils/playerComposition";

interface LivePointHeaderProps {
  currentPoint: PointWithPlayers;
  expectedGenderRatio: GenderRatio | null;
}

export function LivePointHeader({ currentPoint, expectedGenderRatio }: LivePointHeaderProps) {
  const { t } = useTranslation(["points"]);
  const theme = useTheme();

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t("points:history.point")} #{currentPoint.point_number} -{" "}
          {currentPoint.status === "ready"
            ? t("points:status.ready", "Ready")
            : currentPoint.status === "running"
              ? t("points:status.running")
              : t("points:status.scored")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={
              currentPoint.starting_on_offense
                ? t("points:tracker.offense")
                : t("points:tracker.defense")
            }
            size="small"
            sx={(innerTheme) =>
              currentPoint.starting_on_offense
                ? {}
                : {
                    bgcolor: innerTheme.colors.defense.main,
                    color: innerTheme.palette.common.white,
                    "& .MuiChip-label": {
                      color: innerTheme.palette.common.white,
                    },
                  }
            }
            color={currentPoint.starting_on_offense ? "primary" : undefined}
          />
          <LivePointMixityIndicator requiredGenderRatio={expectedGenderRatio} />
          {currentPoint.status === "scored" && (
            <Chip
              label={
                currentPoint.won
                  ? t("points:dialog.finish.weScored")
                  : t("points:dialog.finish.theyScored")
              }
              size="small"
              color={currentPoint.won ? "success" : "error"}
            />
          )}
        </Box>
      </Box>
      {currentPoint.start_datetime && (
        <Box textAlign="center">
          <Typography
            variant="body2"
            gutterBottom
            sx={{
              color: currentPoint.starting_on_offense
                ? theme.colors.offense.main
                : theme.colors.defense.main,
              fontWeight: "medium",
            }}
          >
            {currentPoint.status === "running"
              ? t("points:tracker.elapsedTime", "Elapsed Time")
              : t("points:tracker.duration", "Duration")}
          </Typography>
          <PointTimer
            key={`${currentPoint.id}-${currentPoint.status}`}
            startDatetime={currentPoint.start_datetime}
            endDatetime={
              currentPoint.status === "scored" ? currentPoint.end_datetime || undefined : undefined
            }
            color={
              currentPoint.starting_on_offense
                ? theme.colors.offense.main
                : theme.colors.defense.main
            }
          />
        </Box>
      )}
    </Box>
  );
}
