import { useId } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { useNewUiTeam } from "../team/useNewUiTeam";

export default function NewTeamSelector() {
  const { t } = useTranslation(["navigation"]);
  const labelId = useId();
  const {
    canLoadTeams,
    isLoadingTeams,
    selectedTeam,
    selectedTeamId,
    setSelectedTeamId,
    teams,
  } = useNewUiTeam();
  const selectedTeamLabel = selectedTeam?.name ?? t("navigation:team.noTeam");

  const handleTeamChange = (event: SelectChangeEvent<number | "">) => {
    const value = event.target.value;
    setSelectedTeamId(value === "" ? undefined : Number(value));
  };

  if (!canLoadTeams) {
    return (
      <Typography color="text.secondary" variant="body2">
        {t("navigation:team.noTeam")}
      </Typography>
    );
  }

  if (teams.length <= 1) {
    return (
      <Typography
        title={selectedTeamLabel}
        variant="body2"
        sx={{
          fontWeight: 700,
          maxWidth: { xs: 220, sm: 260 },
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {selectedTeamLabel}
      </Typography>
    );
  }

  return (
    <FormControl
      disabled={isLoadingTeams}
      size="small"
      sx={{ minWidth: { xs: 180, sm: 220 }, maxWidth: 280 }}
    >
      <InputLabel id={labelId}>
        {t("navigation:team.selectedTeam")}
      </InputLabel>
      <Select
        label={t("navigation:team.selectedTeam")}
        labelId={labelId}
        onChange={handleTeamChange}
        value={selectedTeamId ?? ""}
      >
        {teams.map((team) => (
          <MenuItem key={team.id} value={team.id}>
            {team.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
