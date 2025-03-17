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

function determineRegionFromNote(note: string): Region | null {
  if (note.includes("South")) return "South";
  if (note.includes("East")) return "East";
  if (note.includes("West")) return "West";
  if (note.includes("Midwest")) return "Midwest";
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

const DATES = "20250320-20250408&groups=50";

async function getMatchupsRevised(): Promise<Matchup[]> {
  // Generate base bracket structure
  const bracketMatchups = generateTournamentBracket();

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
      topTeamSeed: matchup.topTeamSeed,
      bottomTeamSeed: matchup.bottomTeamSeed,
      topTeam: topTeamData
        ? {
            id: generateTeamId(matchup.region, matchup.topTeamSeed ?? 16),
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
            id: generateTeamId(matchup.region, matchup.bottomTeamSeed ?? 16),
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
