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
import { getPublicTeams, getTeams } from "../../services/teams";
import type { TeamWithPlayers } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

const SELECTED_TEAM_STORAGE_KEY = "monkey-statistics-new-ui-team-id";

interface SelectedTeamContextValue {
  teams: TeamWithPlayers[];
  selectedTeam: TeamWithPlayers | null;
  selectedTeamId?: number;
  setSelectedTeamId: (teamId?: number) => void;
  isLoadingTeams: boolean;
  teamsError: Error | null;
  canLoadTeams: boolean;
}

const SelectedTeamContext = createContext<SelectedTeamContextValue | undefined>(
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

function getDefaultTeamId(teams: TeamWithPlayers[]): number | undefined {
  return [...teams].sort(
    (left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }) ||
      left.id - right.id
  )[0]?.id;
}

interface SelectedTeamProviderProps {
  children: ReactNode;
  canLoadTeamDetails: boolean;
}

export function SelectedTeamProvider({
  children,
  canLoadTeamDetails,
}: SelectedTeamProviderProps) {
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
    queryKey: canLoadTeamDetails ? queryKeys.teams : queryKeys.publicTeams,
    queryFn: canLoadTeamDetails ? getTeams : getPublicTeams,
  });

  const visibleTeams = useMemo(
    () => (!isFetchingTeams ? teams : []),
    [isFetchingTeams, teams]
  );
  const defaultTeamId = useMemo(() => getDefaultTeamId(visibleTeams), [visibleTeams]);
  const visibleSelectedTeamId = useMemo(() => {
    if (isFetchingTeams) {
      return undefined;
    }

    const hasSelectedTeam =
      selectedTeamId !== undefined &&
      visibleTeams.some((team) => team.id === selectedTeamId);

    return hasSelectedTeam ? selectedTeamId : defaultTeamId;
  }, [defaultTeamId, isFetchingTeams, selectedTeamId, visibleTeams]);

  const setSelectedTeamId = useCallback((teamId?: number) => {
    setSelectedTeamIdState(teamId);
    if (teamId === undefined) {
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SELECTED_TEAM_STORAGE_KEY, String(teamId));
  }, []);

  useEffect(() => {
    if (isLoadingTeams || isFetchingTeams || !hasLoadedTeams) {
      return;
    }

    if (visibleSelectedTeamId === undefined) {
      window.localStorage.removeItem(SELECTED_TEAM_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      SELECTED_TEAM_STORAGE_KEY,
      String(visibleSelectedTeamId)
    );
  }, [
    hasLoadedTeams,
    isFetchingTeams,
    isLoadingTeams,
    visibleSelectedTeamId,
  ]);

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
      isLoadingTeams: isLoadingTeams || isFetchingTeams,
      teamsError,
      canLoadTeams: true,
    }),
    [
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
    <SelectedTeamContext.Provider value={value}>
      {children}
    </SelectedTeamContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelectedTeam() {
  const context = useContext(SelectedTeamContext);
  if (!context) {
    throw new Error("useSelectedTeam must be used within SelectedTeamProvider");
  }
  return context;
}
