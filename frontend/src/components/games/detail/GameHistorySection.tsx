import { Alert, Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Halftime, PointWithPlayers } from "../../../types";
import PointHistoryList from "../../points/PointHistoryList";

interface GameHistorySectionProps {
  points: PointWithPlayers[];
  halftime?: Halftime | null;
  gameEndedAt?: string | null;
  onEditPoint?: (point: PointWithPlayers) => void;
  onDeletePoint?: (point: PointWithPlayers) => void;
  onDeleteHalftime?: (halftime: Halftime) => void;
  isDeletingHalftime: boolean;
  hasDeleteHalftimeError: boolean;
}

export function GameHistorySection({
  points,
  halftime,
  gameEndedAt,
  onEditPoint,
  onDeletePoint,
  onDeleteHalftime,
  isDeletingHalftime,
  hasDeleteHalftimeError,
}: GameHistorySectionProps) {
  const { t } = useTranslation(["games"]);

  return (
    <Paper>
      <Box p={3} borderBottom="1px solid" borderColor="divider">
        <Typography variant="h6">
          {t("games:detail.points")} ({points.length})
        </Typography>
      </Box>

      <Box p={3}>
        <PointHistoryList
          points={points}
          halftime={halftime}
          gameEndedAt={gameEndedAt}
          onEditPoint={onEditPoint}
          onDeletePoint={onDeletePoint}
          onDeleteHalftime={onDeleteHalftime}
          isDeletingHalftime={isDeletingHalftime}
        />
        {Boolean(onDeleteHalftime) && hasDeleteHalftimeError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t("games:detail.deleteHalftimeError", "Error deleting halftime. Please try again.")}
          </Alert>
        )}
      </Box>
    </Paper>
  );
}
