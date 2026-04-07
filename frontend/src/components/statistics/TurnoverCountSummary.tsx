import { useTranslation } from "react-i18next";
import TurnoverBalanceBar from "../shared/TurnoverBalanceBar";

interface TurnoverCountSummaryProps {
  ourCount: number;
  opponentCount: number;
}

export default function TurnoverCountSummary({
  ourCount,
  opponentCount,
}: TurnoverCountSummaryProps) {
  const { t } = useTranslation("statistics");

  return (
    <TurnoverBalanceBar
      opponentCount={opponentCount}
      ourCount={ourCount}
      opponentLabel={t("teamStats.opponentTurnovers")}
      ourLabel={t("teamStats.ourTurnovers")}
    />
  );
}
