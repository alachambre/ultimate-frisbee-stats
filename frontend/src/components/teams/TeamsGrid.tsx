import { Grid } from "@mui/material";
import type { Team } from "../../types";
import TeamCard from "./TeamCard";

interface TeamsGridProps {
  teams: Team[];
}

export default function TeamsGrid({ teams }: TeamsGridProps) {
  return (
    <Grid container spacing={3}>
      {teams.map((team) => (
        <Grid item xs={12} sm={6} md={4} key={team.id}>
          <TeamCard team={team} />
        </Grid>
      ))}
    </Grid>
  );
}
