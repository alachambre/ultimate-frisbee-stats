import { useState, type FormEvent, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { createGame, getCompetitions, getCompetition } from "../../services";
import { getCompetitionPlayers } from "../../services/competitions";
import { queryKeys } from "../../utils/queryKeys";
import { dateTimeLocalInputValueToUtcIso } from "../../utils/dateTimeLocal";
import type { CompetitionWithTeam } from "../../types";
import PlayerSelectionList from "../shared/PlayerSelectionList";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId?: number; // Optional: if provided, competition is pre-selected
  competitionFilter?: (competition: CompetitionWithTeam) => boolean;
  teamId?: number;
}

export default function CreateGameModal({
  isOpen,
  onClose,
  competitionId,
  competitionFilter,
  teamId,
}: CreateGameModalProps) {
  const { t } = useTranslation(["games", "players", "common"]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | "">("");
  const [opponentName, setOpponentName] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [comments, setComments] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey:
      teamId === undefined
        ? queryKeys.competitions
        : queryKeys.competitionsByTeam(teamId),
    queryFn: () => getCompetitions(teamId),
    enabled: !competitionId, // Only fetch if no competitionId provided
  });
  const availableCompetitions = useMemo(
    () =>
      competitions?.filter((competition) =>
        competitionFilter ? competitionFilter(competition) : true
      ) ?? [],
    [competitionFilter, competitions]
  );

  const finalCompetitionId = competitionId || selectedCompetitionId;
  const competitionIdNumber = finalCompetitionId ? Number(finalCompetitionId) : null;

  const { data: competition } = useQuery({
    queryKey: queryKeys.competition(competitionIdNumber ?? 0),
    queryFn: () => getCompetition(competitionIdNumber as number),
    enabled: competitionIdNumber !== null && !Number.isNaN(competitionIdNumber),
  });

  const { data: competitionPlayers = [] } = useQuery({
    queryKey: queryKeys.competitionPlayers(competitionIdNumber ?? 0),
    queryFn: () => getCompetitionPlayers(competitionIdNumber as number),
    enabled: competitionIdNumber !== null && !Number.isNaN(competitionIdNumber),
  });

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      if (finalCompetitionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.competitionGames(Number(finalCompetitionId)),
        });
      }
      setSelectedCompetitionId("");
      setOpponentName("");
      setDateTime("");
      setComments("");
      setSelectedPlayerIds([]);
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (finalCompetitionId && opponentName.trim()) {
      mutation.mutate({
        competition_id: Number(finalCompetitionId),
        opponent_name: opponentName.trim(),
        date: dateTimeLocalInputValueToUtcIso(dateTime),
        comments: comments.trim() || null,
        player_ids: selectedPlayerIds.length > 0 ? selectedPlayerIds : undefined,
      });
    }
  };

  const handleClose = () => {
    setSelectedCompetitionId("");
    setOpponentName("");
    setDateTime("");
    setComments("");
    setSelectedPlayerIds([]);
    mutation.reset();
    onClose();
  };

  // Player selection logic
  const availablePlayers = useMemo(
    () => competitionPlayers || [],
    [competitionPlayers]
  );

  const selectedMen = selectedPlayerIds.filter((id) =>
    availablePlayers.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    availablePlayers.some((p) => p.id === id && p.gender === "W")
  ).length;

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlayerIds(availablePlayers.map((player) => player.id));
  };

  const handleClearAll = () => {
    setSelectedPlayerIds([]);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("games:modal.create.title")}</DialogTitle>
        <DialogContent>
          {!competitionId && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="competition-label">{t("games:form.competition")}</InputLabel>
              <Select
                labelId="competition-label"
                id="competition-select"
                value={selectedCompetitionId}
                onChange={(e) => setSelectedCompetitionId(e.target.value as number)}
                label={t("games:form.competition")}
              >
                {availableCompetitions.map((competition) => (
                  <MenuItem key={competition.id} value={competition.id}>
                    {competition.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            margin="dense"
            label={t("games:form.opponent")}
            type="text"
            fullWidth
            variant="outlined"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder={t("games:form.opponentPlaceholder")}
            inputProps={{ maxLength: 100 }}
            required
          />

          <TextField
            margin="dense"
            label={t("games:form.dateTime")}
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            margin="dense"
            label={`${t("common:labels.comments")} (${t("common:labels.optional")})`}
            type="text"
            fullWidth
            variant="outlined"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={`${t("common:action.add")} ${t("common:labels.comments")}`}
            multiline
            rows={3}
          />

          {/* Player Selection */}
          {competition && availablePlayers.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                {t("common:action.select")} Players ({t("common:labels.optional")})
              </Typography>

              {/* Selection Counter */}
              <Box mb={2} display="flex" gap={1} justifyContent="center">
                <Chip
                  label={`${selectedPlayerIds.length} ${t("common:action.select").toLowerCase()}ed`}
                  color="primary"
                  variant="outlined"
                />
                {selectedPlayerIds.length > 0 && (
                  <>
                    <Chip
                      label={`${selectedMen} ${t("common:labels.male")}`}
                      size="small"
                      sx={{
                        backgroundColor: (theme) => alpha(theme.colors.men.main, 0.12),
                        color: (theme) => theme.colors.men.main,
                      }}
                    />
                    <Chip
                      label={`${selectedWomen} ${t("common:labels.female")}`}
                      size="small"
                      sx={{
                        backgroundColor: (theme) => alpha(theme.colors.women.main, 0.12),
                        color: (theme) => theme.colors.women.main,
                      }}
                    />
                  </>
                )}
              </Box>

              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAll}
                  disabled={availablePlayers.length === 0}
                >
                  {t("common:action.select")} {t("common:allPlayers")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearAll}
                  disabled={selectedPlayerIds.length === 0}
                >
                  {t("common:labels.clearAll")}
                </Button>
              </Stack>

              <PlayerSelectionList
                players={availablePlayers}
                selectedIds={selectedPlayerIds}
                onToggle={handleTogglePlayer}
                menLabel={t("common:labels.men")}
                womenLabel={t("common:labels.women")}
                emptyMenLabel={t("players:empty.noPlayers")}
                emptyWomenLabel={t("players:empty.noPlayers")}
                renderSecondary={(player) =>
                  player.number !== null && player.number !== undefined
                    ? `#${player.number}`
                    : t("common:labels.noNumber")
                }
              />
            </Box>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !finalCompetitionId || !opponentName.trim()}
          >
            {mutation.isPending ? `${t("games:modal.create.submit")}...` : t("games:modal.create.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
