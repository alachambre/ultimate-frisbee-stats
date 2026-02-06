import { useMemo, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Switch,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import type { ReactNode } from "react";
import type { Player } from "../../types";

type GenderTab = "men" | "women";

interface PlayerSelectionListProps {
  players: Player[];
  selectedIds: number[];
  onToggle: (playerId: number) => void;
  menLabel?: string;
  womenLabel?: string;
  emptyMenLabel?: string;
  emptyWomenLabel?: string;
  renderPrimary?: (player: Player) => ReactNode;
  renderSecondary?: (player: Player) => ReactNode;
  getHighlight?: (playerId: number) => "high" | "low" | null;
  showOnlySelectedToggle?: boolean;
  onlySelected?: boolean;
  onOnlySelectedChange?: (value: boolean) => void;
  activeTab?: GenderTab;
  onActiveTabChange?: (value: GenderTab) => void;
}

export default function PlayerSelectionList({
  players,
  selectedIds,
  onToggle,
  menLabel,
  womenLabel,
  emptyMenLabel,
  emptyWomenLabel,
  renderPrimary,
  renderSecondary,
  getHighlight,
  showOnlySelectedToggle = false,
  onlySelected = false,
  onOnlySelectedChange,
  activeTab,
  onActiveTabChange,
}: PlayerSelectionListProps) {
  const { t } = useTranslation("common");
  const theme = useTheme();
  const [internalTab, setInternalTab] = useState<GenderTab>("men");

  const resolvedActiveTab = activeTab ?? internalTab;

  const handleTabChange = (_: SyntheticEvent, newValue: GenderTab) => {
    if (onActiveTabChange) {
      onActiveTabChange(newValue);
    } else {
      setInternalTab(newValue);
    }
  };

  const visiblePlayers = useMemo(() => {
    if (!onlySelected) return players;
    const selectedSet = new Set(selectedIds);
    return players.filter((player) => selectedSet.has(player.id));
  }, [onlySelected, players, selectedIds]);

  const menPlayers = useMemo(
    () =>
      visiblePlayers
        .filter((player) => player.gender === "M")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [visiblePlayers]
  );
  const womenPlayers = useMemo(
    () =>
      visiblePlayers
        .filter((player) => player.gender === "W")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [visiblePlayers]
  );

  const resolvedMenLabel = menLabel || t("labels.men");
  const resolvedWomenLabel = womenLabel || t("labels.women");
  const resolvedEmptyMenLabel = emptyMenLabel || t("messages.noData");
  const resolvedEmptyWomenLabel = emptyWomenLabel || t("messages.noData");

  const renderPlayersList = (playersList: Player[], emptyLabel: string) => (
    <List dense sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, mt: 2 }}>
      {playersList.map((player) => {
        const highlight = getHighlight?.(player.id);
        return (
          <ListItem key={player.id} disablePadding>
            <ListItemButton
              onClick={() => onToggle(player.id)}
              dense
              sx={{
                borderLeft: highlight
                  ? `3px solid ${highlight === "high" ? theme.palette.success.main : theme.palette.warning.main}`
                  : "3px solid transparent",
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedIds.includes(player.id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                primary={renderPrimary ? renderPrimary(player) : player.name}
                secondary={renderSecondary ? renderSecondary(player) : undefined}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
      {playersList.length === 0 && (
        <ListItem>
          <ListItemText primary={emptyLabel} secondary={null} />
        </ListItem>
      )}
    </List>
  );

  return (
    <Box>
      {showOnlySelectedToggle && onOnlySelectedChange && (
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <FormControlLabel
            control={
              <Switch
                checked={onlySelected}
                onChange={(event) => onOnlySelectedChange(event.target.checked)}
                size="small"
              />
            }
            label={t("labels.onlySelected")}
          />
        </Box>
      )}

      <Box sx={{ borderBottom: 2, borderColor: "divider" }}>
        <Tabs
          value={resolvedActiveTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            sx: {
              height: 3,
              backgroundColor:
                resolvedActiveTab === "men"
                  ? theme.colors.men.main
                  : theme.colors.women.main,
            },
          }}
        >
          <Tab
            icon={<MaleIcon />}
            label={`${resolvedMenLabel} (${menPlayers.length})`}
            iconPosition="start"
            value="men"
            sx={{
              color: theme.colors.men.main,
              fontWeight: "medium",
              "&.Mui-selected": {
                color: theme.colors.men.main,
                fontWeight: "bold",
                backgroundColor: alpha(theme.colors.men.main, 0.08),
              },
            }}
          />
          <Tab
            icon={<FemaleIcon />}
            label={`${resolvedWomenLabel} (${womenPlayers.length})`}
            iconPosition="start"
            value="women"
            sx={{
              color: theme.colors.women.main,
              fontWeight: "medium",
              "&.Mui-selected": {
                color: theme.colors.women.main,
                fontWeight: "bold",
                backgroundColor: alpha(theme.colors.women.main, 0.08),
              },
            }}
          />
        </Tabs>
      </Box>

      {resolvedActiveTab === "men" && renderPlayersList(menPlayers, resolvedEmptyMenLabel)}
      {resolvedActiveTab === "women" && renderPlayersList(womenPlayers, resolvedEmptyWomenLabel)}
    </Box>
  );
}
