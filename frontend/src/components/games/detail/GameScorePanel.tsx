import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CommentIcon from "@mui/icons-material/Comment";
import type { ReactNode } from "react";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import GameTimer from "../GameTimer";
import { formatDateTime } from "../../../utils/dateFormatting";

interface GameScorePanelProps {
  teamName: string;
  opponentName: string;
  ourScore: number;
  opponentScore: number;
  scheduledAt?: string | null;
  startDatetime?: string | null;
  endDatetime?: string | null;
  comments?: string | null;
  children?: ReactNode;
}

export function GameScorePanel({
  teamName,
  opponentName,
  ourScore,
  opponentScore,
  scheduledAt,
  startDatetime,
  endDatetime,
  comments,
  children,
}: GameScorePanelProps) {
  const { t, i18n } = useTranslation(["games"]);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box p={4} textAlign="center">
        <Box display="flex" justifyContent="center" gap={4}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {teamName}
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {ourScore}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {opponentName}
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {opponentScore}
            </Typography>
          </Box>
        </Box>

        {scheduledAt && (
          <Box mt={3}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(scheduledAt, i18n.resolvedLanguage)}
              </Typography>
            </Box>
          </Box>
        )}

        {startDatetime && (
          <Box mt={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("games:detail.gameDuration")}
            </Typography>
            <GameTimer startDatetime={startDatetime} endDatetime={endDatetime ?? undefined} />
          </Box>
        )}

        {comments && (
          <Box mt={3}>
            <Box
              sx={{
                p: 2,
                bgcolor: "action.hover",
                borderRadius: 1,
                borderLeft: 3,
                borderColor: "primary.main",
                textAlign: "left",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <CommentIcon fontSize="small" sx={{ color: "primary.main" }} />
                <Typography variant="body2" fontWeight="medium" sx={{ color: "primary.main" }}>
                  {t("games:detail.comments")}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {comments}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {children && (
        <>
          <Divider />
          {children}
        </>
      )}
    </Paper>
  );
}
