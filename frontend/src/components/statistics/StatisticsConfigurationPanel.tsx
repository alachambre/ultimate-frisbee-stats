import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FemaleIcon from "@mui/icons-material/Female";
import MaleIcon from "@mui/icons-material/Male";
import TuneIcon from "@mui/icons-material/Tune";
import { useTranslation } from "react-i18next";
import type { CompetitionWithTeam, GameWithScore, Player, TeamWithPlayers } from "../../types";
import { formatDate, formatDateTime } from "../../utils/dateFormatting";

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

function normalizeIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function areSameIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => id === right[index]);
}

interface StatisticsConfigurationPanelProps {
  density?: "standard" | "compact";
  isConfigurationExpanded: boolean;
  onToggleConfigurationExpanded: () => void;
  summaryItems?: string[];
  teamId?: number;
  selectedPlayerIds: number[];
  sortedTeams: TeamWithPlayers[];
  competitionsForTeam: CompetitionWithTeam[];
  selectedCompetitions: CompetitionWithTeam[];
  availableGames: GameWithScore[];
  selectedGames: GameWithScore[];
  playersForTeam: Player[];
  selectedPlayers: Player[];
  canFilterStatisticsByPlayers: boolean;
  controlsLoading: boolean;
  isPlayerOptionsLoading: boolean;
  hasControlsError: boolean;
  onSelectTeam: (teamId?: number) => void;
  onSelectCompetitionIds: (competitionIds: number[]) => void;
  onSelectGameIds: (gameIds: number[]) => void;
  onSelectPlayerIds: (playerIds: number[]) => void;
  onClearPlayersSelection: () => void;
  onPlayerFilterOpenChange?: (isOpen: boolean) => void;
}

