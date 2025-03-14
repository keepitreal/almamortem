import { INITIAL_SEED_PAIRS, RANDOM_ROUND_OF_64 } from "~/constants";
import type { Matchup, Team, UserMatchup } from "~/types/bracket";
import { characterById } from "~/constants/characters";

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

// Helper function to get random teams for matchup
export const getRandomTeamsForMatchup = (
  teams: Team[],
  teamsWithCharacters: Team[],
  region: string,
  usedTeamIds: Set<string>,
): [Team, Team] => {
  // First try to get teams with characters
  const availableTeamsWithCharacters = teamsWithCharacters.filter(
    (team) => team.region === region && !usedTeamIds.has(team.id),
  );

  // If we have at least 2 teams with characters available, use those
  if (availableTeamsWithCharacters.length >= 2) {
    const shuffled = [...availableTeamsWithCharacters].sort(
      () => Math.random() - 0.5,
    );
    const topTeam = shuffled[0]!;
    const bottomTeam = shuffled.find((team) => team.id !== topTeam.id)!;

    usedTeamIds.add(topTeam.id);
    usedTeamIds.add(bottomTeam.id);
    return [topTeam, bottomTeam];
  }

  // If we don't have enough teams with characters, fall back to all available teams
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

  console.log({ matchups });
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

  const eastTeamsWithCharacters = eastTeams.filter((team) => {
    const character = characterById[parseInt(team.id)];
    return !!character;
  });

  const westTeamsWithCharacters = westTeams.filter((team) => {
    const character = characterById[parseInt(team.id)];
    return !!character;
  });

  const southTeamsWithCharacters = southTeams.filter((team) => {
    const character = characterById[parseInt(team.id)];
    return !!character;
  });

  const midwestTeamsWithCharacters = midwestTeams.filter((team) => {
    const character = characterById[parseInt(team.id)];
    return !!character;
  });

  const regionPairs: [Matchup[], Team[], Team[]][] = [
    [eastMatchupsR64, eastTeams, eastTeamsWithCharacters],
    [westMatchupsR64, westTeams, westTeamsWithCharacters],
    [southMatchupsR64, southTeams, southTeamsWithCharacters],
    [midwestMatchupsR64, midwestTeams, midwestTeamsWithCharacters],
  ];

  // Initialize Round of 64 with teams
  regionPairs.forEach(
    ([regionMatchups, regionTeams, regionTeamsWithCharacters]) => {
      regionMatchups.forEach((matchup) => {
        if (RANDOM_ROUND_OF_64) {
          // Randomly assign teams for testing
          const [topTeam, bottomTeam] = getRandomTeamsForMatchup(
            regionTeams,
            regionTeamsWithCharacters ?? [],
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
            topTeam,
            bottomTeam,
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
            topTeam: matchup.topTeam,
            bottomTeam: matchup.bottomTeam,
            potentialSeeds: matchup.potentialSeeds,
            winner: null,
            date: matchup.date,
            time: matchup.time,
            network: matchup.network,
            previousMatchupIds: matchup.previousMatchupIds,
          });
        }
      });
    },
  );

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
