import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { NewGamesCompetitionGroup } from "./buildNewGamesDashboard";
import NewGameCard from "./NewGameCard";

interface NewCompetitionGamesAccordionProps {
  canManageCompetition?: boolean;
  group: NewGamesCompetitionGroup;
  formatDate: (value: string | null) => string;
  labels: {
    editCompetition: string;
    editCompetitionAria: string;
    emptyCompetition: string;
    live: string;
    manageRoster: string;
    manageRosterAria: string;
    upcoming: string;
    completed: string;
    results: string;
  };
  onEditCompetition?: (group: NewGamesCompetitionGroup) => void;
}

function renderResultsLabel(
  group: NewGamesCompetitionGroup,
  label: string
): string {
  return `${label}: ${group.summary.wins}-${group.summary.losses}-${group.summary.draws}`;
}

export default function NewCompetitionGamesAccordion({
  canManageCompetition = false,
  group,
  formatDate,
  labels,
  onEditCompetition,
}: NewCompetitionGamesAccordionProps) {
  const relevantDate =
    group.nextRelevantDate ?? group.mostRecentDate ?? group.startDate;
  const canShowCompetitionActions =
    canManageCompetition && group.competition !== null;
  const handleEditCompetition = () => {
    onEditCompetition?.(group);
  };

  return (
    <Accordion
      defaultExpanded={group.isInitiallyExpanded}
      disableGutters
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        "&:before": { display: "none" },
      })}
    >
      <Box sx={{ alignItems: "stretch", display: "flex" }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            alignItems: "center",
            flexGrow: 1,
            gap: 1.5,
            minWidth: 0,
            px: { xs: 2, sm: 2.5 },
            py: 1,
            "& .MuiAccordionSummary-content": {
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
              minWidth: 0,
            },
          }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography component="h2" fontWeight={800} variant="subtitle1">
              {group.competitionName}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {formatDate(relevantDate)}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              flexWrap: "wrap",
              gap: 0.75,
              ml: { md: "auto" },
            }}
          >
            {group.summary.live > 0 && (
              <Chip
                label={`${labels.live}: ${group.summary.live}`}
                size="small"
              />
            )}
            {group.summary.upcoming > 0 && (
              <Chip
                label={`${labels.upcoming}: ${group.summary.upcoming}`}
                size="small"
              />
            )}
            {group.summary.completed > 0 && (
              <Chip
                label={`${labels.completed}: ${group.summary.completed}`}
                size="small"
              />
            )}
            {group.summary.completed > 0 && (
              <Chip
                label={renderResultsLabel(group, labels.results)}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </AccordionSummary>
        {canShowCompetitionActions && (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: "center",
              flexShrink: 0,
              pr: { xs: 1, sm: 1.25 },
            }}
          >
            <Tooltip title={labels.editCompetition}>
              <IconButton
                aria-label={labels.editCompetitionAria}
                onClick={handleEditCompetition}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={labels.manageRoster}>
              <IconButton
                aria-label={labels.manageRosterAria}
                component={Link}
                size="small"
                to={`/competitions/${group.competitionId}`}
              >
                <GroupsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <AccordionDetails
        sx={(theme) => ({
          bgcolor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`,
          p: { xs: 1.5, sm: 2 },
        })}
      >
        <Stack spacing={1.25}>
          {group.games.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {labels.emptyCompetition}
            </Typography>
          ) : (
            group.games.map((game) => <NewGameCard game={game} key={game.id} />)
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
