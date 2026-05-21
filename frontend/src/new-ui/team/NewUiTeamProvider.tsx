import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../services/teams";
import type { TeamWithPlayers } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

const SELECTED_TEAM_STORAGE_KEY = "monkey-statistics-new-ui-team-id";

interface NewUiTeamContextValue {
  teams: TeamWithPlayers[];
  selectedTeam: TeamWithPlayers | null;
  selectedTeamId?: number;
  setSelectedTeamId: (teamId?: number) => void;
  isLoadingTeams: boolean;
  teamsError: Error | null;
  canLoadTeams: boolean;
}

const NewUiTeamContext = createContext<NewUiTeamContextValue | undefined>(
  undefined
);

function readStoredTeamId(): number | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storedValue = window.localStorage.getItem(SELECTED_TEAM_STORAGE_KEY);
  if (!storedValue) {
    return undefined;
  }

  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

interface NewUiTeamProviderProps {
  children: ReactNode;
  canLoadTeams: boolean;
}

export function NewUiTeamProvider({
  children,
  canLoadTeams,
}: NewUiTeamProviderProps) {
  const [selectedTeamId, setSelectedTeamIdState] = useState<
    number | undefined
  >(() => readStoredTeamId());

  const {
    data: teams = [],
    isLoading: isLoadingTeams,
    isFetching: isFetchingTeams,
    isSuccess: hasLoadedTeams,
    error: teamsError,
  } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
    enabled: canLoadTeams,
  });

  const visibleTeams = useMemo(
    () => (canLoadTeams && !isFetchingTeams ? teams : []),
    [canLoadTeams, isFetchingTeams, teams]
  );
  const visibleSelectedTeamId =
    canLoadTeams && !isFetchingTeams ? selectedTeamId : undefined;

  useEffect(() => {
    if (!canLoadTeams || isLoadingTeams || isFetchingTeams || !hasLoadedTeams) {
      return;
    }

    if (teams.length === 1 && selectedTeamId !== teams[0].id) {
      // Query data determines the default selection once teams have loaded.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTeamIdState(teams[0].id);
      window.localStorage.setItem(
        SELECTED_TEAM_STORAGE_KEY,
        String(teams[0].id)
      );
      return;
    }

    if (
      selectedTeamId !== undefined &&
      !teams.some((team) => team.id === selectedTeamId)
    ) {
      // Query data also invalidates stale persisted selections.
      setSelectedTeamIdState(undefined);
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
    }
  }, [
    canLoadTeams,
    hasLoadedTeams,
    isFetchingTeams,
    isLoadingTeams,
    selectedTeamId,
    teams,
  ]);

  const setSelectedTeamId = useCallback((teamId?: number) => {
    setSelectedTeamIdState(teamId);
    if (teamId === undefined) {
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, String(teamId));
  }, []);

  const selectedTeam =
    visibleSelectedTeamId === undefined
      ? null
      : visibleTeams.find((team) => team.id === visibleSelectedTeamId) ?? null;

  const value = useMemo(
    () => ({
      teams: visibleTeams,
      selectedTeam,
      selectedTeamId: visibleSelectedTeamId,
      setSelectedTeamId,
      isLoadingTeams: canLoadTeams && (isLoadingTeams || isFetchingTeams),
      teamsError: canLoadTeams ? teamsError : null,
      canLoadTeams,
    }),
    [
      canLoadTeams,
      isFetchingTeams,
      isLoadingTeams,
      selectedTeam,
      setSelectedTeamId,
      teamsError,
      visibleSelectedTeamId,
      visibleTeams,
    ]
  );

  return (
    <NewUiTeamContext.Provider value={value}>
      {children}
    </NewUiTeamContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNewUiTeam() {
  const context = useContext(NewUiTeamContext);
  if (!context) {
    throw new Error("useNewUiTeam must be used within NewUiTeamProvider");
  }
  return context;
}
