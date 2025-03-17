import {
  EVENT_PROGRESSION_2025,
  INITIAL_SEED_PAIRS,
  ROUND_NAME_BY_ROUND_ID,
} from "~/constants";
import { generateTeamId } from "~/helpers/generateTeamId";
import { redis } from "~/lib/redis";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Matchup, Region } from "~/types/bracket";
import { generateTournamentBracket } from "~/utils/generateBracket";

import { getAllTeams } from "./team";

interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  isActive: boolean;
  links: Array<{
    language: string;
    rel: string[];
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  }>;
}

interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: "home" | "away";
  team: ESPNTeam;
  score: string;
  curatedRank: {
    current: number;
  };
  statistics: unknown[];
}

interface ESPNCompetition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: {
    id: string;
    abbreviation: string;
  };
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  competitors: ESPNCompetitor[];
  notes: Array<{
    type: string;
    headline: string;
  }>;
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
  broadcasts: unknown[];
  tournamentId: number;
  format: {
    regulation: {
      periods: number;
    };
  };
  startDate: string;
  broadcast: string;
  geoBroadcasts: unknown[];
  highlights: unknown[];
}

interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
    slug: string;
  };
  competitions: ESPNCompetition[];
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
}

interface ESPNResponse {
  leagues: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    midsizeName: string;
    slug: string;
    season: {
      year: number;
      startDate: string;
      endDate: string;
      displayName: string;
      type: {
        id: string;
        type: number;
        name: string;
        abbreviation: string;
      };
    };
  }>;
  events: ESPNEvent[];
}

interface BracketMatchup {
  id: number;
  nextMatchupId: number | null;
  previousMatchupIds: number[];
  round: number;
  region: Region;
  position: "top" | "bottom";
  topTeamSeed: number | null;
  bottomTeamSeed: number | null;
}

const SEASON = 2025;

type SeasonType = typeof SEASON;

function determineRegionFromNote(note: string): Region | null {
  if (note.includes("South")) return "South";
  if (note.includes("East")) return "East";
  if (note.includes("West")) return "West";
  if (note.includes("Midwest")) return "Midwest";
  return null;
}

function determineRoundFromNote(note: string): Matchup["round"] | null {
  if (note.includes("1st Round")) return "Round of 64";
  if (note.includes("2nd Round")) return "Round of 32";
  if (note.includes("Sweet 16")) return "Sweet 16";
  if (note.includes("Elite 8")) return "Elite 8";
  if (note.includes("Final Four")) return "Final 4";
  if (note.includes("Championship")) return "Championship";
  return null;
}

export function determineRoundIDFromNote(note: string): number | null {
  if (note.includes("1st Round")) return 1;
  if (note.includes("2nd Round")) return 2;
  if (note.includes("Sweet 16")) return 3;
  if (note.includes("Elite 8")) return 4;
  if (note.includes("Final Four")) return 5;
  if (note.includes("Championship")) return 6;
  return null;
}

const SEASON_DATES_2024 = "20240321-20240409&groups=50";
const SEASON_DATES_2025 = "20250320-20250408&groups=50";

const EVENT_PROGRESSION: Record<string, string> =
  SEASON === 2024 ? EVENT_PROGRESSION_2024 : EVENT_PROGRESSION_2025;
const DATES = SEASON === 2024 ? SEASON_DATES_2024 : SEASON_DATES_2025;

// export async function getMatchups(): Promise<{
//   matchupsWithPotentialSeeds: Matchup[];
//   espnTeamIdToDerivedTeamId: Record<string, string>;
// }> {
//   // Try to get cached data with DATES-specific key
//   const cacheKey = `espn-matchups-${DATES}-v2`;
//   // const cachedData = await redis.get<{
//   //   matchupsWithPotentialSeeds: Matchup[];
//   //   espnTeamIdToDerivedTeamId: Record<string, string>;
//   // }>(cacheKey);
//   // if (cachedData) {
//   //   return cachedData;
//   // }

//   const response = await fetch(
//     `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${DATES}`,
//   );

//   if (!response.ok) {
//     throw new Error(`Failed to fetch matchups: ${response.statusText}`);
//   }

