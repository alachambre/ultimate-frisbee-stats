import { Grid } from "@mui/material";
import LineCard from "./LineCard";
import type { LineWithPlayers } from "../../types";

interface LinesGridProps {
  lines: LineWithPlayers[];
}

export default function LinesGrid({ lines }: LinesGridProps) {
  return (
    <Grid container spacing={3}>
      {lines.map((line) => (
        <Grid key={line.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <LineCard line={line} />
        </Grid>
      ))}
    </Grid>
  );
}
