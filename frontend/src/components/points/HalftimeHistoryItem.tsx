import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import type { Halftime } from "../../types";

interface HalftimeHistoryItemProps {
  halftime: Halftime;
  onDelete: (halftime: Halftime) => void;
  isDeleting?: boolean;
}

export default function HalftimeHistoryItem({
  halftime,
  onDelete,
  isDeleting = false,
}: HalftimeHistoryItemProps) {
  const { t } = useTranslation(["points", "common"]);
  const halftimeTime = new Date(halftime.halftime_timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccessTimeFilledIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {t("points:history.halfTime")}
            </Typography>
          </Box>
          <Tooltip title={t("common:action.delete")}>
            <span>
              <IconButton
                size="small"
                onClick={() => onDelete(halftime)}
                aria-label={t("points:history.deleteHalfTime")}
                color="error"
                disabled={isDeleting}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Chip label={t("points:history.halfTime")} color="warning" size="small" />
          <Typography variant="body2" color="text.secondary">
            {halftimeTime}
          </Typography>
        </Box>
        {halftime.comments && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {halftime.comments}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