//   let data: ESPNResponse;
//   try {
//     data = (await response.json()) as ESPNResponse;
//   } catch (error) {
//     console.error("Error fetching ESPN data:", error);
//     throw error;
//   }

//   const events = data.events ?? [];
//   const espnTeamIdToDerivedTeamId: Record<string, string> = {};

//   const allTeams = await getAllTeams();

//   // Filter out games that are not in the main tournament
//   const mainTournamentEvents = events.filter((event) => {
//     const competition = event.competitions[0];
//     if (!competition?.notes?.length) return false;
//     const note = competition.notes[0]?.headline ?? "";

//     // Check if the note indicates this is a tournament game
//     // Look for "Men's Basketball Championship" in the headline
//     return (
//       note.includes("Men's Basketball Championship") &&
//       !note.includes("First Four")
//     );
//   });

//   // Map the events to our Matchup type with proper nextMatchupId
//   const matchups = mainTournamentEvents.map((event): Matchup => {
//     const competition = event.competitions[0] ?? {
//       notes: [],
//       competitors: [],
//       startDate: "",
//       broadcast: "",
//     };
//     const note = competition.notes[0]?.headline ?? "";
//     const region = determineRegionFromNote(note) ?? "South";
//     const round = determineRoundFromNote(note) ?? "Round of 64";

//     // Get the next event ID from our mapping
//     const nextEventId = event.id ? EVENT_PROGRESSION[event.id] : null;

//     const homeTeamCompetitor = competition.competitors.find(
//       (c) => c.homeAway === "home",
//     );
//     const awayTeamCompetitor = competition.competitors.find(
//       (c) => c.homeAway === "away",
//     );
//     const homeTeam = allTeams.find((t) => t.id === homeTeamCompetitor?.team.id);
//     const awayTeam = allTeams.find((t) => t.id === awayTeamCompetitor?.team.id);

//     // Determine position based on the event's position within its round-region group
//     const eventsInRoundRegion = mainTournamentEvents.filter((e) => {
//       const eNote = e.competitions[0]?.notes[0]?.headline ?? "";
//       const eRegion = determineRegionFromNote(eNote) ?? "South";
//       const eRound = determineRoundFromNote(eNote) ?? "Round of 64";
//       return eRegion === region && eRound === round;
//     });
//     const position =
//       eventsInRoundRegion.indexOf(event) % 2 === 0 ? "top" : "bottom";

//     const matchupId = parseInt(event.id, 10);

//     // Format the date and time from startDate
//     const startDate = competition.startDate
//       ? new Date(competition.startDate)
//       : new Date();
//     const formattedDate = startDate.toLocaleDateString("en-US", {
//       month: "short",
//       day: "numeric",
//     });
//     const formattedTime = startDate.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//     });

//     const derivedHomeTeamId = generateTeamId(
//       region,
//       homeTeamCompetitor?.curatedRank.current ?? 16,
//     );
//     const espnHomeTeamId = homeTeamCompetitor?.team.id;
//     const derivedAwayTeamId = generateTeamId(
//       region,
//       awayTeamCompetitor?.curatedRank.current ?? 16,
//     );
//     const espnAwayTeamId = awayTeamCompetitor?.team.id;

//     if (espnHomeTeamId && !espnTeamIdToDerivedTeamId[espnHomeTeamId]) {
//       espnTeamIdToDerivedTeamId[espnHomeTeamId] = derivedHomeTeamId.toString();
//     }

//     if (espnAwayTeamId && !espnTeamIdToDerivedTeamId[espnAwayTeamId]) {
//       espnTeamIdToDerivedTeamId[espnAwayTeamId] = derivedAwayTeamId.toString();
//     }

