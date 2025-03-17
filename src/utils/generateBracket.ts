import {
  INITIAL_SEED_PAIRS,
  REGION_PAIRS,
  TOP_TEAM_BY_SEED_AND_ROUND_ID,
} from "~/constants";

interface Matchup {
  id: number;
  nextMatchupId: number | null;
  previousMatchupIds: number[];
  round: number; // 1 = Round of 64, 2 = Round of 32, etc.
  region: "West" | "East" | "South" | "Midwest" | "SouthWest" | "EastMidwest";
  topTeamSeed: number | null;
  bottomTeamSeed: number | null;
  potentialSeeds: number[];
}

const REGIONS = ["West", "East", "South", "Midwest"] as const;

// Helper function to get the Final Four matchup region based on REGION_PAIRS
function getFinalFourRegion(
  region: (typeof REGIONS)[number],
): "SouthEast" | "WestMidwest" {
  if (region === "South" || region === "West") return "SouthEast";
  return "WestMidwest";
}

// Helper function to get potential seeds for a matchup
function getPotentialSeeds(
  matchup: Matchup,
  matchupsMap: Map<number, Matchup>,
): number[] {
  // For Round of 64, return the actual seeds
  if (matchup.round === 1) {
    return [matchup.topTeamSeed, matchup.bottomTeamSeed].filter(
      (seed): seed is number => seed !== null,
    );
  }

  // For later rounds, recursively get seeds from previous matchups
  return matchup.previousMatchupIds
    .map((id) => matchupsMap.get(id))
    .filter((m): m is Matchup => m !== undefined)
    .flatMap((m) => getPotentialSeeds(m, matchupsMap))
    .sort((a, b) => a - b);
}

