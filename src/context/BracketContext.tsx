import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  TOP_REGIONS_FOR_FINAL_FOUR,
  TOP_REGIONS_FOR_CHAMPIONSHIP,
  TOP_TEAM_BY_SEED_AND_ROUND_ID,
} from "~/constants";
import { useMatchups } from "~/hooks/useMatchups";
import type { Matchup, Region, UserMatchup } from "~/types/bracket";

import { initializeUserPicks } from "./initializeUserPicks";

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

function updateBracket(
  userPicks: UserMatchup[],
  matchupId: number,
  winnerId: number,
): UserMatchup[] {
  // Create a new array to avoid mutating the original
  const updatedPicks = [...userPicks];

  // Find the current matchup
  const currentMatchupIndex = updatedPicks.findIndex((m) => m.id === matchupId);
  if (currentMatchupIndex === -1) return updatedPicks;

  const currentMatchup = updatedPicks[currentMatchupIndex]!;

  // Update the winner of the current matchup
  updatedPicks[currentMatchupIndex] = {
    ...currentMatchup,
    winner: winnerId,
  };

  // get the next matchup
  const nextMatchupId = currentMatchup.nextMatchupId;
  if (!nextMatchupId) return updatedPicks;

  const nextMatchupIndex = updatedPicks.findIndex(
    (m) => m.id === nextMatchupId,
  );
  if (nextMatchupIndex === -1) return updatedPicks;

  const nextMatchup = updatedPicks[nextMatchupIndex]!;
  const winningTeam = [currentMatchup.topTeam, currentMatchup.bottomTeam].find(
    (t) => t?.id === winnerId,
  );
  if (!winningTeam) return updatedPicks;

  const topTeamSeedsForNextMatchup =
    TOP_TEAM_BY_SEED_AND_ROUND_ID[nextMatchup.roundId as 1 | 2 | 3 | 4]?.TOP ??
    [];

  const isTopTeamForRegionalRounds = topTeamSeedsForNextMatchup.includes(
    winningTeam.seed,
  );

  const isTopTeamForFinalFour =
    nextMatchup.round === "Final 4" &&
    TOP_REGIONS_FOR_FINAL_FOUR.includes(currentMatchup.region);

  const isTopTeamForChampionship =
    nextMatchup.round === "Championship" &&
    (TOP_REGIONS_FOR_CHAMPIONSHIP as Region[]).some((region) =>
      currentMatchup.region.includes(region),
    );

  const isWinningTeamTopTeamInNextMatchup =
    isTopTeamForRegionalRounds ||
    isTopTeamForFinalFour ||
    isTopTeamForChampionship;

  // update the next matchup with the winning team
  updatedPicks[nextMatchupIndex] = {
    ...nextMatchup,
    ...(isWinningTeamTopTeamInNextMatchup
      ? { topTeam: winningTeam }
      : { bottomTeam: winningTeam }),
  };
  // // If there's a next matchup, update it with the winner

  return updatedPicks;
}

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
  const { data: matchups, isLoading: isLoadingMatchups } = useMatchups();
  const [currentRound, setCurrentRound] =
    useState<Matchup["round"]>("Round of 64");
  const [isClient, setIsClient] = useState(false);

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
    if (isClient && matchups?.length) {
      const stored = loadUserPicksFromStorage();
      if (stored?.length) {
        setUserPicks(stored);
      } else {
        const initializedPicks = initializeUserPicks(matchups);
        setUserPicks(initializedPicks);
      }
    }
  }, [isClient, matchups]);

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
    const updatedPicks = updateBracket(userPicks, matchupId, winnerId);
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
        isLoading: !isClient || isLoadingMatchups,
        regionPairs,
      }}
    >
      {children}
    </BracketContext.Provider>
  );
};
