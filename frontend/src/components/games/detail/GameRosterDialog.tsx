import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Player, PlayerGameStats } from "../../../types";
import PlayerSelectionList from "../../shared/PlayerSelectionList";

interface GameRosterDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenAddPlayers?: () => void;
  canManageRoster?: boolean;
  disabled: boolean;
  players: Player[];
  liveStatsByPlayerId: Map<number, PlayerGameStats>;
  getHighlight: (playerId: number) => "high" | "low" | null;
}

export function GameRosterDialog({
  open,
  onClose,
  onOpenAddPlayers,
  canManageRoster = true,
  disabled,
  players,
  liveStatsByPlayerId,
  getHighlight,
}: GameRosterDialogProps) {
  const { t } = useTranslation(["games", "players", "common"]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={false}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t("games:detail.roster")}</Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label={t("common:ariaLabel.close")}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {canManageRoster && onOpenAddPlayers && (
          <Box mb={3} display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={onOpenAddPlayers}
              disabled={disabled}
              sx={{
                width: { xs: "100%", sm: "auto" },
                "& .MuiButton-startIcon": { margin: "0 8px 0 -4px" },
              }}
            >
              {t("games:detail.addPlayers")}
            </Button>
          </Box>
        )}
        <PlayerSelectionList
          players={players}
          selectedIds={[]}
          onToggle={() => {}}
          menLabel={t("games:detail.men")}
          womenLabel={t("games:detail.women")}
          emptyMenLabel={t("players:empty.noPlayers")}
          emptyWomenLabel={t("players:empty.noPlayers")}
          getHighlight={getHighlight}
          highlightSecondary={false}
          preserveOrder
          renderPrimary={(player) => {
            const stats = liveStatsByPlayerId.get(player.id);
            if (!stats) {
              return player.name;
            }
            return `${player.name} - ${stats.points_played} pts`;
          }}
          renderSecondary={(player) => {
            const stats = liveStatsByPlayerId.get(player.id);
            if (!stats) {
              return "";
            }
            return `${Math.floor(stats.effective_time_seconds / 60)} min`;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
