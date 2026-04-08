import { useMemo } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { formatDate } from "../../utils/dateFormatting";

const checkboxIcon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkboxCheckedIcon = <CheckBoxIcon fontSize="small" />;

interface StatisticsConfigurationPanelProps {
  isConfigurationExpanded: boolean;
  onToggleConfigurationExpanded: () => void;
  teamId?: number;
  selectedPlayerIds: number[];
  sortedTeams: TeamWithPlayers[];
  competitionsForTeam: CompetitionWithTeam[];
  selectedCompetitions: CompetitionWithTeam[];
  availableGames: GameWithScore[];
  selectedGames: GameWithScore[];
  playersForTeam: Player[];
  selectedPlayers: Player[];
  controlsLoading: boolean;
  isPlayerOptionsLoading: boolean;
  hasControlsError: boolean;
  onSelectTeam: (teamId?: number) => void;
  onSelectCompetitionIds: (competitionIds: number[]) => void;
  onSelectGameIds: (gameIds: number[]) => void;
  onSelectPlayerIds: (playerIds: number[]) => void;
  onClearPlayersSelection: () => void;
}

export default function StatisticsConfigurationPanel({
  isConfigurationExpanded,
  onToggleConfigurationExpanded,
  teamId,
  selectedPlayerIds,
  sortedTeams,
  competitionsForTeam,
  selectedCompetitions,
  availableGames,
  selectedGames,
  playersForTeam,
  selectedPlayers,
  controlsLoading,
  isPlayerOptionsLoading,
  hasControlsError,
  onSelectTeam,
  onSelectCompetitionIds,
  onSelectGameIds,
  onSelectPlayerIds,
  onClearPlayersSelection,
}: StatisticsConfigurationPanelProps) {
  const { t, i18n } = useTranslation(["statistics", "games", "common"]);

  const selectedTeam = useMemo(
    () => sortedTeams.find((team) => team.id === teamId) ?? null,
    [sortedTeams, teamId]
  );

  return (
    <Paper
      sx={{
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        p: 2,
        mb: 3,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" gap={1} mb={1.25}>
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
        <Button
          size="small"
          onClick={onToggleConfigurationExpanded}
          endIcon={isConfigurationExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {isConfigurationExpanded ? t("common:action.hide") : t("common:action.show")}
        </Button>
      </Box>

      <Collapse in={isConfigurationExpanded} timeout="auto">
        <Box
          sx={{
            position: "sticky",
            top: { xs: 8, sm: 16 },
            zIndex: 10,
            p: 2,
            borderRadius: 1.5,
            backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.96),
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={2}>
            {selectedPlayerIds.length > 0 && (
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
                      secondary={`${game.competition_name} - ${formatDate(
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

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={playersForTeam}
              value={selectedPlayers}
              onChange={(_, players) => onSelectPlayerIds(players.map((player) => player.id))}
              disabled={
                teamId === undefined ||
                controlsLoading ||
                isPlayerOptionsLoading ||
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
                  label={`4. ${t("statistics:workflow.playerCohort")}`}
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
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
