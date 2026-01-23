import { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PointTimer from "./PointTimer";
import StartPointDialog from "../modals/StartPointDialog";
import FinishPointDialog from "../modals/FinishPointDialog";
import type { GameDetail, PointWithPlayers, Player } from "../../types";

interface LivePointTrackerProps {
  game: GameDetail;
  activePoint: PointWithPlayers | null;
  players: Player[];
  onPointUpdated?: () => void;
}

export default function LivePointTracker({
  game,
  activePoint,
  players,
  onPointUpdated,
}: LivePointTrackerProps) {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);

  // Only show live tracker for started games (hide for ready and ended)
  if (game.status !== "started") {
    return null;
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Live Point Tracking
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {!activePoint ? (
          // No active point - show start button
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No active point. Start tracking a new point.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsStartDialogOpen(true)}
              size="large"
            >
              Start Point
            </Button>
          </Box>
        ) : (
          // Active point - show timer and finish button
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Point #{activePoint.point_number} - Active
                </Typography>
                <Chip
                  label={
                    activePoint.starting_on_offense
                      ? "Started on Offense"
                      : "Started on Defense"
                  }
                  size="small"
                  color={activePoint.starting_on_offense ? "primary" : "default"}
                />
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Elapsed Time
                </Typography>
                {activePoint.start_datetime && (
                  <PointTimer startDatetime={activePoint.start_datetime} />
                )}
              </Box>
            </Box>

            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setIsFinishDialogOpen(true)}
                size="large"
              >
                Finish Point
              </Button>
            </Box>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Players on field: {activePoint.players.length}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <StartPointDialog
        open={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        gameId={game.id}
        players={players}
        onSuccess={onPointUpdated}
      />

      {activePoint && (
        <FinishPointDialog
          open={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          activePoint={activePoint}
          onSuccess={onPointUpdated}
        />
      )}
    </>
  );
}
