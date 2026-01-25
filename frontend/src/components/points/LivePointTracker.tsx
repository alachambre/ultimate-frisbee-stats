import { useState, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  ButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CommentIcon from "@mui/icons-material/Comment";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import PointTimer from "./PointTimer";
import StartPointDialog from "../modals/StartPointDialog";
import FinishPointDialog from "../modals/FinishPointDialog";
import CompletePointDialog from "../modals/CompletePointDialog";
import AddCommentDialog from "../modals/AddCommentDialog";
import type { GameDetail, PointWithPlayers, Player } from "../../types";

interface LivePointTrackerProps {
  game: GameDetail;
  activePoint: PointWithPlayers | null;
  players: Player[];
  teamId: number;
  onPointUpdated?: () => void;
}

export default function LivePointTracker({
  game,
  activePoint,
  players,
  teamId,
  onPointUpdated,
}: LivePointTrackerProps) {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Find scored points (most recent scored point)
  const scoredPoint = useMemo(() => {
    return game.points
      .filter((p) => p.status === "scored")
      .sort((a, b) => b.point_number - a.point_number)[0];
  }, [game.points]);

  // The "active" point is either running or scored
  const currentPoint = activePoint || scoredPoint;

  // Mutation to update pull status
  const updatePullMutation = useMutation({
    mutationFn: (pull: boolean) => {
      if (!activePoint) throw new Error("No active point");
      return updatePoint(activePoint.id, { pull });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(game.id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", game.id] });
      onPointUpdated?.();
    },
  });

  // Mutation to restart a scored point (cancel the score)
  const restartPointMutation = useMutation({
    mutationFn: () => {
      if (!scoredPoint) throw new Error("No scored point");
      return updatePoint(scoredPoint.id, {
        status: "running",
        won: null,
        end_datetime: null,
      });
    },
    onSuccess: async (updatedPoint) => {
      // Optimistically update both caches immediately to avoid UI flicker

      // 1. Update runningPoint cache
      queryClient.setQueryData(["runningPoint", game.id], updatedPoint);

      // 2. Update game cache - replace the scored point with the running point
      queryClient.setQueryData(["game", String(game.id)], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          points: oldData.points.map((p: any) =>
            p.id === updatedPoint.id ? updatedPoint : p
          ),
        };
      });

      // 3. No need to invalidate - cache is already up to date
      onPointUpdated?.();
    },
  });

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

        {!currentPoint ? (
          // No active or scored point - show start button
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
          // Active or scored point - show appropriate button
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Point #{currentPoint.point_number} -{" "}
                  {currentPoint.status === "running" ? "Running" : "Scored"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={
                      currentPoint.starting_on_offense
                        ? "Started on Offense"
                        : "Started on Defense"
                    }
                    size="small"
                    color={currentPoint.starting_on_offense ? "primary" : "default"}
                  />
                  {currentPoint.status === "scored" && (
                    <Chip
                      label={currentPoint.won ? "Won" : "Lost"}
                      size="small"
                      color={currentPoint.won ? "success" : "error"}
                    />
                  )}
                </Box>
              </Box>
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentPoint.status === "running" ? "Elapsed Time" : "Duration"}
                </Typography>
                {currentPoint.start_datetime && (
                  <PointTimer
                    key={`${currentPoint.id}-${currentPoint.status}`}
                    startDatetime={currentPoint.start_datetime}
                    endDatetime={currentPoint.status === "scored" ? currentPoint.end_datetime || undefined : undefined}
                  />
                )}
              </Box>
            </Box>

            {/* Pull tracking - only for running defensive points */}
            {activePoint &&
             activePoint.status === "running" &&
             !activePoint.starting_on_offense &&
             activePoint.pull === null && (
              <Box mt={2} textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Did the pull land inbound?
                </Typography>
                <ButtonGroup variant="outlined" disabled={updatePullMutation.isPending}>
                  <Button
                    startIcon={<CheckIcon />}
                    onClick={() => updatePullMutation.mutate(true)}
                    color="success"
                  >
                    Inbound
                  </Button>
                  <Button
                    startIcon={<CloseIcon />}
                    onClick={() => updatePullMutation.mutate(false)}
                    color="error"
                  >
                    Out of Bounds
                  </Button>
                </ButtonGroup>
              </Box>
            )}

            {/* Comment button */}
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                variant="outlined"
                startIcon={<CommentIcon />}
                onClick={() => setIsCommentDialogOpen(true)}
                size="medium"
              >
                {currentPoint.comments ? "Edit Comment" : "Add Comment"}
              </Button>
            </Box>

            <Box display="flex" justifyContent="center" gap={2} mt={3} flexWrap="wrap">
              {currentPoint.status === "running" ? (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => setIsFinishDialogOpen(true)}
                  size="large"
                >
                  Finish Point
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={() => restartPointMutation.mutate()}
                    disabled={restartPointMutation.isPending}
                    size="large"
                  >
                    {restartPointMutation.isPending ? "Resuming..." : "Resume Point"}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DoneAllIcon />}
                    onClick={() => setIsCompleteDialogOpen(true)}
                    size="large"
                  >
                    Complete Point
                  </Button>
                </>
              )}
            </Box>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Players on field: {currentPoint.players.length}
              </Typography>
              {/* Show pull status if marked */}
              {activePoint && !activePoint.starting_on_offense && activePoint.pull !== null && (
                <Typography variant="body2" color="text.secondary">
                  Pull: <strong>{activePoint.pull ? "Inbound" : "Out of Bounds"}</strong>
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <StartPointDialog
        open={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        gameId={game.id}
        teamId={teamId}
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

      {scoredPoint && (
        <CompletePointDialog
          open={isCompleteDialogOpen}
          onClose={() => setIsCompleteDialogOpen(false)}
          scoredPoint={scoredPoint}
          onSuccess={onPointUpdated}
        />
      )}

      {currentPoint && (
        <AddCommentDialog
          open={isCommentDialogOpen}
          onClose={() => setIsCommentDialogOpen(false)}
          point={currentPoint}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}
    </>
  );
}
