import { INITIAL_SEED_PAIRS } from "~/constants";
import type { Matchup, UserMatchup } from "~/types/bracket";

const getSortedRegionalR64Matchups = (
  matchups: Matchup[],
  roundName: Matchup["round"],
  regionName: Matchup["region"],
) => {
  const initialSeedToIndex = new Map(
    INITIAL_SEED_PAIRS.flatMap((seeds, index) => {
      return seeds.map((seed) => [seed, index]);
    }),
  );

  return matchups
    .filter(
      (matchup) => matchup.round === roundName && matchup.region === regionName,
    )
    .sort((a, b) => {
      const aIndex = initialSeedToIndex.get(a.topTeam?.seed ?? 0);
      const bIndex = initialSeedToIndex.get(b.topTeam?.seed ?? 0);
      return (aIndex ?? 0) - (bIndex ?? 0);
    });
};

const getSortedRoundMatchups = (
  matchups: Matchup[],
  roundName: Matchup["round"],
  regionName: Matchup["region"],
  previousRoundSortedMatchupsForRegion: Matchup[],
) => {
  const previousRoundSortedNextMatchupIds =
    previousRoundSortedMatchupsForRegion.map(
      (matchup) => matchup.nextMatchupId,
    );
  return matchups
    .filter(
      (matchup) => matchup.round === roundName && matchup.region === regionName,
    )
    .sort(
      (a, b) =>
        previousRoundSortedNextMatchupIds.indexOf(a.id ?? 0) -
        previousRoundSortedNextMatchupIds.indexOf(b.id ?? 0),
    );
};

export const initializeUserPicks = (matchups: Matchup[]): UserMatchup[] => {
  const userPicks: UserMatchup[] = [];
  // Track used teams per region to avoid duplicates
  const eastMatchupsR64 = getSortedRegionalR64Matchups(
    matchups,
    "Round of 64",
    "East",
  );
  const westMatchupsR64 = getSortedRegionalR64Matchups(
    matchups,
    "Round of 64",
    "West",
  );
  const southMatchupsR64 = getSortedRegionalR64Matchups(
    matchups,
    "Round of 64",
    "South",
  );
  const midwestMatchupsR64 = getSortedRegionalR64Matchups(
    matchups,
    "Round of 64",
    "Midwest",
  );

  const regionPairs: Matchup[][] = [
    eastMatchupsR64,
    westMatchupsR64,
    southMatchupsR64,
    midwestMatchupsR64,
  ];

  // Initialize Round of 64 with teams
  regionPairs.forEach((regionMatchups) => {
    regionMatchups.forEach((matchup) => {
      // Use teams already assigned to the matchup
      userPicks.push({
        id: matchup.id,
        round: matchup.round,
        region: matchup.region,
        nextMatchupId: matchup.nextMatchupId,
        position: matchup.position,
        topTeam: matchup.topTeam,
        bottomTeam: matchup.bottomTeam,
        potentialSeeds: matchup.potentialSeeds,
        winner: null,
        date: matchup.date,
        time: matchup.time,
        network: matchup.network,
        previousMatchupIds: matchup.previousMatchupIds,
        topTeamSeed: matchup.topTeamSeed,
        bottomTeamSeed: matchup.bottomTeamSeed,
        roundId: matchup.roundId,
        firstFour: matchup.firstFour,
      });
    });
  });

  // Add remaining rounds (Round of 32 through Championship) with empty teams
  const eastR32SortedMatchups = getSortedRoundMatchups(
    matchups,
    "Round of 32",
    "East",
    eastMatchupsR64,
  );
  const westR32SortedMatchups = getSortedRoundMatchups(
    matchups,
    "Round of 32",
    "West",
    westMatchupsR64,
  );
  const southR32SortedMatchups = getSortedRoundMatchups(
    matchups,
    "Round of 32",
    "South",
    southMatchupsR64,
  );
  const midwestR32SortedMatchups = getSortedRoundMatchups(
    matchups,
    "Round of 32",
    "Midwest",
    midwestMatchupsR64,
  );

  const s16EastSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Sweet 16",
    "East",
    eastR32SortedMatchups,
  );
  const s16WestSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Sweet 16",
    "West",
    westR32SortedMatchups,
  );
  const s16SouthSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Sweet 16",
    "South",
    southR32SortedMatchups,
  );
  const s16MidwestSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Sweet 16",
    "Midwest",
    midwestR32SortedMatchups,
  );

  const e8EastSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Elite 8",
    "East",
    s16EastSortedMatchups,
  );
  const e8WestSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Elite 8",
    "West",
    s16WestSortedMatchups,
  );
  const e8SouthSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Elite 8",
    "South",
    s16SouthSortedMatchups,
  );
  const e8MidwestSortedMatchups = getSortedRoundMatchups(
    matchups,
    "Elite 8",
    "Midwest",
    s16MidwestSortedMatchups,
  );

  const remainingMatchups = matchups.filter(
    (matchup) =>
      matchup.round !== "Round of 64" &&
      matchup.round !== "Round of 32" &&
      matchup.round !== "Sweet 16" &&
      matchup.round !== "Elite 8",
  );

  const allSortedMatchups = [
    ...eastR32SortedMatchups,
    ...westR32SortedMatchups,
    ...southR32SortedMatchups,
    ...midwestR32SortedMatchups,
    ...s16EastSortedMatchups,
    ...s16WestSortedMatchups,
    ...s16SouthSortedMatchups,
    ...s16MidwestSortedMatchups,
    ...e8EastSortedMatchups,
    ...e8WestSortedMatchups,
    ...e8SouthSortedMatchups,
    ...e8MidwestSortedMatchups,
    ...remainingMatchups,
  ];

  allSortedMatchups.forEach((matchup) => {
    userPicks.push({
      id: matchup.id,
      round: matchup.round,
      region: matchup.region,
      nextMatchupId: matchup.nextMatchupId,
      previousMatchupIds: matchup.previousMatchupIds,
      potentialSeeds: matchup.potentialSeeds,
      position: matchup.position,
      topTeam: null,
      bottomTeam: null,
      winner: null,
      date: matchup.date,
      time: matchup.time,
      network: matchup.network,
      roundId: matchup.roundId,
      topTeamSeed: matchup.topTeamSeed,
      bottomTeamSeed: matchup.bottomTeamSeed,
      firstFour: matchup.firstFour,
    });
  });

  return userPicks;
};
