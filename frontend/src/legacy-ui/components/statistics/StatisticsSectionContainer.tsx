import { Fragment } from "react";
import { Box, Chip, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import type { StatisticsExportDetailMode } from "../../../services/statistics";
import StatisticsExportMenuButton from "../../../components/statistics/StatisticsExportMenuButton";

interface StatisticsSectionContainerProps {
  pathItems: string[];
  canExport: boolean;
  isExporting: boolean;
  onExport: (detailMode: StatisticsExportDetailMode) => Promise<void> | void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
}

export default function StatisticsSectionContainer({
  pathItems,
  canExport,
  isExporting,
  onExport,
  isRefreshing = false,
  onRefresh,
  children,
}: StatisticsSectionContainerProps) {
  const { t } = useTranslation("statistics");
  const refreshLabel = isRefreshing
    ? t("workflow.refreshingStatistics")
    : t("workflow.refreshStatistics");

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 3,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap" mb={1.5}>
        <Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <QueryStatsIcon
              sx={{
                fontSize: 16,
                color: (theme) => theme.colors.pull.main,
              }}
            />
            <Typography variant="subtitle2" fontWeight="bold">
              {t("workflow.statisticsSection")}
            </Typography>
          </Stack>
          {pathItems.length > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
              {pathItems.map((item, index) => (
                <Fragment key={`${item}-${index}`}>
                  <Chip
                    label={item}
                    size="small"
                    color={index === pathItems.length - 1 ? "primary" : "default"}
                    variant={index === pathItems.length - 1 ? "filled" : "outlined"}
                  />
                  {index < pathItems.length - 1 && (
                    <NavigateNextIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  )}
                </Fragment>
              ))}
            </Stack>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              maxWidth: { xs: "100%", sm: 360 },
              textAlign: { xs: "left", sm: "right" },
            }}
          >
            {t("workflow.freshnessNotice")}
          </Typography>
          {onRefresh && (
            <Tooltip title={refreshLabel} arrow>
              <span>
                <IconButton
                  aria-label={t("workflow.refreshStatistics")}
                  size="small"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  color="primary"
                >
                  {isRefreshing ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          {canExport && (
            <StatisticsExportMenuButton isExporting={isExporting} onExport={onExport} />
          )}
        </Stack>
      </Box>
      <Box
        sx={{
          "& > .MuiPaper-root": {
            boxShadow: "none",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          },
          "& > .MuiBox-root > .MuiPaper-root": {
            boxShadow: "none",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
