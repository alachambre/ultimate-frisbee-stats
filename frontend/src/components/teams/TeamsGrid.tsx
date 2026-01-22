import { Grid } from "@mui/material";
import type { TeamWithPlayers } from "../../types";
import TeamCard from "./TeamCard";

interface TeamsGridProps {
  teams: TeamWithPlayers[];
}

export default function TeamsGrid({ teams }: TeamsGridProps) {
  return (
    <Grid container spacing={4}>
      {teams.map((team) => (
        <Grid size={12} key={team.id}>
          <TeamCard team={team} />
        </Grid>
      ))}
    </Grid>
  );
}