//     return {
//       id: matchupId,
//       roundId: round,
//       round: ROUND_NAME_BY_ROUND_ID[round],
//       nextMatchupId: nextEventId ? parseInt(nextEventId, 10) : null,
//       position,
//       previousMatchupIds: [], // We'll fill this in after creating the map
//       topTeam: homeTeam
//         ? {
//             id: derivedHomeTeamId.toString(),
//             espnId: homeTeamCompetitor?.team.id,
//             name: homeTeam.name,
//             mascot: homeTeam.mascot,
//             seed: homeTeamCompetitor?.curatedRank.current ?? 16,
//             region,
//             record: "0-0",
//             ppg: 0,
//             oppg: 0,
//             logoUrl: homeTeam.logoUrl,
//           }
//         : null,
//       bottomTeam: awayTeam
//         ? {
//             id: derivedAwayTeamId.toString(),
//             espnId: awayTeamCompetitor?.team.id,
//             name: awayTeam.name,
//             mascot: awayTeam.mascot,
//             seed: awayTeamCompetitor?.curatedRank.current ?? 16,
//             region,
//             record: "0-0",
//             ppg: 0,
//             oppg: 0,
//             logoUrl: awayTeam.logoUrl,
//           }
//         : null,
//       date: formattedDate,
//       time: formattedTime,
//       network: competition.broadcast || "",
//     };
//   });

//   // Create a map of nextMatchupId to previous matchup IDs
//   const previousMatchupsMap = new Map<number, number[]>();

//   // Build the map in O(n) time
//   matchups.forEach((matchup) => {
//     if (matchup.nextMatchupId !== null) {
//       const prev = previousMatchupsMap.get(matchup.nextMatchupId) ?? [];
//       prev.push(matchup.id);
//       previousMatchupsMap.set(matchup.nextMatchupId, prev);
//     }
//   });

//   // Fill in previousMatchupIds in O(n) time
//   const finalMatchups = matchups.map((matchup) => ({
//     ...matchup,
//     previousMatchupIds: previousMatchupsMap.get(matchup.id) ?? [],
//   }));

//   // Add potentialSeeds to each matchup
//   const matchupsWithPotentialSeeds = addPotentialSeedsToMatchups(finalMatchups);

//   // Create the complete data object
//   const completeData = {
//     matchupsWithPotentialSeeds,
//     espnTeamIdToDerivedTeamId,
//   };

//   // Cache the complete data object
//   // TODO: uncomment this when we want to cache the data
//   // await redis.set(cacheKey, completeData, {
//   //   ex: 300, // 5 minutes in seconds
//   // });

//   return completeData;
// }

