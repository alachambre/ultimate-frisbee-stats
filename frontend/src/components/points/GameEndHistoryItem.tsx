import SportsScoreIcon from "@mui/icons-material/SportsScore";
import { useTranslation } from "react-i18next";
import type { HistorySummarySnapshot } from "./historySummarySnapshot";
import HistorySummaryItem from "./HistorySummaryItem";

interface GameEndHistoryItemProps {
  snapshot?: HistorySummarySnapshot;
}

export default function GameEndHistoryItem({ snapshot }: GameEndHistoryItemProps) {
  const { t } = useTranslation(["points", "games"]);

  return (
    <HistorySummaryItem
      title={t("points:history.gameEnd")}
      chipLabel={t("games:status.ended")}
      chipColor="success"
      icon={<SportsScoreIcon color="success" />}
      detailsLabel={t("points:history.gameSummaryDetails")}
      snapshot={snapshot}
    />
  );
}
