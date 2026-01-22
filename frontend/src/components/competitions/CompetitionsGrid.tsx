import { Grid } from "@mui/material";
import type { CompetitionWithTeam } from "../../types";
import CompetitionCard from "./CompetitionCard";

interface CompetitionsGridProps {
  competitions: CompetitionWithTeam[];
}

export default function CompetitionsGrid({
  competitions,
}: CompetitionsGridProps) {
  return (
    <Grid container spacing={3}>
      {competitions.map((competition) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={competition.id}>
          <CompetitionCard competition={competition} />
        </Grid>
      ))}
    </Grid>
  );
}
