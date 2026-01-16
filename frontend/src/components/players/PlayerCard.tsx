import { Card, CardContent, Typography, IconButton, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import type { Player } from "../../types";

interface PlayerCardProps {
  player: Player;
  onEdit: () => void;
}

export default function PlayerCard({ player, onEdit }: PlayerCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body1" fontWeight="medium">
              {player.name}
            </Typography>
            {player.number !== null && (
              <Typography variant="body2" color="text.secondary">
                #{player.number}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onEdit} color="primary" size="small" aria-label="Edit player">
            <EditIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
