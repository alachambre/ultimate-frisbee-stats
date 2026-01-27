import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import type { Player } from "../../types";

interface PlayerSelectionUIProps {
  players: Player[];
  selectedIds: number[];
  onToggle: (playerId: number) => void;
  onSelectAllMen: () => void;
  onSelectAllWomen: () => void;
  onClearAll: () => void;
  showCount?: boolean;
}

export default function PlayerSelectionUI({
  players,
  selectedIds,
  onToggle,
  onSelectAllMen,
  onSelectAllWomen,
  onClearAll,
  showCount = true,
}: PlayerSelectionUIProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"men" | "women">("men");

  // Filter by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.number && p.number.toString().includes(query))
    );
  }, [players, searchQuery]);

  // Group by gender and sort by name
  const menPlayers = filteredPlayers
    .filter((p) => p.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = filteredPlayers
    .filter((p) => p.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count selected by gender
  const selectedMen = selectedIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "W")
  ).length;

  const renderPlayerList = (playersList: Player[], genderLabel: string) => {
    if (playersList.length === 0) return null;

    return (
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
          {genderLabel} ({playersList.length})
        </Typography>
        <List disablePadding>
          {playersList.map((player) => (
            <ListItem key={player.id} disablePadding>
              <ListItemButton
                role={undefined}
                onClick={() => onToggle(player.id)}
                dense
              >
                <Checkbox
                  edge="start"
                  checked={selectedIds.includes(player.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {player.name}
                      {player.gender === "M" ? (
                        <MaleIcon
                          sx={{
                            fontSize: 18,
                            color: "primary.main",
                          }}
                        />
                      ) : (
                        <FemaleIcon
                          sx={{
                            fontSize: 18,
                            color: "secondary.main",
                          }}
                        />
                      )}
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
    <Box>
      {/* Selection Counter */}
      {showCount && (
        <Box mb={2} display="flex" gap={1} justifyContent="center">
          <Chip
            label={`${selectedIds.length} selected`}
            color="primary"
            variant="outlined"
          />
          {selectedIds.length > 0 && (
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
      )}

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
          onClick={onClearAll}
          disabled={selectedIds.length === 0}
        >
          Clear All
        </Button>
        {activeTab === "men" && menPlayers.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={onSelectAllMen}
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
            onClick={onSelectAllWomen}
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
    </Box>
  );
}
