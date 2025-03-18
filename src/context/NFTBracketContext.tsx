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
import type {
  Matchup,
  NFTMetadata,
  NFTPick,
  Region,
  Team,
  UserMatchup,
} from "~/types/bracket";

// Create a context similar to BracketContext but for NFT metadata
interface NFTBracketContextType {
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

const NFTBracketContext = createContext<NFTBracketContextType | null>(null);

export const useNFTBracket = () => {
  const context = useContext(NFTBracketContext);
  if (!context) {
    throw new Error("useNFTBracket must be used within a NFTBracketProvider");
  }
  return context;
};

// Helper function to convert NFTPick to UserMatchup
const convertNFTPickToUserMatchup = (
  nftPick: NFTPick,
  teams: Team[],
  matchups: Matchup[],
  nftUserPicks: NFTPick[],
): UserMatchup => {
  // Find the original matchup to get additional data
  const originalMatchup = matchups.find((m) => m.id === nftPick.id);

  if (!originalMatchup) {
    console.error(
      `Matchup with ID ${nftPick.id} not found in matchups:`,
      matchups.map((m) => m.id),
    );
    throw new Error(`Matchup with ID ${nftPick.id} not found`);
  }

  let topTeam: Team | null = null;
  let bottomTeam: Team | null = null;

  // For Round of 64, use the matchup's original teams
  if (originalMatchup.round === "Round of 64") {
    topTeam = originalMatchup.topTeam;
    bottomTeam = originalMatchup.bottomTeam;
  } else {
    // For subsequent rounds, find the winning teams from previous matchups
    const previousMatchups = originalMatchup.previousMatchupIds
      .map((prevId) => {
        const prevMatchup = matchups.find((m) => m.id === prevId);
        if (!prevMatchup) return null;

        // Find the NFT pick for this previous matchup
        const prevNFTPick = nftUserPicks.find((p) => p.id === prevMatchup.id);

        if (!prevNFTPick) {
          return null;
        }

        // Get the winning team from the previous matchup
        const winningTeam = teams.find(
          (t) => t.id === Number(prevNFTPick.winner),
        );
        if (!winningTeam) {
          return null;
        }

        return { matchup: prevMatchup, winner: winningTeam };
      })
      .filter((m): m is { matchup: Matchup; winner: Team } => m !== null);

    if (previousMatchups.length === 2) {
      // Only use TOP_TEAM_BY_SEED_AND_ROUND for rounds where it's defined
      const round = originalMatchup.round;
      if (round in TOP_TEAM_BY_SEED_AND_ROUND) {
        const topSeeds =
          TOP_TEAM_BY_SEED_AND_ROUND[
            round as keyof typeof TOP_TEAM_BY_SEED_AND_ROUND
          ].TOP;

        // Sort previous matchups by their winners' seeds to match the expected positions
        previousMatchups.sort((a, b) => {
          const aIsTop = topSeeds.includes(a.winner.seed);
          const bIsTop = topSeeds.includes(b.winner.seed);
          if (aIsTop && !bIsTop) return -1;
          if (!aIsTop && bIsTop) return 1;
          return a.winner.seed - b.winner.seed;
        });
      } else {
        // For rounds not in TOP_TEAM_BY_SEED_AND_ROUND (Final 4, Championship)
        // Just sort by seed
        previousMatchups.sort((a, b) => a.winner.seed - b.winner.seed);
      }

      // Assign winners as top and bottom teams
      // We know there are exactly 2 matchups at this point
      topTeam = previousMatchups[0]?.winner ?? null;
      bottomTeam = previousMatchups[1]?.winner ?? null;
    }
  }

  return {
    ...originalMatchup,
    topTeam,
    bottomTeam,
    winner: Number(nftPick.winner),
  };
};

// Helper function to get all teams from Round of 64 matchups
const getTeamsFromMatchups = (matchups: Matchup[]): Team[] => {
  const roundOf64Matchups = matchups.filter((m) => m.round === "Round of 64");
  const teams = new Set<Team>();

  roundOf64Matchups.forEach((matchup) => {
    if (matchup.topTeam) teams.add(matchup.topTeam);
    if (matchup.bottomTeam) teams.add(matchup.bottomTeam);
  });

  return Array.from(teams);
};

interface NFTBracketProviderProps {
  children: React.ReactNode;
  metadata: NFTMetadata;
}

export const NFTBracketProvider: React.FC<NFTBracketProviderProps> = ({
  children,
  metadata,
}) => {
  const { data: matchups, isLoading: isLoadingMatchups } = useMatchups();
  const [currentRound, setCurrentRound] =
    useState<Matchup["round"]>("Round of 64");
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize userPicks from NFT metadata
  const [userPicks, setUserPicks] = useState<UserMatchup[]>([]);

  // Get teams from Round of 64 matchups
  const teams = useMemo(() => {
    if (!matchups?.length) return [];
    return getTeamsFromMatchups(matchups);
  }, [matchups]);

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
    const result: [Region[], Region[]] =
      pairs.length >= 2
        ? [pairs[0] ?? [], pairs[1] ?? []]
        : [pairs[0] ?? [], []];

    // If we still have empty region pairs, use a fallback
    if (result[0].length === 0 || result[1].length === 0) {
      console.warn("Using fallback region pairs");
      // Fallback to standard region pairs
      return [["East", "West"] as Region[], ["South", "Midwest"] as Region[]];
    }

    return result;
  }, [matchups]);

  // Initialize bracket data when it becomes available and we're on the client
  useEffect(() => {
    if (isClient && matchups?.length && teams.length && metadata.data.picks) {
      try {
        // Convert NFT picks to UserMatchup format
        const nftUserPicks = metadata.data.picks
          .map((nftPick) => {
            try {
              const userMatchup = convertNFTPickToUserMatchup(
                nftPick,
                teams,
                matchups,
                metadata.data.picks,
              );
              return userMatchup;
            } catch (error) {
              console.error(
                "Error converting NFT pick to UserMatchup:",
                error,
                nftPick,
              );
              return null;
            }
          })
          .filter(Boolean) as UserMatchup[];

        setUserPicks(nftUserPicks);
      } catch (error) {
        console.error("Error processing NFT metadata:", error);
      }
    }
  }, [isClient, matchups, teams, metadata]);

  const [currentMatchupId, setCurrentMatchupId] = useState<number>(1);

  // Update currentMatchupId when userPicks changes
  useEffect(() => {
    if (userPicks.length > 0) {
      setCurrentMatchupId(userPicks[0]?.id ?? 1);
    }
  }, [userPicks]);

  const currentMatchup = useMemo(
    () => userPicks.find((pick) => pick.id === currentMatchupId),
    [userPicks, currentMatchupId],
  );

  // This is a read-only context, so setWinner is a no-op
  const setWinner = (matchupId: number, winnerId: string) => {
    // No-op in read-only mode
  };

  if (!isClient) {
    return null;
  }

  return (
    <NFTBracketContext.Provider
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
    </NFTBracketContext.Provider>
  );
};
