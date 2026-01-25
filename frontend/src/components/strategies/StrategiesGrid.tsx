import { Grid } from "@mui/material";
import type { Strategy } from "../../types";
import StrategyCard from "./StrategyCard";

interface StrategiesGridProps {
  strategies: Strategy[];
  onEdit: (strategy: Strategy) => void;
  onDelete: (strategy: Strategy) => void;
}

export default function StrategiesGrid({ strategies, onEdit, onDelete }: StrategiesGridProps) {
  return (
    <Grid container spacing={3}>
      {strategies.map((strategy) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={strategy.id}>
          <StrategyCard strategy={strategy} onEdit={onEdit} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
}
