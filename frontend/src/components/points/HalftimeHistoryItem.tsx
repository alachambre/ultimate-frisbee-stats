import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import { useTranslation } from "react-i18next";
import type { Halftime } from "../../types";
import type { HistorySummarySnapshot } from "./historySummarySnapshot";
import HistorySummaryItem from "./HistorySummaryItem";

interface HalftimeHistoryItemProps {
  halftime: Halftime;
  snapshot?: HistorySummarySnapshot;
  onDelete?: (halftime: Halftime) => void;
  isDeleting?: boolean;
}

export default function HalftimeHistoryItem({
  halftime,
  snapshot,
  onDelete,
  isDeleting = false,
}: HalftimeHistoryItemProps) {
  const { t } = useTranslation("points");

  return (
    <HistorySummaryItem
      title={t("history.halfTime")}
      chipLabel={t("history.halfTime")}
      chipColor="warning"
      icon={<AccessTimeFilledIcon color="primary" />}
      snapshot={snapshot}
      comments={halftime.comments}
      onDelete={onDelete}
      deletePayload={halftime}
      deleteAriaLabel={t("history.deleteHalfTime")}
      isDeleting={isDeleting}
    />
  );
}
