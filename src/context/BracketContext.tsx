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

import { initializeUserPicks } from "./utils";

interface BracketContextType {
  matchups: Matchup[] | undefined;
  currentRound: Matchup["round"];
  setCurrentRound: (round: Matchup["round"]) => void;
  currentMatchupId: number;
  currentMatchup: UserMatchup | undefined;
  setCurrentMatchupId: Dispatch<SetStateAction<number>>;
  userPicks: UserMatchup[];
  setWinner: (matchupId: number, winnerId: string) => void;
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

  console.log({ matchups, teams });
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize userPicks from localStorage or create new
  const [userPicks, setUserPicks] = useState<UserMatchup[]>([]);

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
        return matchups.map((m) => m.region);
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
        setUserPicks(initializedPicks);
      }
    }
  }, [isClient, matchups, teams]);

  const [currentMatchupId, setCurrentMatchupId] = useState<number>(1);

  // Update currentMatchupId when userPicks changes
  useEffect(() => {
    if (userPicks.length > 0) {
      const firstUnfinished = userPicks.find((m) => !m.winner);
      setCurrentMatchupId(firstUnfinished?.id ?? userPicks[0]?.id ?? 1);
    }
  }, [userPicks]);

  // Save to localStorage whenever userPicks changes, but only on client
  useEffect(() => {
    if (isClient && userPicks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPicks));
    }
  }, [isClient, userPicks]);

  const currentMatchup = useMemo(
    () => userPicks.find((pick) => pick.id === currentMatchupId),
    [userPicks, currentMatchupId],
  );

  const setWinner = (matchupId: number, winnerId: string) => {
    setUserPicks((picks) => {
      const updatedPicks = picks.map((pick) =>
        pick.id === matchupId ? { ...pick, winner: winnerId } : pick,
      );

      // Find the current matchup and its next matchup
      const currentMatchup = updatedPicks.find((p) => p.id === matchupId);
      if (!currentMatchup?.nextMatchupId) return updatedPicks;

      const nextMatchup = updatedPicks.find(
        (p) => p.id === currentMatchup.nextMatchupId,
      );
      if (!nextMatchup) return updatedPicks;

      // Get the winning team
      const winningTeam =
        currentMatchup.winner === currentMatchup.topTeam?.id
          ? currentMatchup.topTeam
          : currentMatchup.bottomTeam;

      if (!winningTeam) return updatedPicks;

      // Special case handling for different rounds
      let shouldBeTopTeam = false;

      switch (nextMatchup.round) {
        case "Round of 64":
          // Teams are already placed correctly in Round of 64
          return updatedPicks;
        case "Final 4":
          // For Final Four, use the region's position in regionPairs
          const [regionPair1, regionPair2] = regionPairs;
          const regionIndex1 = regionPair1.indexOf(winningTeam.region);
          const regionIndex2 = regionPair2.indexOf(winningTeam.region);
          shouldBeTopTeam = regionIndex1 === 0 || regionIndex2 === 0;
          break;
        case "Championship":
          // For Championship, still use the position from the current matchup
          shouldBeTopTeam = currentMatchup.position === "top";
          break;
        default:
          // For other rounds (Round of 32, Sweet 16, Elite 8), use the seed placement rules
          shouldBeTopTeam =
            TOP_TEAM_BY_SEED_AND_ROUND[nextMatchup.round]?.TOP.includes(
              winningTeam.seed,
            ) ?? false;
      }

      // Update the next matchup based on the seed placement rules
      return updatedPicks.map((pick) => {
        if (pick.id === nextMatchup.id) {
          return {
            ...pick,
            topTeam: shouldBeTopTeam ? winningTeam : pick.topTeam,
            bottomTeam: shouldBeTopTeam ? pick.bottomTeam : winningTeam,
          };
        }
        return pick;
      });
    });

    // Find the next unfinished matchup in the current round
    const currentRoundMatchups = userPicks.filter(
      (m) => m.round === currentRound,
    );
    const currentIndex = currentRoundMatchups.findIndex(
      (m) => m.id === matchupId,
    );

    // Look for the next unfinished matchup in the current round
    const nextUnfinishedMatchup = currentRoundMatchups
      .slice(currentIndex + 1)
      .find((m) => !m.winner);

    if (nextUnfinishedMatchup) {
      // If found, move to that matchup
      setCurrentMatchupId(nextUnfinishedMatchup.id);
    } else {
      // If no more unfinished matchups in current round, look for the next round with unfinished matchups
      const roundOrder: Matchup["round"][] = [
        "Round of 64",
        "Round of 32",
        "Sweet 16",
        "Elite 8",
        "Final 4",
        "Championship",
      ];

      const currentRoundIndex = roundOrder.indexOf(currentRound);
      const nextRounds = roundOrder.slice(currentRoundIndex + 1);

      for (const round of nextRounds) {
        const nextRoundMatchups = userPicks.filter((m) => m.round === round);
        const firstUnfinishedMatchup = nextRoundMatchups.find((m) => !m.winner);

        if (firstUnfinishedMatchup) {
          setCurrentRound(round);
          setCurrentMatchupId(firstUnfinishedMatchup.id);
          break;
        }
      }
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
