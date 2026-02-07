import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GroupsIcon from "@mui/icons-material/Groups";
import { useTranslation } from "react-i18next";
import type { LineWithPlayers } from "../../types";

interface LineCardProps {
  line: LineWithPlayers;
}

export default function LineCard({ line }: LineCardProps) {
  const { t } = useTranslation(["lines", "common"]);
  const navigate = useNavigate();
  const menCount = line.players.filter((p) => p.gender === "M").length;
  const womenCount = line.players.filter((p) => p.gender === "W").length;

  const handleCardClick = () => {
    navigate(`/lines/${line.id}`);
  };

  return (
    <Card
      elevation={0}
      onClick={handleCardClick}
      sx={{
        height: "100%",
        border: "2px solid transparent",
        background: (theme) =>
          `linear-gradient(${theme.palette.common.white}, ${theme.palette.common.white}) padding-box, ${theme.gradients.primary} border-box`,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", py: 4, position: "relative" }}>
        <GroupsIcon
          sx={{
            fontSize: 60,
            color: (theme) => theme.gradients.middle,
            mb: 2,
          }}
        />

        <Typography variant="h5" component="h2" fontWeight="bold" mb={1}>
          {line.name}
        </Typography>

        {line.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "2.5em",
            }}
          >
            {line.description}
          </Typography>
        )}

        <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
          <Chip
            label={t('lines:card.players', { count: line.players.length })}
            size="small"
            color="primary"
            variant="outlined"
          />
          {menCount > 0 && (
            <Chip
              label={`${menCount} ${menCount === 1 ? t("common:labels.male") : t("common:labels.men")}`}
              size="small"
              variant="outlined"
            />
          )}
          {womenCount > 0 && (
            <Chip
              label={`${womenCount} ${womenCount === 1 ? t("common:labels.female") : t("common:labels.women")}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
