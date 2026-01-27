import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import type { Strategy } from "../../types";

interface StrategyCardProps {
  strategy: Strategy;
  onEdit: (strategy: Strategy) => void;
  onDelete: (strategy: Strategy) => void;
}

export default function StrategyCard({ strategy, onEdit, onDelete }: StrategyCardProps) {
  const isOffense = strategy.category === "offense";

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "2px solid transparent",
        background: (theme) =>
          `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) =>
            `0 8px 24px ${theme.palette.primary.main}4D`,
        },
      }}
    >
      <CardContent sx={{ width: "100%", textAlign: "center", py: 4, position: "relative" }}>
        {/* Action buttons */}
        <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => onEdit(strategy)}
            sx={{ color: "primary.main" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(strategy)}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Icon */}
        {isOffense ? (
          <FlashOnIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        ) : (
          <ShieldIcon sx={{ fontSize: 48, color: "secondary.main", mb: 2 }} />
        )}

        {/* Name */}
        <Typography variant="h6" component="h3" fontWeight="bold" mb={1}>
          {strategy.name}
        </Typography>

        {/* Category chip */}
        <Chip
          label={isOffense ? "Offense" : "Defense"}
          size="small"
          color="default"
          sx={{ mb: 2 }}
        />

        {/* Description */}
        {strategy.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {strategy.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
