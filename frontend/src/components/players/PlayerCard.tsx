import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  IconButton,
  Box,
  Tooltip,
  alpha,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import type { Player } from "../../types";

interface PlayerCardProps {
  player: Player;
  onCardClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PlayerCard({ player, onCardClick, onEdit, onDelete }: PlayerCardProps) {
  const { t } = useTranslation("players");
  const hasInlineActions = Boolean(onEdit || onDelete);
  const getAccentColor = (isMale: boolean, primary: string, secondary: string) =>
    isMale ? primary : secondary;

  const content = (
    <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box flex={1} minWidth={0}>
            <Typography variant="body1" fontWeight={600} mb={0.25} noWrap>
              {player.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {player.number !== null && player.number !== undefined ? `#${player.number}` : "_"}
            </Typography>
          </Box>
          {hasInlineActions && (
            <Box display="flex" alignItems="center" gap={0.25}>
              {onEdit && (
                <Tooltip title={t("card.editPlayer")} arrow>
                  <IconButton onClick={onEdit} color="primary" size="small" aria-label="Edit player">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title={t("card.removePlayer")} arrow>
                  <IconButton onClick={onDelete} color="error" size="small" aria-label="Remove player">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 2,
        borderColor: (theme) =>
          alpha(
            getAccentColor(
              player.gender === "M",
              theme.palette.primary.main,
              theme.palette.secondary.main
            ),
            0.22
          ),
        backgroundImage: (theme) =>
          `linear-gradient(150deg, ${theme.palette.background.paper} 0%, ${alpha(
            getAccentColor(
              player.gender === "M",
              theme.palette.primary.main,
              theme.palette.secondary.main
            ),
            0.04
          )} 100%)`,
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: 3,
          transform: "translateY(-2px)",
        },
      }}
    >
      {onCardClick ? (
        <CardActionArea
          onClick={onCardClick}
          aria-label={t("card.openPlayer", { playerName: player.name })}
        >
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
