import { Box, Typography } from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import { useTranslation } from "react-i18next";
import type { PointWithPlayers } from "../../../types";

interface LivePointContextCardsProps {
  currentPoint: PointWithPlayers;
  variant?: "classic" | "field";
}

export function LivePointContextCards({
  currentPoint,
  variant = "classic",
}: LivePointContextCardsProps) {
  const { t } = useTranslation(["points"]);

  if (variant === "field") {
    return (
      <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
        {currentPoint.strategy && (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "action.hover",
              borderRadius: 1,
              display: "flex",
              gap: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <EmojiObjectsIcon
              fontSize="small"
              sx={{
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
              }}
            />
            <Typography variant="body2" fontWeight="medium">
              {currentPoint.starting_on_offense
                ? t("points:tracker.offense", "Offense")
                : t("points:tracker.defense", "Defense")}
              {" / "}
              {currentPoint.strategy.name}
            </Typography>
          </Box>
        )}

        {currentPoint.comments && (
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <CommentIcon
                fontSize="small"
                sx={{
                  color: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                }}
              />
              <Typography variant="body2" fontWeight="medium">
                {t("points:tracker.comment", "Comment")}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {currentPoint.comments}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      {currentPoint.strategy && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "action.hover",
            borderRadius: 1,
            borderLeft: 3,
            borderColor: (theme) =>
              currentPoint.starting_on_offense
                ? theme.colors.offense.main
                : theme.colors.defense.main,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EmojiObjectsIcon
              fontSize="small"
              sx={{
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
              }}
            />
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
              }}
            >
              {currentPoint.starting_on_offense
                ? t("points:tracker.offense", "Offense")
                : t("points:tracker.defense", "Defense")}
              {" / "}
              {currentPoint.strategy.name}
            </Typography>
          </Box>
        </Box>
      )}

      {currentPoint.comments && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: "action.hover",
            borderRadius: 1,
            borderLeft: 3,
            borderColor: (theme) =>
              currentPoint.starting_on_offense
                ? theme.colors.offense.main
                : theme.colors.defense.main,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <CommentIcon
              fontSize="small"
              sx={{
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
              }}
            />
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
              }}
            >
              {t("points:tracker.comment", "Comment")}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {currentPoint.comments}
          </Typography>
        </Box>
      )}
    </>
  );
}
