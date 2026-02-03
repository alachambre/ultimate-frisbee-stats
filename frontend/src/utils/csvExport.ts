import type { GameDetail, GameTeamStats, PlayerGameStats } from "../types";
import { getCallsByPoint } from "../services/calls";
import { getTurnoversByPoint } from "../services/turnovers";

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper function to format percentage
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

// Helper function to export data as CSV
function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportGameStatisticsToCSV(
  game: GameDetail,
  teamStats: GameTeamStats,
  playerStats: PlayerGameStats[]
): Promise<void> {
  const csvLines: string[] = [];

  // Game Information Section
  csvLines.push("GAME INFORMATION");
  csvLines.push(`Competition,${game.competition_name}`);
  csvLines.push(`Teams,"${game.team_name} vs ${game.opponent_name}"`);
  csvLines.push(`Score,${game.our_score} - ${game.opponent_score}`);
  csvLines.push(`Status,${game.status}`);
  if (game.start_datetime) {
    csvLines.push(`Start Time,${new Date(game.start_datetime).toLocaleString()}`);
  }
  if (game.end_datetime) {
    csvLines.push(`End Time,${new Date(game.end_datetime).toLocaleString()}`);
  }
  csvLines.push("");

  // Team Statistics Section
  if (teamStats.total_completed_points > 0) {
    csvLines.push("TEAM STATISTICS");
    csvLines.push("");

    // Offense Stats
    csvLines.push("Offense");
    csvLines.push("Metric,Count,Total,Percentage");
    csvLines.push(
      `Hold Rate,${teamStats.offense.points_won},${teamStats.offense.points_started},${formatPercent(teamStats.offense.hold_rate)}`
    );
    csvLines.push(
      `Clean Hold Rate,${teamStats.offense.points_won_no_turnover},${teamStats.offense.points_won},${formatPercent(teamStats.offense.clean_hold_rate)}`
    );
    csvLines.push("");

    // Defense Stats
    csvLines.push("Defense");
    csvLines.push("Metric,Count,Total,Percentage");
    csvLines.push(
      `Turnover Rate,${teamStats.defense.points_with_turnover},${teamStats.defense.points_started},${formatPercent(teamStats.defense.turnover_rate)}`
    );
    csvLines.push(
      `Break Rate,${teamStats.defense.points_won},${teamStats.defense.points_started},${formatPercent(teamStats.defense.break_rate)}`
    );
    csvLines.push(
      `Clean Break Rate,${teamStats.defense.points_won_no_turnover},${teamStats.defense.points_won},${formatPercent(teamStats.defense.clean_break_rate)}`
    );
    csvLines.push("");
  }

  // Player Statistics Section
  if (playerStats.length > 0) {
    csvLines.push("PLAYER STATISTICS");
    csvLines.push("");

    // Header row
    csvLines.push(
      [
        "Player Number",
        "Player Name",
        "Game Time",
        // Offense columns
        "Offense Points",
        "Offense Won",
        "Offense Hold Rate",
        "Offense Clean Points",
        "Offense Clean Hold Rate",
        // Defense columns
        "Defense Points",
        "Defense With Turnover",
        "Defense Turnover Rate",
        "Defense Won",
        "Defense Break Rate",
        "Defense Clean Breaks",
        "Defense Clean Break Rate",
      ].join(",")
    );

    // Player rows
    playerStats.forEach((stat) => {
      csvLines.push(
        [
          stat.player_number || "",
          `"${stat.player_name}"`,
          formatTime(stat.effective_time_seconds),
          // Offense
          stat.offense.points_played,
          stat.offense.points_won,
          formatPercent(stat.offense.hold_rate),
          stat.offense.points_won_no_turnover,
          formatPercent(stat.offense.clean_hold_rate),
          // Defense
          stat.defense.points_played,
          stat.defense.points_with_turnover,
          formatPercent(stat.defense.turnover_rate),
          stat.defense.points_won,
          formatPercent(stat.defense.break_rate),
          stat.defense.points_won_no_turnover,
          formatPercent(stat.defense.clean_break_rate),
        ].join(",")
      );
    });
  }

  // Points Detail Section
  if (game.points && game.points.length > 0) {
    csvLines.push("");
    csvLines.push("POINTS DETAIL");
    csvLines.push("");

    // Fetch calls and turnovers for all points
    const pointsWithEvents = await Promise.all(
      game.points.map(async (point) => {
        const [calls, turnovers] = await Promise.all([
          getCallsByPoint(point.id).catch(() => []),
          getTurnoversByPoint(point.id).catch(() => []),
        ]);
        return { point, calls, turnovers };
      })
    );

    // Calculate score after each point
    let ourScore = 0;
    let opponentScore = 0;

    // Export each point with its details
    for (const { point, calls, turnovers } of pointsWithEvents) {
      // Update score based on point result
      if (point.won !== null && point.status === "completed") {
        if (point.won) {
          ourScore++;
        } else {
          opponentScore++;
        }
      }

      csvLines.push(`Point ${point.point_number}`);
      csvLines.push("Field,Value");
      csvLines.push(`Type,${point.starting_on_offense ? "Offense" : "Defense"}`);
      csvLines.push(`Status,${point.status}`);
      csvLines.push(
        `Result,${point.won === null ? "In Progress" : point.won ? "Won" : "Lost"}`
      );
      csvLines.push(
        `Score After,${point.status === "completed" ? `"${ourScore} - ${opponentScore}"` : "N/A"}`
      );
      csvLines.push(`Field Side,${point.field_side || "N/A"}`);
      csvLines.push(`Pull,${point.pull === null ? "N/A" : point.pull ? "In" : "Out"}`);
      csvLines.push(
        `Strategy,${point.strategy ? `"${point.strategy.name}"` : "None"}`
      );
      csvLines.push(
        `Start Time,${point.start_datetime ? new Date(point.start_datetime).toLocaleString() : "Not started"}`
      );
      csvLines.push(
        `End Time,${point.end_datetime ? new Date(point.end_datetime).toLocaleString() : "Not ended"}`
      );
      csvLines.push(
        `Duration,${point.duration_seconds !== null && point.duration_seconds !== undefined ? formatTime(point.duration_seconds) : "N/A"}`
      );
      csvLines.push(`Comments,"${point.comments || ""}"`);
      csvLines.push("");

      // Players on this point
      if (point.players && point.players.length > 0) {
        csvLines.push("Players on Point");
        csvLines.push("Number,Name,Gender");
        point.players.forEach((player) => {
          csvLines.push(
            `${player.number || ""},"${player.name}",${player.gender}`
          );
        });
        csvLines.push("");
      }

      // Calls during this point
      if (calls.length > 0) {
        csvLines.push("Calls");
        csvLines.push("Call Time,Resume Time,Duration,Comments");
        calls.forEach((call) => {
          const callTime = new Date(call.call_timestamp).toLocaleString();
          const resumeTime = call.resume_timestamp
            ? new Date(call.resume_timestamp).toLocaleString()
            : "Pending";
          const duration = call.resume_timestamp
            ? `${Math.round(
                (new Date(call.resume_timestamp).getTime() -
                  new Date(call.call_timestamp).getTime()) /
                  1000
              )}s`
            : "Ongoing";
          csvLines.push(
            `${callTime},${resumeTime},${duration},"${call.comments || ""}"`
          );
        });
        csvLines.push("");
      }

      // Turnovers during this point
      if (turnovers.length > 0) {
        csvLines.push("Turnovers");
        csvLines.push("Time,Player,Comments");
        turnovers.forEach((turnover) => {
          const time = new Date(turnover.timestamp).toLocaleString();
          const playerName = turnover.player ? turnover.player.name : "Team";
          csvLines.push(`${time},"${playerName}","${turnover.comments || ""}"`);
        });
        csvLines.push("");
      }

      csvLines.push("---");
      csvLines.push("");
    }
  }

  const csvContent = csvLines.join("\n");
  const filename = `${game.team_name}_vs_${game.opponent_name}_statistics.csv`.replace(
    /[^a-z0-9_\-.]/gi,
    "_"
  );
  downloadCSV(csvContent, filename);
}
