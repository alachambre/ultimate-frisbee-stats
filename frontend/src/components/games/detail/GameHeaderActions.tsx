import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface GameHeaderActionsProps {
  competitionPath: string;
  teamName: string;
  opponentName: string;
  canViewStatistics: boolean;
  onViewStatistics: () => void;
  onOpenRoster: () => void;
  onOpenEdit: () => void;
  onStart: () => void;
  onOpenFinish: () => void;
  onOpenDelete: () => void;
  isStartPending: boolean;
  gameStatus: "ready" | "started" | "ended";
}

export function GameHeaderActions({
  competitionPath,
  teamName,
  opponentName,
  canViewStatistics,
  onViewStatistics,
  onOpenRoster,
  onOpenEdit,
  onStart,
  onOpenFinish,
  onOpenDelete,
  isStartPending,
  gameStatus,
}: GameHeaderActionsProps) {
  const { t } = useTranslation(["games", "common"]);

  return (
    <Box mb={2}>
      <Button component={Link} to={competitionPath} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        {t("common:action.back")}
      </Button>
      <Box textAlign="center">
        <Typography variant="h4" fontWeight="bold" mb={2}>
          {teamName} vs {opponentName}
        </Typography>
        <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={onOpenRoster}
            sx={{
              minWidth: { xs: "auto", sm: "auto" },
              "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("games:detail.roster")}
            </Box>
          </Button>

          <Button
            variant="outlined"
            startIcon={<BarChartIcon />}
            onClick={onViewStatistics}
            disabled={!canViewStatistics}
            sx={{
              minWidth: { xs: "auto", sm: "auto" },
              "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("games:detail.viewStatistics")}
            </Box>
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onOpenEdit}
            sx={{
              minWidth: { xs: "auto", sm: "auto" },
              "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("common:action.edit")}
            </Box>
          </Button>

          {gameStatus === "ready" && (
            <Button
              variant="contained"
              color="primary"
              onClick={onStart}
              disabled={isStartPending}
              sx={{ minWidth: { xs: "auto", sm: "auto" } }}
            >
              <Box component="span">
                {isStartPending ? t("common:action.loading") : t("games:detail.startGame")}
              </Box>
            </Button>
          )}

          {gameStatus === "started" && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={onOpenFinish}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("games:detail.endGame")}
              </Box>
            </Button>
          )}

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onOpenDelete}
            sx={{
              minWidth: { xs: "auto", sm: "auto" },
              "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("common:action.delete")}
            </Box>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
