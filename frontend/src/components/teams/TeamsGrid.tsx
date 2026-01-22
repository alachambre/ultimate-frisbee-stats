import { Grid } from "@mui/material";
import type { Team } from "../../types";
import TeamCard from "./TeamCard";

interface TeamsGridProps {
  teams: Team[];
}

export default function TeamsGrid({ teams }: TeamsGridProps) {
  return (
    <Grid container spacing={4}>
      {teams.map((team) => (
        <Grid size={{ xs: 12, sm: 6 }} key={team.id}>
          <TeamCard team={team} />
        </Grid>
      ))}
    </Grid>
  );
}