export function generateTournamentBracket(): Matchup[] {
  const matchups: Matchup[] = [];
  let currentId = 1;

  // Generate Round of 64 (32 games)
  // We need to do this for each region (4 regions * 8 games = 32 games)
  for (const [regionIndex, region] of REGIONS.entries()) {
    const regionNumber = (regionIndex + 1) as 1 | 2 | 3 | 4;
    const topTeamSeedsForRegion =
      TOP_TEAM_BY_SEED_AND_ROUND_ID[regionNumber].TOP;
    for (const seedPair of INITIAL_SEED_PAIRS.values()) {
      const seedA = seedPair[0];
      const seedB = seedPair[1];
      const topTeamSeed = topTeamSeedsForRegion.includes(seedA!)
        ? seedA
        : seedB;
      const bottomTeamSeed = topTeamSeedsForRegion.includes(seedA!)
        ? seedB
        : seedA;
      matchups.push({
        id: currentId,
        nextMatchupId: null, // We'll fill this in later
        previousMatchupIds: [],
        round: 1,
        region,
        topTeamSeed: topTeamSeed ?? null,
        bottomTeamSeed: bottomTeamSeed ?? null,
        potentialSeeds: [topTeamSeed, bottomTeamSeed].filter(
          (seed): seed is number => seed !== null,
        ),
      });
      currentId++;
    }
  }

  // Generate subsequent rounds
  // Round 2: 16 games (Round of 32)
  // Round 3: 8 games (Sweet 16)
  // Round 4: 4 games (Elite 8)
  // Round 5: 2 games (Final 4)
  // Round 6: 1 game (Championship)
  for (let round = 2; round <= 6; round++) {
    const gamesInRound = 32 / Math.pow(2, round - 1);
    for (let i = 0; i < gamesInRound; i++) {
      // For Final Four and Championship, use East as default region
      const region =
        round <= 4 ? REGIONS[Math.floor(i / (gamesInRound / 4))]! : "East";
      matchups.push({
        id: currentId,
        nextMatchupId: null,
        previousMatchupIds: [],
        round,
        region,
        topTeamSeed: null,
        bottomTeamSeed: null,
        potentialSeeds: [], // We'll fill this in after connecting matchups
      });
      currentId++;
    }
  }

  // Create a map for easier matchup lookup
  const matchupsMap = new Map(matchups.map((m) => [m.id, m]));

  // Connect matchups by setting nextMatchupId and previousMatchupIds
  for (let round = 1; round <= 5; round++) {
    const matchupsInRound = matchups.filter((m) => m.round === round);
    const nextRoundMatchups = matchups.filter((m) => m.round === round + 1);

    if (round === 4) {
      // Special handling for Elite 8 to Final Four connections
      const regionToMatchupMap = new Map<string, Matchup>();
      matchupsInRound.forEach((matchup) => {
        regionToMatchupMap.set(matchup.region, matchup);
      });

      // Connect based on REGION_PAIRS
      REGION_PAIRS.forEach(([region1, region2], index) => {
        const region1Matchup = regionToMatchupMap.get(
          region1 as (typeof REGIONS)[number],
        );
        const region2Matchup = regionToMatchupMap.get(
          region2 as (typeof REGIONS)[number],
        );
        const finalFourMatchup = nextRoundMatchups[index];

        if (region1Matchup && region2Matchup && finalFourMatchup) {
          // Set next matchup ID for Elite 8 matchups
          region1Matchup.nextMatchupId = finalFourMatchup.id;
          region2Matchup.nextMatchupId = finalFourMatchup.id;

          // Set previous matchup IDs for Final Four matchup
          finalFourMatchup.previousMatchupIds = [
            region1Matchup.id,
            region2Matchup.id,
          ];

          // Set the region for the Final Four matchup
          finalFourMatchup.region =
            `${region1Matchup.region}${region2Matchup.region}` as
              | "SouthWest"
              | "EastMidwest";
        }
      });
    } else {
      // Normal connections for other rounds
      for (let i = 0; i < matchupsInRound.length; i += 2) {
        const nextRoundIndex = Math.floor(i / 2);
        const nextMatchup = nextRoundMatchups[nextRoundIndex];

        if (nextMatchup) {
          // Set next matchup ID for current round matchups
          matchupsInRound[i]!.nextMatchupId = nextMatchup.id;
          matchupsInRound[i + 1]!.nextMatchupId = nextMatchup.id;

          // Set previous matchup IDs for next round matchup
          nextMatchup.previousMatchupIds = [
            matchupsInRound[i]!.id,
            matchupsInRound[i + 1]!.id,
          ];
        }
      }
    }
  }

  // Fill in potential seeds for all matchups after Round of 64
  matchups
    .filter((m) => m.round > 1)
    .forEach((matchup) => {
      matchup.potentialSeeds = getPotentialSeeds(matchup, matchupsMap);
    });

  return matchups;
}

// Helper function to validate the bracket structure
export function validateBracket(matchups: Matchup[]): boolean {
  // Check total number of matchups (should be 63)
  if (matchups.length !== 63) {
    console.error("Invalid number of matchups:", matchups.length);
    return false;
  }

  // Check each matchup
  for (const matchup of matchups) {
    // Check round validity
    if (matchup.round < 1 || matchup.round > 6) {
      console.error("Invalid round number:", matchup);
      return false;
    }

    // Check previous matchup IDs
    if (matchup.round === 1 && matchup.previousMatchupIds.length !== 0) {
      console.error(
        "Round 1 matchup should have no previous matchups:",
        matchup,
      );
      return false;
    }
    if (matchup.round > 1 && matchup.previousMatchupIds.length !== 2) {
      console.error(
        "Non-round 1 matchup should have exactly 2 previous matchups:",
        matchup,
      );
      return false;
    }

    // Check next matchup ID
    if (matchup.round < 6 && matchup.nextMatchupId === null) {
      console.error(
        "Non-championship matchup should have a next matchup:",
        matchup,
      );
      return false;
    }
    if (matchup.round === 6 && matchup.nextMatchupId !== null) {
      console.error(
        "Championship matchup should not have a next matchup:",
        matchup,
      );
      return false;
    }
  }

  return true;
}
