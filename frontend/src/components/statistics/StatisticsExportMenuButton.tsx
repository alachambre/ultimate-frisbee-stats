import { useState } from "react";
import type { MouseEvent } from "react";
import {
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useTranslation } from "react-i18next";
import type { StatisticsExportDetailMode } from "../../services/statistics";

interface StatisticsExportMenuButtonProps {
  disabled?: boolean;
  isExporting?: boolean;
  onExport: (detailMode: StatisticsExportDetailMode) => Promise<void> | void;
}

export default function StatisticsExportMenuButton({
  disabled = false,
  isExporting = false,
  onExport,
}: StatisticsExportMenuButtonProps) {
  const { t } = useTranslation(["statistics", "common"]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleExport = async (detailMode: StatisticsExportDetailMode) => {
    handleCloseMenu();
    await onExport(detailMode);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpenMenu}
        disabled={disabled || isExporting}
        aria-haspopup="menu"
        aria-expanded={menuOpen ? "true" : undefined}
      >
        {isExporting ? t("common:action.loading") : t("statistics:page.exportCSV")}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => handleExport("summary")}
          disabled={isExporting}
        >
          {t("statistics:page.exportCsvSummary")}
        </MenuItem>
        <MenuItem
          onClick={() => handleExport("full")}
          disabled={isExporting}
        >
          {t("statistics:page.exportCsvFull")}
        </MenuItem>
      </Menu>
    </>
  );
}
