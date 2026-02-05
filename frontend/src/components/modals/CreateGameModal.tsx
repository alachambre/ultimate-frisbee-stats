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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Stack,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { createGame, getCompetitions, getCompetition } from "../../services";
import type { Player } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId?: number; // Optional: if provided, competition is pre-selected
}

export default function CreateGameModal({
  isOpen,
  onClose,
  competitionId,
}: CreateGameModalProps) {
  const { t } = useTranslation(["games", "players", "common"]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | "">("");
  const [opponentName, setOpponentName] = useState("");
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"men" | "women">("men");
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: () => getCompetitions(),
    enabled: !competitionId, // Only fetch if no competitionId provided
  });

  const finalCompetitionId = competitionId || selectedCompetitionId;
  const competitionIdNumber = finalCompetitionId ? Number(finalCompetitionId) : null;

  const { data: competition } = useQuery({
    queryKey: queryKeys.competition(competitionIdNumber ?? 0),
    queryFn: () => getCompetition(competitionIdNumber as number),
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
      setDate("");
      setComments("");
      setSelectedPlayerIds([]);
      setSearchQuery("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (finalCompetitionId && opponentName.trim()) {
      mutation.mutate({
        competition_id: Number(finalCompetitionId),
        opponent_name: opponentName.trim(),
        date: date || null,
        comments: comments.trim() || null,
        player_ids: selectedPlayerIds.length > 0 ? selectedPlayerIds : undefined,
      });
    }
  };

  const handleClose = () => {
    setSelectedCompetitionId("");
    setOpponentName("");
    setDate("");
    setComments("");
    setSelectedPlayerIds([]);
    setSearchQuery("");
    mutation.reset();
    onClose();
  };

  // Player selection logic
  const availablePlayers = useMemo(() => competition?.players || [], [competition?.players]);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return availablePlayers;
    const query = searchQuery.toLowerCase();
    return availablePlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.number && p.number.toString().includes(query))
    );
  }, [availablePlayers, searchQuery]);

  const menPlayers = filteredPlayers
    .filter((p) => p.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = filteredPlayers
    .filter((p) => p.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedMen = selectedPlayerIds.filter((id) =>
    menPlayers.some((p) => p.id === id)
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    womenPlayers.some((p) => p.id === id)
  ).length;

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlayerIds(filteredPlayers.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedPlayerIds([]);
  };

  const handleSelectAllMen = () => {
    const menIds = menPlayers.map((p) => p.id);
    setSelectedPlayerIds((prev) => [...new Set([...prev, ...menIds])]);
  };

  const handleSelectAllWomen = () => {
    const womenIds = womenPlayers.map((p) => p.id);
    setSelectedPlayerIds((prev) => [...new Set([...prev, ...womenIds])]);
  };

  const renderPlayerList = (players: Player[], title: string) => {
    if (players.length === 0) return null;

    return (
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
          {title} ({players.length})
        </Typography>
        <List disablePadding>
          {players.map((player) => (
            <ListItem key={player.id} disablePadding>
              <ListItemButton
                role={undefined}
                onClick={() => handleTogglePlayer(player.id)}
                dense
              >
                <Checkbox
                  edge="start"
                  checked={selectedPlayerIds.includes(player.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {player.name}
                      <Chip
                        label={player.gender === "M" ? "M" : "W"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          backgroundColor: (theme) =>
                            player.gender === "M"
                              ? `${theme.colors.men.main}20`
                              : `${theme.colors.women.main}20`,
                          color: (theme) =>
                            player.gender === "M"
                              ? theme.colors.men.main
                              : theme.colors.women.main,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    player.number !== null && player.number !== undefined
                      ? `#${player.number}`
                      : "No number"
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    );
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
                {competitions?.map((competition) => (
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
            label={t("games:form.date")}
            type="date"
            fullWidth
            variant="outlined"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
                        backgroundColor: (theme) => `${theme.colors.men.main}20`,
                        color: (theme) => theme.colors.men.main,
                      }}
                    />
                    <Chip
                      label={`${selectedWomen} ${t("common:labels.female")}`}
                      size="small"
                      sx={{
                        backgroundColor: (theme) => `${theme.colors.women.main}20`,
                        color: (theme) => theme.colors.women.main,
                      }}
                    />
                  </>
                )}
              </Box>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
              >
                <Tab
                  label={`${t("common:labels.male")} (${menPlayers.length})`}
                  value="men"
                  sx={{ textTransform: "none" }}
                />
                <Tab
                  label={`${t("common:labels.female")} (${womenPlayers.length})`}
                  value="women"
                  sx={{ textTransform: "none" }}
                />
              </Tabs>

              {/* Quick Actions */}
              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAll}
                  disabled={filteredPlayers.length === 0}
                >
                  {t("common:action.select")} All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearAll}
                  disabled={selectedPlayerIds.length === 0}
                >
                  {t("common:action.clear")} All
                </Button>
                {activeTab === "men" && menPlayers.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllMen}
                    sx={{
                      borderColor: (theme) => theme.colors.men.main,
                      color: (theme) => theme.colors.men.main,
                      "&:hover": {
                        borderColor: (theme) => theme.colors.men.main,
                        backgroundColor: (theme) => `${theme.colors.men.main}10`,
                      },
                    }}
                  >
                    All {t("common:labels.male")}
                  </Button>
                )}
                {activeTab === "women" && womenPlayers.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllWomen}
                    sx={{
                      borderColor: (theme) => theme.colors.women.main,
                      color: (theme) => theme.colors.women.main,
                      "&:hover": {
                        borderColor: (theme) => theme.colors.women.main,
                        backgroundColor: (theme) => `${theme.colors.women.main}10`,
                      },
                    }}
                  >
                    All {t("common:labels.female")}
                  </Button>
                )}
              </Stack>

              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder={`${t("common:action.search")}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Player List for Active Tab */}
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {activeTab === "men" && (
                  <>
                    {menPlayers.length === 0 ? (
                      <Box py={4} textAlign="center">
                        <Typography color="text.secondary">
                          {searchQuery
                            ? `${t("players:empty.noPlayers")}`
                            : t("players:empty.noPlayers")}
                        </Typography>
                      </Box>
                    ) : (
                      renderPlayerList(menPlayers, t("common:labels.male"))
                    )}
                  </>
                )}
                {activeTab === "women" && (
                  <>
                    {womenPlayers.length === 0 ? (
                      <Box py={4} textAlign="center">
                        <Typography color="text.secondary">
                          {searchQuery
                            ? `${t("players:empty.noPlayers")}`
                            : t("players:empty.noPlayers")}
                        </Typography>
                      </Box>
                    ) : (
                      renderPlayerList(womenPlayers, t("common:labels.female"))
                    )}
                  </>
                )}
              </Box>
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