export default function StatisticsConfigurationPanel({
  density = "standard",
  isConfigurationExpanded,
  onToggleConfigurationExpanded,
  summaryItems = [],
  teamId,
  selectedPlayerIds,
  sortedTeams,
  competitionsForTeam,
  selectedCompetitions,
  availableGames,
  selectedGames,
  playersForTeam,
  selectedPlayers,
  canFilterStatisticsByPlayers,
  controlsLoading,
  isPlayerOptionsLoading,
  hasControlsError,
  onSelectTeam,
  onSelectCompetitionIds,
  onSelectGameIds,
  onSelectPlayerIds,
  onClearPlayersSelection,
  onPlayerFilterOpenChange,
}: StatisticsConfigurationPanelProps) {
  const { t, i18n } = useTranslation(["statistics", "games", "common"]);
  const [isPlayerFilterOpen, setIsPlayerFilterOpen] = useState(false);
  const [draftPlayerIds, setDraftPlayerIds] = useState(() =>
    normalizeIds(selectedPlayerIds)
  );

  const selectedTeam = useMemo(
    () => sortedTeams.find((team) => team.id === teamId) ?? null,
    [sortedTeams, teamId]
  );
  const draftPlayerIdsSet = useMemo(() => new Set(draftPlayerIds), [draftPlayerIds]);
  const draftSelectedPlayers = useMemo(
    () => playersForTeam.filter((player) => draftPlayerIdsSet.has(player.id)),
    [draftPlayerIdsSet, playersForTeam]
  );
  const commitPlayerFilter = useCallback(() => {
    const nextPlayerIds = normalizeIds(draftPlayerIds);

    if (!areSameIds(nextPlayerIds, normalizeIds(selectedPlayerIds))) {
      onSelectPlayerIds(nextPlayerIds);
    }
  }, [draftPlayerIds, onSelectPlayerIds, selectedPlayerIds]);
  const isCompact = density === "compact";

  return (
    <Paper
      sx={{
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        p: { xs: isCompact ? 1.5 : 2, sm: 2 },
        mb: isCompact ? 0 : 3,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" width="100%" gap={1} mb={isCompact ? 0 : 1.25}>
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <TuneIcon
              sx={{
                fontSize: 16,
                color: (theme) => theme.colors.women.main,
              }}
            />
            <Typography variant="subtitle2" fontWeight="bold">
              {t("statistics:workflow.configurationSection")}
            </Typography>
          </Stack>
          {isCompact && summaryItems.length > 0 && (
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {summaryItems.map((item) => (
                <Chip key={item} label={item} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
        </Stack>
        <Button
          size="small"
          onClick={onToggleConfigurationExpanded}
          endIcon={isConfigurationExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ flexShrink: 0 }}
        >
          {isConfigurationExpanded ? t("common:action.hide") : t("common:action.show")}
        </Button>
      </Box>

      <Collapse in={isConfigurationExpanded} timeout="auto">
        <Box
          sx={
            isCompact
              ? { pt: 1.5 }
              : {
                  position: "sticky",
                  top: { xs: 8, sm: 16 },
                  zIndex: 10,
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.96),
                  border: "1px solid",
                  borderColor: "divider",
                }
          }
        >
          <Stack spacing={2}>
            {canFilterStatisticsByPlayers && selectedPlayerIds.length > 0 && (
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={onClearPlayersSelection}>
                    {t("common:action.clear")}
                  </Button>
                }
              >
                {t("statistics:workflow.cohortFilterActive", { count: selectedPlayerIds.length })}
              </Alert>
            )}

            <Autocomplete
              options={sortedTeams}
              value={selectedTeam}
              onChange={(_, team) => onSelectTeam(team?.id)}
              getOptionLabel={(team) => team.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`1. ${t("statistics:workflow.team")}`}
                  placeholder={t("statistics:workflow.selectTeam")}
                  helperText={
                    selectedTeam
                      ? t("statistics:workflow.stickyTeam", { teamName: selectedTeam.name })
                      : t("statistics:workflow.selectTeamPrompt")
                  }
                />
              )}
              noOptionsText={t("common:messages.noData")}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={competitionsForTeam}
              value={selectedCompetitions}
              onChange={(_, competitions) =>
                onSelectCompetitionIds(competitions.map((competition) => competition.id))
              }
              disabled={teamId === undefined || controlsLoading || hasControlsError}
              getOptionLabel={(competition) => competition.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              limitTags={2}
              renderOption={(props, competition, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <Box component="li" key={key} {...optionProps}>
                    <Checkbox
                      icon={checkboxIcon}
                      checkedIcon={checkboxCheckedIcon}
                      checked={selected}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={competition.name}
                      secondary={`${formatDate(
                        competition.start_date,
                        i18n.resolvedLanguage
                      )} - ${formatDate(competition.end_date, i18n.resolvedLanguage)}`}
                    />
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`2. ${t("statistics:workflow.competition")}`}
                  placeholder={t("statistics:workflow.selectCompetition")}
                  helperText={
                    teamId === undefined
                      ? t("statistics:workflow.selectTeamFirst")
                      : t("statistics:workflow.competitionsCount", {
                          count: competitionsForTeam.length,
                        })
                  }
                />
              )}
              noOptionsText={t("statistics:workflow.noCompetitions")}
            />

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={availableGames}
              value={selectedGames}
              onChange={(_, games) => onSelectGameIds(games.map((game) => game.id))}
              disabled={teamId === undefined || controlsLoading || hasControlsError}
              getOptionLabel={(game) => game.opponent_name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              limitTags={2}
              renderOption={(props, game, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <Box component="li" key={key} {...optionProps}>
                    <Checkbox
                      icon={checkboxIcon}
                      checkedIcon={checkboxCheckedIcon}
                      checked={selected}
                      sx={{ mr: 1 }}
                    />
                    <ListItemText
                      primary={game.opponent_name}
                      secondary={`${game.competition_name} - ${formatDateTime(
                        game.date,
                        i18n.resolvedLanguage
                      )} - ${game.our_score}-${game.opponent_score}`}
                    />
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`3. ${t("statistics:workflow.game")}`}
                  placeholder={t("statistics:workflow.selectGame")}
                  helperText={
                    teamId === undefined
                      ? t("statistics:workflow.selectTeamFirst")
                      : t("statistics:workflow.gamesCount", { count: availableGames.length })
                  }
                />
              )}
              noOptionsText={t("statistics:workflow.noGames")}
            />

            {canFilterStatisticsByPlayers && (
              <Autocomplete
                multiple
                disableCloseOnSelect
                options={playersForTeam}
                value={isPlayerFilterOpen ? draftSelectedPlayers : selectedPlayers}
                onOpen={() => {
                  setDraftPlayerIds(normalizeIds(selectedPlayerIds));
                  setIsPlayerFilterOpen(true);
                  onPlayerFilterOpenChange?.(true);
                }}
                onClose={() => {
                  setIsPlayerFilterOpen(false);
                  onPlayerFilterOpenChange?.(false);
                  commitPlayerFilter();
                }}
                onChange={(_, players) => {
                  const nextPlayerIds = normalizeIds(players.map((player) => player.id));
                  setDraftPlayerIds(nextPlayerIds);

                  if (
                    !isPlayerFilterOpen &&
                    !areSameIds(nextPlayerIds, normalizeIds(selectedPlayerIds))
                  ) {
                    onSelectPlayerIds(nextPlayerIds);
                  }
                }}
                disabled={
                  teamId === undefined ||
                  controlsLoading ||
                  hasControlsError
                }
                loading={isPlayerOptionsLoading}
                getOptionLabel={(player) => player.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                limitTags={2}
                renderOption={(props, player, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" key={key} {...optionProps}>
                      <Checkbox
                        icon={checkboxIcon}
                        checkedIcon={checkboxCheckedIcon}
                        checked={selected}
                        sx={{ mr: 1 }}
                      />
                      {player.gender === "M" ? (
                        <MaleIcon
                          sx={{
                            mr: 1,
                            fontSize: 18,
                            color: (theme) => theme.colors.men.main,
                          }}
                        />
                      ) : (
                        <FemaleIcon
                          sx={{
                            mr: 1,
                            fontSize: 18,
                            color: (theme) => theme.colors.women.main,
                          }}
                        />
                      )}
                      <ListItemText primary={player.name} />
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`4. ${t("statistics:workflow.playerFilter")}`}
                    placeholder={t("statistics:workflow.selectPlayer")}
                    helperText={
                      teamId === undefined
                        ? t("statistics:workflow.selectTeamFirst")
                        : t("statistics:workflow.playersCount", { count: playersForTeam.length })
                    }
                  />
                )}
                noOptionsText={t("statistics:workflow.noPlayers")}
                loadingText={t("common:action.loading")}
              />
            )}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
