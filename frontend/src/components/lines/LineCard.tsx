import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import type { LineWithPlayers } from "../../types";

interface LineCardProps {
  line: LineWithPlayers;
}

export default function LineCard({ line }: LineCardProps) {
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
          `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}4D`,
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
            label={`${line.players.length} ${line.players.length === 1 ? "player" : "players"}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          {menCount > 0 && (
            <Chip
              label={`${menCount} ${menCount === 1 ? "man" : "men"}`}
              size="small"
              variant="outlined"
            />
          )}
          {womenCount > 0 && (
            <Chip
              label={`${womenCount} ${womenCount === 1 ? "woman" : "women"}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
