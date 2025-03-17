import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { TOP_TEAM_BY_SEED_AND_ROUND } from "~/constants";
import { useMatchups } from "~/hooks/useMatchups";
import { useTeams } from "~/hooks/useTeams";
import type { Matchup, Region, UserMatchup } from "~/types/bracket";
import { generateTournamentBracket } from "~/utils/generateBracket";

import { initializeUserPicks } from "./utils";

interface BracketContextType {
  matchups: Matchup[] | undefined;
  currentRound: Matchup["round"];
  setCurrentRound: (round: Matchup["round"]) => void;
  currentMatchupId: number;
  currentMatchup: UserMatchup | undefined;
  setCurrentMatchupId: Dispatch<SetStateAction<number>>;
  userPicks: UserMatchup[];
  setWinner: (matchupId: number, winnerId: number) => void;
  isLoading: boolean;
  regionPairs: [Region[], Region[]];
  completedSelections: number;
  totalSelections: number;
}

const BracketContext = createContext<BracketContextType | null>(null);

export const useBracket = () => {
  const context = useContext(BracketContext);
  if (!context) {
    throw new Error("useBracket must be used within a BracketProvider");
  }
  return context;
};

const STORAGE_KEY = "bracketUserPicks";

const loadUserPicksFromStorage = (): UserMatchup[] | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UserMatchup[];
  } catch (error) {
    console.error("Failed to parse stored user picks:", error);
    return null;
  }
};

export const BracketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: matchups, isLoading: isLoadingMatchups } = useMatchups();
  const [currentRound, setCurrentRound] =
    useState<Matchup["round"]>("Round of 64");
  const [isClient, setIsClient] = useState(false);
  const [lastPickTime, setLastPickTime] = useState<number | null>(null);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize userPicks from localStorage or create new
  const [userPicks, setUserPicks] = useState<UserMatchup[]>([]);

  // Load userPicks from localStorage once client is ready
  useEffect(() => {
    if (isClient) {
      const storedPicks = loadUserPicksFromStorage();
      if (storedPicks) {
        setUserPicks(storedPicks);
      }
    }
  }, [isClient]);

  // Compute selections from userPicks
  const { completedSelections, totalSelections } = useMemo(
    () => ({
      completedSelections: userPicks.filter((m) => m.winner).length,
      totalSelections: userPicks.length,
    }),
    [userPicks],
  );

  const regionPairs = useMemo<[Region[], Region[]]>(() => {
    if (!matchups) return [[], []];

    const eliteEightMatchupsByNextMatchupId = matchups
      .filter(
        (matchup) =>
          matchup.round === "Elite 8" && matchup.nextMatchupId !== null,
      )
      .reduce(
        (acc, matchup) => {
          if (matchup.nextMatchupId !== null) {
            const matchupsForId = acc[matchup.nextMatchupId] ?? [];
            matchupsForId.push(matchup);
            acc[matchup.nextMatchupId] = matchupsForId;
          }
          return acc;
        },
        {} as Record<number, Matchup[]>,
      );

    const pairs = Object.values(eliteEightMatchupsByNextMatchupId).map(
      (matchups) => {
        // Sort regions alphabetically within each pair
        return matchups.map((m) => m.region).sort();
      },
    );

    // Ensure we always return exactly two groups, even if data is incomplete
    return pairs.length >= 2
      ? [pairs[0] ?? [], pairs[1] ?? []]
      : [pairs[0] ?? [], []];
  }, [matchups]);

  // Initialize bracket data when it becomes available and we're on the client
  useEffect(() => {
    if (isClient && matchups?.length && teams?.length) {
      const stored = loadUserPicksFromStorage();
      if (stored?.length) {
        setUserPicks(stored);
      } else {
        const initializedPicks = initializeUserPicks(matchups, teams);
        console.log({ initializedPicks });
        setUserPicks(initializedPicks);
      }
    }
  }, [isClient, matchups, teams]);

  const [currentMatchupId, setCurrentMatchupId] = useState<number>(1);

  // Update currentMatchupId when userPicks changes
  useEffect(() => {
    if (userPicks.length > 0) {
      const firstUnfinished = userPicks.find((m) => !m.winner);
      if (firstUnfinished) {
        setCurrentMatchupId(firstUnfinished.id);
      }
    }
  }, [userPicks]);

  const currentMatchup = useMemo(
    () => userPicks.find((pick) => pick.id === currentMatchupId),
    [userPicks, currentMatchupId],
  );

  const setWinner = (matchupId: number, winnerId: number) => {
    const updatedPicks = updateBracket(matchupId, winnerId);
    setUserPicks(updatedPicks);
    // Save to local storage only when a user makes a pick
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPicks));
    }
  };

  if (!isClient) {
    return;
  }

  return (
    <BracketContext.Provider
      value={{
        matchups,
        completedSelections,
        totalSelections,
        currentRound,
        setCurrentRound,
        currentMatchupId,
        currentMatchup,
        setCurrentMatchupId,
        userPicks,
        setWinner,
        isLoading: !isClient || isLoadingMatchups || isLoadingTeams,
        regionPairs,
      }}
    >
      {children}
    </BracketContext.Provider>
  );
};
