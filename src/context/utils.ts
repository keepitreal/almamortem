import { INITIAL_SEED_PAIRS, RANDOM_ROUND_OF_64 } from "~/constants";
import { generateTeamId } from "~/helpers/generateTeamId";
import type { Matchup, Team, UserMatchup } from "~/types/bracket";

export const getSortedRegionalR64Matchups = (
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

// Helper function to get random teams for matchups
export const getRandomTeamsForMatchup = (
  teams: Team[],
  region: string,
  usedTeamIds: Set<string>,
): [Team, Team] => {
  const availableTeams = teams.filter(
    (team) => team.region === region && !usedTeamIds.has(team.id),
  );

  if (availableTeams.length < 2) {
    throw new Error(`Not enough available teams for region ${region}`);
  }

  // Shuffle the available teams
  const shuffled = [...availableTeams].sort(() => Math.random() - 0.5);

  // Take the first two different teams from the shuffled array
  const topTeam = shuffled[0]!;
  // Find the first team that isn't topTeam
  const bottomTeam = shuffled.find((team) => team.id !== topTeam.id)!;

  if (!bottomTeam) {
    throw new Error(
      `Could not find a different second team for region ${region}`,
    );
  }

  // Mark these teams as used
  usedTeamIds.add(topTeam.id);
  usedTeamIds.add(bottomTeam.id);

  return [topTeam, bottomTeam];
};

const sortNextRoundByPreviousRoundMatchupIds = (
  matchups: Matchup[],
  sortedPreviousRoundNextMatchupIds: number[],
) => {
  return matchups.sort(
    (a, b) =>
      sortedPreviousRoundNextMatchupIds.indexOf(a.id ?? 0) -
      sortedPreviousRoundNextMatchupIds.indexOf(b.id ?? 0),
  );
};

export const getSortedRoundMatchups = (
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

export const initializeUserPicks = (
  matchups: Matchup[],
  teams: Team[],
): UserMatchup[] => {
  const userPicks: UserMatchup[] = [];
  // Track used teams per region to avoid duplicates
  const usedTeamIds = new Set<string>();

  // Handle Round of 64 matchups
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

  const eastTeams = teams.filter((team) => team.region === "East");
  const westTeams = teams.filter((team) => team.region === "West");
  const southTeams = teams.filter((team) => team.region === "South");
  const midwestTeams = teams.filter((team) => team.region === "Midwest");

  const regionPairs: [Matchup[], Team[]][] = [
    [eastMatchupsR64, eastTeams],
    [westMatchupsR64, westTeams],
    [southMatchupsR64, southTeams],
    [midwestMatchupsR64, midwestTeams],
  ];

  console.log({ matchups });

  // Initialize Round of 64 with teams
  regionPairs.forEach(([regionMatchups, regionTeams]) => {
    regionMatchups.forEach((matchup) => {
      if (RANDOM_ROUND_OF_64) {
        // Randomly assign teams for testing
        const [topTeam, bottomTeam] = getRandomTeamsForMatchup(
          regionTeams,
          matchup.region,
          usedTeamIds,
        );
        userPicks.push({
          id: matchup.id,
          round: matchup.round,
          region: matchup.region,
          nextMatchupId: matchup.nextMatchupId,
          previousMatchupIds: matchup.previousMatchupIds,
          potentialSeeds: matchup.potentialSeeds,
          position: matchup.position,
          topTeam: {
            ...topTeam,
            id: generateTeamId(topTeam.region, topTeam.seed).toString(),
            espnId: topTeam.espnId,
          },
          bottomTeam: {
            ...bottomTeam,
            id: generateTeamId(bottomTeam.region, bottomTeam.seed).toString(),
            espnId: bottomTeam.espnId,
          },
          winner: null,
          date: matchup.date,
          time: matchup.time,
          network: matchup.network,
        });
      } else {
        // Use teams already assigned to the matchup
        userPicks.push({
          id: matchup.id,
          round: matchup.round,
          region: matchup.region,
          nextMatchupId: matchup.nextMatchupId,
          position: matchup.position,
          // @ts-expect-error - TODO: fix this
          topTeam: {
            ...matchup.topTeam,
            id: generateTeamId(matchup.topTeam?.region ?? "Midwest", matchup.topTeam?.seed ?? 0).toString(),
            espnId: matchup.topTeam?.espnId,
          },
          // @ts-expect-error - TODO: fix this
          bottomTeam: {
            ...matchup.bottomTeam,
            id: generateTeamId(matchup.bottomTeam?.region ?? "Midwest", matchup.bottomTeam?.seed ?? 0).toString(),
            espnId: matchup.bottomTeam?.espnId,
          },
          potentialSeeds: matchup.potentialSeeds,
          winner: null,
          date: matchup.date,
          time: matchup.time,
          network: matchup.network,
          previousMatchupIds: matchup.previousMatchupIds,
        });
      }
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
    });
  });

  return userPicks;
};
