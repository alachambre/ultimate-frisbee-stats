import { useMemo, useState, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardActionArea,
  Grid,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
  highlightSecondary?: boolean;
  preserveOrder?: boolean;
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
  highlightSecondary = true,
  preserveOrder = false,
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

  const menPlayers = useMemo(
    () =>
      preserveOrder
        ? players.filter((player) => player.gender === "M")
        : players
            .filter((player) => player.gender === "M")
            .sort((a, b) => a.name.localeCompare(b.name)),
    [players, preserveOrder]
  );
  const womenPlayers = useMemo(
    () =>
      preserveOrder
        ? players.filter((player) => player.gender === "W")
        : players
            .filter((player) => player.gender === "W")
            .sort((a, b) => a.name.localeCompare(b.name)),
    [players, preserveOrder]
  );

  const resolvedMenLabel = menLabel || t("labels.men");
  const resolvedWomenLabel = womenLabel || t("labels.women");
  const resolvedEmptyMenLabel = emptyMenLabel || t("messages.noData");
  const resolvedEmptyWomenLabel = emptyWomenLabel || t("messages.noData");

  const renderPlayersGrid = (playersList: Player[], emptyLabel: string) => (
    <Grid container spacing={1.25} sx={{ mt: 1 }}>
      {playersList.map((player) => {
        const highlight = getHighlight?.(player.id) || null;
        const isSelected = selectedIds.includes(player.id);
        const secondaryContent = renderSecondary?.(player);
        const accentColor = player.gender === "M" ? theme.colors.men.main : theme.colors.women.main;
        const highlightColor = highlight === "high"
          ? theme.palette.success.main
          : highlight === "low"
            ? theme.palette.warning.main
            : null;

        return (
          <Grid key={player.id} size={{ xs: 6, sm: 4 }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: isSelected ? accentColor : "divider",
                backgroundColor: isSelected ? alpha(accentColor, 0.12) : "background.paper",
                borderLeft: highlightColor ? `3px solid ${highlightColor}` : undefined,
              }}
            >
              <CardActionArea
                onClick={() => onToggle(player.id)}
                aria-label={player.name}
                aria-pressed={isSelected}
                sx={{
                  p: 1.25,
                  minHeight: 78,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight={isSelected ? "bold" : "medium"} noWrap>
                    {renderPrimary ? renderPrimary(player) : player.name}
                  </Typography>
                  {isSelected && <CheckCircleIcon fontSize="small" sx={{ color: accentColor }} />}
                </Box>

                {secondaryContent !== null && secondaryContent !== undefined && secondaryContent !== "" && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: highlightSecondary ? (highlightColor || "text.secondary") : "text.secondary",
                      fontWeight: highlightSecondary && highlight ? 500 : 400,
                    }}
                    noWrap
                  >
                    {secondaryContent}
                  </Typography>
                )}
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}

      {playersList.length === 0 && (
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              textAlign: "center",
              color: "text.secondary",
              backgroundColor: "background.paper",
            }}
          >
            <Typography variant="body2">{emptyLabel}</Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 0.5 }}>
        <Tabs
          value={resolvedActiveTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            sx: {
              height: 2,
              borderRadius: 2,
              backgroundColor:
                resolvedActiveTab === "men"
                  ? alpha(theme.colors.men.main, 0.65)
                  : alpha(theme.colors.women.main, 0.65),
            },
          }}
          sx={{
            minHeight: 38,
          }}
        >
          <Tab
            icon={<MaleIcon />}
            label={`${resolvedMenLabel} (${menPlayers.length})`}
            iconPosition="start"
            value="men"
            sx={{
              minHeight: 38,
              px: 1,
              textTransform: "none",
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              fontWeight: "medium",
              color: alpha(theme.colors.men.main, 0.72),
              "& .MuiSvgIcon-root": {
                fontSize: 16,
              },
              "&.Mui-selected": {
                color: theme.colors.men.main,
                fontWeight: 600,
                backgroundColor: alpha(theme.colors.men.main, 0.05),
              },
            }}
          />
          <Tab
            icon={<FemaleIcon />}
            label={`${resolvedWomenLabel} (${womenPlayers.length})`}
            iconPosition="start"
            value="women"
            sx={{
              minHeight: 38,
              px: 1,
              textTransform: "none",
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              fontWeight: "medium",
              color: alpha(theme.colors.women.main, 0.72),
              "& .MuiSvgIcon-root": {
                fontSize: 16,
              },
              "&.Mui-selected": {
                color: theme.colors.women.main,
                fontWeight: 600,
                backgroundColor: alpha(theme.colors.women.main, 0.05),
              },
            }}
          />
        </Tabs>
      </Box>

      {resolvedActiveTab === "men" && renderPlayersGrid(menPlayers, resolvedEmptyMenLabel)}
      {resolvedActiveTab === "women" && renderPlayersGrid(womenPlayers, resolvedEmptyWomenLabel)}
    </Box>
  );
}
