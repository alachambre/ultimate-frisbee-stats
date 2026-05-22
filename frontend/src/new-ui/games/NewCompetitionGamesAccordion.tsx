import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { NewGamesCompetitionGroup } from "./buildNewGamesDashboard";
import NewGameCard from "./NewGameCard";

interface NewCompetitionGamesAccordionProps {
  group: NewGamesCompetitionGroup;
  formatDate: (value: string | null) => string;
  labels: {
    live: string;
    upcoming: string;
    completed: string;
    results: string;
  };
}

function renderResultsLabel(
  group: NewGamesCompetitionGroup,
  label: string
): string {
  return `${label}: ${group.summary.wins}-${group.summary.losses}-${group.summary.draws}`;
}

export default function NewCompetitionGamesAccordion({
  group,
  formatDate,
  labels,
}: NewCompetitionGamesAccordionProps) {
  const relevantDate = group.nextRelevantDate ?? group.mostRecentDate;

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
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          alignItems: "center",
          gap: 1.5,
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
            <Chip label={`${labels.live}: ${group.summary.live}`} size="small" />
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

      <AccordionDetails
        sx={(theme) => ({
          bgcolor: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`,
          p: { xs: 1.5, sm: 2 },
        })}
      >
        <Stack spacing={1.25}>
          {group.games.map((game) => (
            <NewGameCard game={game} key={game.id} />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
