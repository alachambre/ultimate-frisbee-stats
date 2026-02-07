import { Chip, type ChipProps } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { CompetitionStatus, GameStatus } from "../../types";

interface StatusChipProps {
  kind: "competition" | "game";
  status: CompetitionStatus | GameStatus;
  ourScore?: number;
  opponentScore?: number;
  size?: ChipProps["size"];
}

function getGameOutcome(
  ourScore: number | undefined,
  opponentScore: number | undefined
): "won" | "lost" | "draw" | null {
  if (ourScore === undefined || opponentScore === undefined) {
    return null;
  }

  if (ourScore > opponentScore) {
    return "won";
  }

  if (ourScore < opponentScore) {
    return "lost";
  }

  return "draw";
}

export default function StatusChip({
  kind,
  status,
  ourScore,
  opponentScore,
  size = "small",
}: StatusChipProps) {
  const { t } = useTranslation(["common", "games"]);

  if (kind === "competition") {
    const competitionStatus = status as CompetitionStatus;
    const color: ChipProps["color"] = competitionStatus === "ongoing" ? "success" : "default";
    return (
      <Chip
        label={t(`common:status.${competitionStatus}`)}
        size={size}
        color={color}
      />
    );
  }

  const gameStatus = status as GameStatus;

  if (gameStatus === "started") {
    return <Chip label={t("games:status.started")} size={size} color="primary" />;
  }

  if (gameStatus === "ready") {
    return <Chip label={t("games:status.ready")} size={size} color="info" />;
  }

  const gameOutcome = getGameOutcome(ourScore, opponentScore);
  if (gameOutcome === "won") {
    return <Chip label={t("games:status.won")} size={size} color="success" />;
  }

  if (gameOutcome === "lost") {
    return <Chip label={t("games:status.lost")} size={size} color="error" />;
  }

  if (gameOutcome === "draw") {
    return <Chip label={t("games:status.draw")} size={size} color="warning" />;
  }

  return <Chip label={t("games:status.ended")} size={size} color="default" />;
}
