import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
}

export default function PlayerSelectionUI({
  players,
  selectedIds,
  onToggle,
  onSelectAllMen,
  onSelectAllWomen,
  onClearAll,
}: PlayerSelectionUIProps) {
  const { t } = useTranslation("common");
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
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab
          label={`${t("common:labels.men")} (${menPlayers.length})`}
          value="men"
          sx={{ textTransform: "none" }}
        />
        <Tab
          label={`${t("common:labels.women")} (${womenPlayers.length})`}
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
          {t("common:labels.clearAll")}
        </Button>
        {activeTab === "men" && menPlayers.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={onSelectAllMen}
            sx={{
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                backgroundColor: "primary.main",
                color: "white",
                borderColor: "primary.main",
              },
            }}
          >
            {t("common:labels.allMen")}
          </Button>
        )}
        {activeTab === "women" && womenPlayers.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={onSelectAllWomen}
            sx={{
              borderColor: "secondary.main",
              color: "secondary.main",
              "&:hover": {
                backgroundColor: "secondary.main",
                color: "white",
                borderColor: "secondary.main",
              },
            }}
          >
            {t("common:labels.allWomen")}
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
