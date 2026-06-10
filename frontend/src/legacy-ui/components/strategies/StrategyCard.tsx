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
import { useTranslation } from "react-i18next";
import { alpha } from "@mui/material/styles";
import type { Strategy } from "../../../types";

interface StrategyCardProps {
  strategy: Strategy;
  onEdit: (strategy: Strategy) => void;
  onDelete: (strategy: Strategy) => void;
}

export default function StrategyCard({ strategy, onEdit, onDelete }: StrategyCardProps) {
  const { t } = useTranslation(['strategies', 'common']);
  const isOffense = strategy.category === "offense";

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        height: "100%",
        background: theme.palette.background.paper,
        borderRadius: 1,
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          borderRadius: 1,
          padding: "2px",
          background: theme.gradients.primary,
          WebkitMask: `linear-gradient(${theme.palette.common.white} 0 0) content-box, linear-gradient(${theme.palette.common.white} 0 0)`,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        },
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isOffense
            ? `0 8px 24px ${alpha(theme.colors.offense.main, 0.3)}`
            : `0 8px 24px ${alpha(theme.colors.defense.main, 0.3)}`,
        },
      })}
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
          <FlashOnIcon sx={{ fontSize: 48, color: (theme) => theme.colors.offense.main, mb: 2 }} />
        ) : (
          <ShieldIcon sx={{ fontSize: 48, color: (theme) => theme.colors.defense.main, mb: 2 }} />
        )}

        {/* Name */}
        <Typography variant="h6" component="h3" fontWeight="bold" mb={1}>
          {strategy.name}
        </Typography>

        {/* Category chip */}
        <Chip
          label={isOffense ? t('strategies:form.offense') : t('strategies:form.defense')}
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
