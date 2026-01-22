import { Card, CardContent, Typography, IconButton, Box } from "@mui/material";
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
            <Typography variant="body1" fontWeight="medium" mb={0.5}>
              {player.name}
            </Typography>
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
