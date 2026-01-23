import { useState, type FormEvent, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | "">("");
  const [opponentName, setOpponentName] = useState("");
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"men" | "women">("men");
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
    enabled: !competitionId, // Only fetch if no competitionId provided
  });

  const finalCompetitionId = competitionId || selectedCompetitionId;

  const { data: competition } = useQuery({
    queryKey: ["competition", finalCompetitionId],
    queryFn: () => getCompetition(Number(finalCompetitionId)),
    enabled: !!finalCompetitionId,
  });

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["competition-games"] });
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
  const availablePlayers = competition?.players || [];

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
                          backgroundColor:
                            player.gender === "M" ? "#e3f2fd" : "#fce4ec",
                          color: player.gender === "M" ? "#1976d2" : "#c2185b",
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
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          {!competitionId && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="competition-label">Competition</InputLabel>
              <Select
                labelId="competition-label"
                id="competition-select"
                value={selectedCompetitionId}
                onChange={(e) => setSelectedCompetitionId(e.target.value as number)}
                label="Competition"
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
            label="Opponent Name"
            type="text"
            fullWidth
            variant="outlined"
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Enter opponent name"
            inputProps={{ maxLength: 100 }}
            required
          />

          <TextField
            margin="dense"
            label="Date"
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
            label="Comments (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any comments about this game"
            multiline
            rows={3}
          />

          {/* Player Selection */}
          {competition && availablePlayers.length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Select Players (Optional)
              </Typography>

              {/* Selection Counter */}
              <Box mb={2} display="flex" gap={1} justifyContent="center">
                <Chip
                  label={`${selectedPlayerIds.length} selected`}
                  color="primary"
                  variant="outlined"
                />
                {selectedPlayerIds.length > 0 && (
                  <>
                    <Chip
                      label={`${selectedMen} Men`}
                      size="small"
                      sx={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                      }}
                    />
                    <Chip
                      label={`${selectedWomen} Women`}
                      size="small"
                      sx={{
                        backgroundColor: "#fce4ec",
                        color: "#c2185b",
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
                  label={`Men (${menPlayers.length})`}
                  value="men"
                  sx={{ textTransform: "none" }}
                />
                <Tab
                  label={`Women (${womenPlayers.length})`}
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
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearAll}
                  disabled={selectedPlayerIds.length === 0}
                >
                  Clear All
                </Button>
                {activeTab === "men" && menPlayers.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllMen}
                    sx={{
                      borderColor: "#1976d2",
                      color: "#1976d2",
                      "&:hover": {
                        borderColor: "#1565c0",
                        backgroundColor: "#e3f2fd",
                      },
                    }}
                  >
                    All Men
                  </Button>
                )}
                {activeTab === "women" && womenPlayers.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllWomen}
                    sx={{
                      borderColor: "#c2185b",
                      color: "#c2185b",
                      "&:hover": {
                        borderColor: "#ad1457",
                        backgroundColor: "#fce4ec",
                      },
                    }}
                  >
                    All Women
                  </Button>
                )}
              </Stack>

              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or number..."
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
                            ? `No men found matching "${searchQuery}"`
                            : "No male players available"}
                        </Typography>
                      </Box>
                    ) : (
                      renderPlayerList(menPlayers, "Men")
                    )}
                  </>
                )}
                {activeTab === "women" && (
                  <>
                    {womenPlayers.length === 0 ? (
                      <Box py={4} textAlign="center">
                        <Typography color="text.secondary">
                          {searchQuery
                            ? `No women found matching "${searchQuery}"`
                            : "No female players available"}
                        </Typography>
                      </Box>
                    ) : (
                      renderPlayerList(womenPlayers, "Women")
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error creating game. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !finalCompetitionId || !opponentName.trim()}
          >
            {mutation.isPending ? "Creating..." : "Create Game"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
