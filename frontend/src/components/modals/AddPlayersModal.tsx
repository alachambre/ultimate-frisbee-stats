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
  Stack,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import type { Player } from "../../types";

interface AddPlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentPlayerIds: number[];
  // Function to fetch available players
  fetchPlayers: () => Promise<Player[]>;
  // Function to add players (receives selected player IDs)
  addPlayers: (playerIds: number[]) => Promise<any>;
  // Query keys to invalidate after successful add
  invalidateQueries: string[][];
  // Optional: custom loading/empty messages
  loadingMessage?: string;
  emptyMessage?: string;
}

export default function AddPlayersModal({
  isOpen,
  onClose,
  title,
  currentPlayerIds,
  fetchPlayers,
  addPlayers,
  invalidateQueries,
  loadingMessage = "Loading players...",
  emptyMessage = "All players are already added",
}: AddPlayersModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"men" | "women">("men");
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ["available-players", isOpen],
    queryFn: fetchPlayers,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: () => addPlayers(selectedPlayerIds),
    onSuccess: () => {
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      handleClose();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerIds([]);
      setSearchQuery("");
      setActiveTab("men");
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
    setActiveTab("men");
    mutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length > 0) {
      mutation.mutate();
    }
  };

  // Filter out players already added
  const availablePlayers =
    players?.filter((p) => !currentPlayerIds.includes(p.id)) || [];

  // Filter by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return availablePlayers;
    const query = searchQuery.toLowerCase();
    return availablePlayers.filter(
      (p) =>
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

  const renderPlayerList = (players: Player[], genderLabel: string) => {
    if (players.length === 0) return null;

    return (
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
          {genderLabel} ({players.length})
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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Typography>{loadingMessage}</Typography>
        ) : availablePlayers.length === 0 ? (
          <Box py={4} textAlign="center">
            <Typography color="text.secondary">{emptyMessage}</Typography>
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
                    "&:hover": { borderColor: "#1565c0", backgroundColor: "#e3f2fd" },
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

            {/* Player List for Active Tab */}
            <Box sx={{ maxHeight: 400, overflow: "auto" }}>
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
          </>
        )}

        {mutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error adding players. Please try again.
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
