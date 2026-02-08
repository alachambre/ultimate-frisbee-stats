import CommentIcon from "@mui/icons-material/Comment";
import { Box, Divider, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import GameTimer from "../GameTimer";

interface GameScorePanelProps {
  teamName: string;
  opponentName: string;
  ourScore: number;
  opponentScore: number;
  startDatetime?: string | null;
  endDatetime?: string | null;
  comments?: string | null;
}

export function GameScorePanel({
  teamName,
  opponentName,
  ourScore,
  opponentScore,
  startDatetime,
  endDatetime,
  comments,
}: GameScorePanelProps) {
  const { t } = useTranslation(["games"]);

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
    </Paper>
  );
}
