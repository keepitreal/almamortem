import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useMatchups } from "~/hooks/useMatchups";
import { useTeams } from "~/hooks/useTeams";
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

  console.log(
    `Converting pick for matchup ${nftPick.id}, top team: ${nftPick.topTeam.id}, bottom team: ${nftPick.bottomTeam.id}, region: ${originalMatchup.region}`,
  );

  // Find the teams by ID - handle both string and number IDs
  const topTeam =
    teams.find((t) => t.id === Number(nftPick.topTeam.id)) ?? null;
  const bottomTeam =
    teams.find((t) => t.id === Number(nftPick.bottomTeam.id)) ?? null;

  if (!topTeam) {
    console.warn(`Top team with ID ${nftPick.topTeam.id} not found`);
  }

  if (!bottomTeam) {
    console.warn(`Bottom team with ID ${nftPick.bottomTeam.id} not found`);
  }

  // Make sure region is included
  if (!originalMatchup.region) {
    console.warn(`Matchup ${nftPick.id} has no region`);
  }

  return {
    ...originalMatchup,
    topTeam,
    bottomTeam,
    winner: Number(nftPick.winner),
  };
};

interface NFTBracketProviderProps {
  children: React.ReactNode;
  metadata: NFTMetadata;
}

export const NFTBracketProvider: React.FC<NFTBracketProviderProps> = ({
  children,
  metadata,
}) => {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
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
    if (isClient && matchups?.length && teams?.length && metadata.data.picks) {
      console.log("NFTBracketContext: Initializing with metadata", metadata);
      console.log("NFTBracketContext: Teams available", teams.length);
      console.log("NFTBracketContext: Matchups available", matchups.length);

      try {
        // Convert NFT picks to UserMatchup format
        const nftUserPicks = metadata.data.picks
          .map((nftPick) => {
            try {
              const userMatchup = convertNFTPickToUserMatchup(
                nftPick,
                teams,
                matchups,
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

        console.log("NFTBracketContext: Converted picks", nftUserPicks.length);

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
        isLoading: !isClient || isLoadingMatchups || isLoadingTeams,
        regionPairs,
      }}
    >
      {children}
    </NFTBracketContext.Provider>
  );
};
