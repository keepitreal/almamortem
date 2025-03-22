import {
  FIRST_FOUR_EVENTS_BY_REGION_AND_SEED,
  firstFourAdvancingTeamsEspnIDs,
  ROUND_NAME_BY_ROUND_ID,
} from "~/constants";
import { generateTeamId } from "~/helpers/generateTeamId";
import { redis } from "~/lib/redis";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Matchup, Region, Team } from "~/types/bracket";
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

const DATES = "20250318-20250408&groups=50";

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

  const firstFourTeamMaps = new Map<
    Region,
    Record<
      number,
      {
        id: string;
        displayName: string;
        name: string;
        mascot: string;
        location: string;
      }[]
    >
  >();

  // Initialize maps for each region
  ["West", "East", "South", "Midwest"].forEach((region) => {
    regionTeamMaps.set(region as Region, new Map());
  });

  const tournamentEventsWithFirstFour = events.filter((event) => {
    const note = event.competitions[0]?.notes[0]?.headline ?? "";
    return note.includes("Men's Basketball Championship");
  });

  const tournamentEvents = tournamentEventsWithFirstFour.filter((event) => {
    const note = event.competitions[0]?.notes[0]?.headline ?? "";
    return !note.includes("First Four");
  });

  const firstFourEvents = tournamentEventsWithFirstFour.filter((event) => {
    const note = event.competitions[0]?.notes[0]?.headline ?? "";
    return note.includes("First Four");
  });

  const firstFourEventsByRegion = firstFourEvents.reduce(
    (acc, event) => {
      const note = event.competitions[0]?.notes[0]?.headline ?? "";
      const region = determineRegionFromNote(note);
      if (!region) return acc;
      const events = acc[region] ?? [];
      acc[region] = [...events, event];
      return acc;
    },
    {} as Record<Region, ESPNEvent[]>,
  );

  firstFourTeamMaps.set("South", {});
  firstFourTeamMaps.set("East", {});
  firstFourTeamMaps.set("West", {});
  firstFourTeamMaps.set("Midwest", {});

  Object.entries(firstFourEventsByRegion).forEach(([region, events]) => {
    const regionMap = firstFourTeamMaps.get(region as Region);
    if (!regionMap) return;
    events.forEach((event) => {
      const seed = event.competitions[0]?.competitors[0]?.curatedRank.current;
      const teams = event.competitions[0]?.competitors.map((competitor) => {
        return {
          id: competitor.team.id,
          displayName: competitor.team.displayName,
          name: competitor.team.name,
          mascot: competitor.team.name, // Using team.name as mascot since it's often the mascot name
          location: competitor.team.location,
        };
      });
      regionMap[seed!] = teams!;
    });
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
    const bottomTeamIsFirstFour = Boolean(
      FIRST_FOUR_EVENTS_BY_REGION_AND_SEED[matchup.region ?? "South"][
        matchup.bottomTeamSeed!
      ],
    );

    const topTeamData = matchup.topTeamSeed
      ? regionMap?.get(matchup.topTeamSeed)
      : null;
    const bottomTeamData = matchup.bottomTeamSeed
      ? regionMap?.get(matchup.bottomTeamSeed)
      : null;

    // if (matchup.round === 1) {
    // }
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

    const firstFourTeams = bottomTeamIsFirstFour
      ? firstFourTeamMaps.get(matchup.region as Region)?.[
          matchup.bottomTeamSeed!
        ]
      : [];

    const firstFourTeamsWithData = firstFourTeams?.map((team) => {
      return {
        ...team,
        id: generateTeamId(matchup.region, matchup.bottomTeamSeed ?? 16),
        espnId: team.id,
        location: team.location,
        name: team.name,
        mascot: team.mascot,
        seed: matchup.bottomTeamSeed ?? 16,
        region: matchup.region,
        record: "0-0",
        ppg: 0,
        oppg: 0,
        logoUrl: "",
        isFirstFour: true,
      };
    });

    const firstFourCombinedTeam: Team | null = firstFourTeamsWithData?.length
      ? firstFourTeamsWithData.reduce(
          (acc, team, index) => {
            return {
              ...acc,
              location: index === 0 ? team.location : acc.location,
              mascot: index === 0 ? acc.location : team.location,
              isFirstFour: bottomTeamIsFirstFour,
            };
          },
          {
            id: generateTeamId(matchup.region, matchup.bottomTeamSeed ?? 16),
            espnId: firstFourTeamsWithData[0]?.espnId ?? "",
            name: firstFourTeamsWithData[0]?.name ?? "",
            location: firstFourTeamsWithData[0]?.location ?? "",
            mascot: firstFourTeamsWithData[0]?.mascot ?? "",
            displayName: firstFourTeamsWithData[0]?.displayName ?? "",
            seed: matchup.bottomTeamSeed ?? 16,
            region: matchup.region,
            record: "0-0",
            ppg: 0,
            oppg: 0,
            logoUrl: "",
            isFirstFour: bottomTeamIsFirstFour,
          },
        )
      : null;

    const isFirstFourAdvancingTeam = firstFourAdvancingTeamsEspnIDs.includes(
      bottomTeamData?.id ?? "",
    );

    const useFirstFourCombinedTeam =
      bottomTeamIsFirstFour && !isFirstFourAdvancingTeam;

    const bottomTeam = useFirstFourCombinedTeam
      ? firstFourCombinedTeam
      : bottomTeamData
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
            isFirstFour: false,
          }
        : null;

    return {
      ...matchup,
      roundId: matchup.round,
      round: ROUND_NAME_BY_ROUND_ID[matchup.round]!,
      topTeamSeed: matchup.topTeamSeed,
      bottomTeamSeed: matchup.bottomTeamSeed,
      position: "top", // TODO: don't think we use this
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
            isFirstFour: false,
          }
        : null,
      bottomTeam,
      date: formattedDate,
      time: formattedTime,
      network: topTeamData?.broadcast ?? "",
      firstFour: firstFourTeamsWithData ?? [],
    };
  });
}

export const matchupRouter = createTRPCRouter({
  getAll: publicProcedure.query(async (): Promise<Matchup[]> => {
    // const CACHE_KEY = "matchups";
    // const cachedMatchups = await redis.get<Matchup[]>(CACHE_KEY);
    // if (cachedMatchups) {
    //   return cachedMatchups;
    // }
    const matchups = await getMatchupsRevised();
    // await redis.set(CACHE_KEY, matchups, { ex: 3600 }); // Cache for 5 minutes
    return matchups;
  }),
});
