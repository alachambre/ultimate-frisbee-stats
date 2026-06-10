import { Fragment, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  getCompetitionGroupStatusKind,
  type NewGamesCompetitionGroup,
  type NewGamesCompetitionStatusKind,
} from "./buildNewGamesDashboard";
import NewGameCard from "./NewGameCard";

interface NewCompetitionGamesAccordionProps {
  canEditData?: boolean;
  canManageCompetition?: boolean;
  group: NewGamesCompetitionGroup;
  formatDate: (value: string | null) => string;
  labels: {
    deleteCompetition: string;
    deleteCompetitionAria: string;
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
  onDeleteCompetition?: (group: NewGamesCompetitionGroup) => void;
  onEditCompetition?: (group: NewGamesCompetitionGroup) => void;
  onManageRoster?: (group: NewGamesCompetitionGroup) => void;
}

function renderResultsLabel(
  group: NewGamesCompetitionGroup,
  label: string
): string {
  return `${label}: ${group.summary.wins}-${group.summary.losses}-${group.summary.draws}`;
}

function renderStatusChipLabel(
  statusKind: NewGamesCompetitionStatusKind,
  group: NewGamesCompetitionGroup,
  labels: NewCompetitionGamesAccordionProps["labels"]
): string {
  if (statusKind === "results") {
    return renderResultsLabel(group, labels.results);
  }

  const countByKind = {
    completed: group.summary.completed,
    live: group.summary.live,
    upcoming: group.summary.upcoming,
  };

  return `${labels[statusKind]}: ${countByKind[statusKind]}`;
}

export default function NewCompetitionGamesAccordion({
  canEditData = true,
  canManageCompetition = false,
  group,
  formatDate,
  labels,
  onDeleteCompetition,
  onEditCompetition,
  onManageRoster,
}: NewCompetitionGamesAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(group.isInitiallyExpanded);
  const relevantDate =
    group.nextRelevantDate ?? group.mostRecentDate ?? group.startDate;
  const canShowCompetitionActions =
    canManageCompetition && group.competition !== null;
  const statusKind = getCompetitionGroupStatusKind(group);
  const handleEditCompetition = () => {
    onEditCompetition?.(group);
  };
  const handleManageRoster = () => {
    onManageRoster?.(group);
  };
  const handleDeleteCompetition = () => {
    onDeleteCompetition?.(group);
  };

  return (
    <Accordion
      expanded={isExpanded}
      onChange={(_, nextExpanded) => setIsExpanded(nextExpanded)}
      disableGutters
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        "&:before": { display: "none" },
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "stretch",
          bgcolor: {
            xs: theme.palette.action.hover,
            sm: theme.palette.background.paper,
          },
          display: "flex",
        })}
      >
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

          {statusKind && (
            <Chip
              label={renderStatusChipLabel(statusKind, group, labels)}
              size="small"
              sx={{ ml: { md: "auto" } }}
              variant={statusKind === "results" ? "outlined" : "filled"}
            />
          )}
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
                onClick={handleManageRoster}
                size="small"
              >
                <GroupsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={labels.deleteCompetition}>
              <IconButton
                aria-label={labels.deleteCompetitionAria}
                color="error"
                onClick={handleDeleteCompetition}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      <AccordionDetails
        sx={(theme) => ({
          bgcolor: {
            xs: theme.palette.background.paper,
            sm: theme.palette.background.default,
          },
          borderTop: `1px solid ${theme.palette.divider}`,
          p: { xs: 0, sm: 2 },
        })}
      >
        <Stack
          spacing={{ xs: 0, sm: 1.25 }}
        >
          {group.games.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ p: { xs: 2, sm: 0 } }}
              variant="body2"
            >
              {labels.emptyCompetition}
            </Typography>
          ) : (
            group.games.map((game, index) => (
              <Fragment key={game.id}>
                {index > 0 && (
                  <Divider
                    data-testid="competition-game-row-divider"
                    flexItem
                    sx={(theme) => ({
                      borderColor: theme.palette.divider,
                      display: { xs: "block", sm: "none" },
                    })}
                  />
                )}
                <NewGameCard
                  canEditData={canEditData}
                  game={game}
                  variant="row"
                />
              </Fragment>
            ))
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