async function getMatchupsRevised(): Promise<Matchup[]> {
  // Generate base bracket structure
  const bracketMatchups = generateTournamentBracket() as BracketMatchup[];

  // Fetch ESPN data
  const response = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${DATES}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch matchups: ${response.statusText}`);
  }

  const data = (await response.json()) as ESPNResponse;
  const events = data.events ?? [];

  // Create a map for each region to store seed -> team mappings
  const regionTeamMaps = new Map<
    Region,
    Map<
      number,
      {
        id: string;
        displayName: string;
        name: string;
        mascot: string;
        location: string;
        startDate?: string;
        broadcast?: string;
      }
    >
  >();

  // Initialize maps for each region
  ["West", "East", "South", "Midwest"].forEach((region) => {
    regionTeamMaps.set(region as Region, new Map());
  });

  const tournamentEvents = events.filter((event) => {
    const note = event.competitions[0]?.notes[0]?.headline ?? "";
    return (
      note.includes("Men's Basketball Championship") &&
      !note.includes("First Four")
    );
  });

  console.log(tournamentEvents);

  tournamentEvents.forEach((event) => {
    const note = event.competitions[0]?.notes[0]?.headline ?? "";
    const region = determineRegionFromNote(note);
    const competition = event.competitions[0];

    if (!region) return;

    // Process both competitors
    competition?.competitors.forEach((competitor) => {
      const seed = competitor.curatedRank.current;
      const team = competitor.team;

      // Get the map for this region
      const regionMap = regionTeamMaps.get(region);
      if (!regionMap) return;

      // Store team data by seed within its region
      regionMap.set(seed, {
        id: team.id,
        displayName: team.displayName,
        name: team.name,
        mascot: team.name, // Using team.name as mascot since it's often the mascot name
        location: team.location,
        startDate: competition.startDate,
        broadcast: competition.broadcast,
      });
    });
  });

  // Decorate bracket matchups with team data
  return bracketMatchups.map((matchup): Matchup => {
    const regionMap = regionTeamMaps.get(matchup.region);
    const topTeamData = matchup.topTeamSeed
      ? regionMap?.get(matchup.topTeamSeed)
      : null;
    const bottomTeamData = matchup.bottomTeamSeed
      ? regionMap?.get(matchup.bottomTeamSeed)
      : null;

    // Format date and time if available
    const startDate = topTeamData?.startDate
      ? new Date(topTeamData.startDate)
      : new Date();
    const formattedDate = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      ...matchup,
      roundId: matchup.round,
      round: ROUND_NAME_BY_ROUND_ID[matchup.round],
      position: matchup.position,
      topTeamSeed: matchup.topTeamSeed,
      bottomTeamSeed: matchup.bottomTeamSeed,
      topTeam: topTeamData
        ? {
            id: topTeamData.id,
            espnId: topTeamData.id,
            location: topTeamData.location,
            name: topTeamData.name,
            mascot: topTeamData.mascot,
            seed: matchup.topTeamSeed ?? 16,
            region: matchup.region,
            record: "0-0",
            ppg: 0,
            oppg: 0,
            logoUrl: "",
          }
        : null,
      bottomTeam: bottomTeamData
        ? {
            id: bottomTeamData.id,
            espnId: bottomTeamData.id,
            location: bottomTeamData.location,
            name: bottomTeamData.name,
            mascot: bottomTeamData.mascot,
            seed: matchup.bottomTeamSeed ?? 16,
            region: matchup.region,
            record: "0-0",
            ppg: 0,
            oppg: 0,
            logoUrl: "",
          }
        : null,
      date: formattedDate,
      time: formattedTime,
      network: topTeamData?.broadcast ?? "",
    };
  });
}

export const matchupRouter = createTRPCRouter({
  getAll: publicProcedure.query(async (): Promise<Matchup[]> => {
    return await getMatchupsRevised();
  }),
});

/**
 * Adds potential seeds to each matchup based on their round and previous matchups.
 */
function addPotentialSeedsToMatchups(matchups: Matchup[]): Matchup[] {
  // Create a map for easy lookup of matchups by ID
  const matchupMap = new Map<number, Matchup>();
  matchups.forEach((matchup) => {
    matchupMap.set(matchup.id, matchup);
  });

  // Function to get seeds from a matchup
  const getSeedsFromMatchup = (matchup: Matchup): number[] => {
    // For Round of 64, use seeds from the teams or get from INITIAL_SEED_PAIRS
    if (matchup.round === "Round of 64") {
      const topSeed = matchup.topTeam?.seed;
      const bottomSeed = matchup.bottomTeam?.seed;

      if (topSeed !== undefined && bottomSeed !== undefined) {
        return [topSeed, bottomSeed];
      }

      // If teams don't have seeds, determine based on position in bracket
      // This is a simplified approach - in reality you might want a more robust mapping
      const regionMatchups = matchups.filter(
        (m) => m.region === matchup.region && m.round === "Round of 64",
      );
      const index = regionMatchups.indexOf(matchup);
      if (index >= 0 && index < INITIAL_SEED_PAIRS.length) {
        // Clone the array to avoid mutating the original
        return INITIAL_SEED_PAIRS[index] ? [...INITIAL_SEED_PAIRS[index]] : [];
      }

      return []; // Fallback if no seeds can be determined
    }

    // For later rounds, combine seeds from previous matchups
    const previousMatchups = matchup.previousMatchupIds
      .map((id) => matchupMap.get(id))
      .filter((m): m is Matchup => m !== undefined);

    if (previousMatchups.length === 0) {
      return [];
    }

    // Recursively get seeds from previous matchups
    return previousMatchups
      .flatMap((m) => getSeedsFromMatchup(m))
      .filter((seed, index, self) => self.indexOf(seed) === index) // Remove duplicates
      .sort((a, b) => a - b); // Sort numerically
  };

  // Process all matchups and add potentialSeeds
  return matchups.map((matchup) => {
    const potentialSeeds = getSeedsFromMatchup(matchup);
    return {
      ...matchup,
      potentialSeeds,
    };
  });
}
