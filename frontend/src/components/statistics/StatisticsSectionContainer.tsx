import { Fragment } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { useTranslation } from "react-i18next";
import type { StatisticsExportDetailMode } from "../../services/statistics";
import StatisticsExportMenuButton from "./StatisticsExportMenuButton";

interface StatisticsSectionContainerProps {
  pathItems: string[];
  canExport: boolean;
  isExporting: boolean;
  onExport: (detailMode: StatisticsExportDetailMode) => Promise<void> | void;
  children: React.ReactNode;
}

export default function StatisticsSectionContainer({
  pathItems,
  canExport,
  isExporting,
  onExport,
  children,
}: StatisticsSectionContainerProps) {
  const { t } = useTranslation("statistics");

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
        <StatisticsExportMenuButton disabled={!canExport} isExporting={isExporting} onExport={onExport} />
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
