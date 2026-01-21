import { Card, CardContent, Typography, IconButton, Box, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Player } from "../../types";

interface PlayerCardProps {
  player: Player;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="body1" fontWeight="medium">
                {player.name}
              </Typography>
              <Chip
                label={player.gender}
                size="small"
                color={player.gender === "M" ? "primary" : "secondary"}
                sx={{ height: 20, fontSize: "0.75rem" }}
              />
            </Box>
            {player.number !== null && player.number !== undefined && (
              <Typography variant="body2" color="text.secondary">
                #{player.number}
              </Typography>
            )}
          </Box>
          {onEdit && (
            <IconButton onClick={onEdit} color="primary" size="small" aria-label="Edit player">
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton onClick={onDelete} color="error" size="small" aria-label="Remove player">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
