import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { addPlayersToRoster, getTeamPlayers } from "../../services";
import type { Player } from "../../types";

interface AddPlayersToRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: number;
  teamId: number;
  currentRosterIds: number[];
}

export default function AddPlayersToRosterModal({
  isOpen,
  onClose,
  competitionId,
  teamId,
  currentRosterIds,
}: AddPlayersToRosterModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: teamPlayers, isLoading } = useQuery({
    queryKey: ["team-players", teamId],
    queryFn: () => getTeamPlayers(teamId),
    enabled: isOpen && !!teamId,
  });

  const mutation = useMutation({
    mutationFn: () => addPlayersToRoster(competitionId, selectedPlayerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["competition", String(competitionId)],
      });
      handleClose();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerIds([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleToggle = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setSearchQuery("");
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length > 0) {
      mutation.mutate();
    }
  };

  // Filter out players already in the roster
  const availablePlayers =
    teamPlayers?.filter((p) => !currentRosterIds.includes(p.id)) || [];

  // Filter by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return availablePlayers;
    const query = searchQuery.toLowerCase();
    return availablePlayers.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.number && p.number.toString().includes(query))
    );
  }, [availablePlayers, searchQuery]);

  // Group by gender and sort by name
  const menPlayers = filteredPlayers
    .filter((p) => p.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = filteredPlayers
    .filter((p) => p.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count selected by gender
  const selectedMen = selectedPlayerIds.filter((id) =>
    menPlayers.some((p) => p.id === id)
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    womenPlayers.some((p) => p.id === id)
  ).length;

  // Quick select handlers
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
                onClick={() => handleToggle(player.id)}
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
                          backgroundColor: player.gender === "M" ? "#e3f2fd" : "#fce4ec",
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
      <DialogTitle>Add Players to Roster</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography>Loading players...</Typography>
        ) : availablePlayers.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">
              All team players are already in the roster
            </Typography>
          </Box>
        ) : (
          <>
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
              {menPlayers.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAllMen}
                  sx={{
                    borderColor: "#1976d2",
                    color: "#1976d2",
                    "&:hover": { borderColor: "#1565c0", backgroundColor: "#e3f2fd" },
                  }}
                >
                  All Men
                </Button>
              )}
              {womenPlayers.length > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSelectAllWomen}
                  sx={{
                    borderColor: "#c2185b",
                    color: "#c2185b",
                    "&:hover": { borderColor: "#ad1457", backgroundColor: "#fce4ec" },
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

            {/* Player Lists by Gender */}
            <Box sx={{ maxHeight: 400, overflow: "auto" }}>
              {filteredPlayers.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">
                    No players found matching "{searchQuery}"
                  </Typography>
                </Box>
              ) : (
                <>
                  {renderPlayerList(menPlayers, "Men")}
                  {menPlayers.length > 0 && womenPlayers.length > 0 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                  {renderPlayerList(womenPlayers, "Women")}
                </>
              )}
            </Box>
          </>
        )}

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error adding players to roster. Please try again.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            mutation.isPending ||
            selectedPlayerIds.length === 0 ||
            availablePlayers.length === 0
          }
        >
          {mutation.isPending
            ? "Adding..."
            : `Add ${selectedPlayerIds.length} Player${selectedPlayerIds.length !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
