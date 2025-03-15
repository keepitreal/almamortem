import { z } from "zod";

import { redis } from "~/lib/redis";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Team } from "~/types/bracket";
import { getMatchups } from "./matchup";
interface ESPNTeamLogo {
  href: string;
  alt: string;
  rel: string[];
  width: number;
  height: number;
}

interface ESPNTeam {
  team: {
    id: string;
    displayName: string;
    nickname: string;
    name: string;
    location: string;
    logos: ESPNTeamLogo[];
  };
}

interface ESPNResponse {
  sports: Array<{
    leagues: Array<{
      teams: ESPNTeam[];
    }>;
  }>;
}

const regions = ["West", "East", "South", "Midwest"] as const;

export async function getAllTeams(): Promise<Team[]> {
  // Try to get cached data
  const cachedTeams = await redis.get<Team[]>("espn-teams");
  if (cachedTeams) {
    return cachedTeams;
  }

  let allTeams: ESPNTeam[] = [];
  let page = 0;
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?page=${page}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.statusText}`);
    }

    const data = (await response.json()) as ESPNResponse;
    const pageTeams = data.sports[0]?.leagues[0]?.teams ?? [];

    if (pageTeams.length === 0) {
      hasMorePages = false;
    } else {
      allTeams = [...allTeams, ...pageTeams];
      page++;
    }
  }

  // Transform ESPN team data to our Team interface
  const teams = allTeams.map((espnTeam): Team => {
    const team = espnTeam.team;
    const defaultLogo =
      team.logos.find((logo) => logo.rel.includes("default"))?.href ?? "";

    // Extract seed from team name if available (e.g., "1 Duke Blue Devils")
    const seedRegex = /^(\d+)\s/;
    const seedMatch = seedRegex.exec(team.displayName ?? "");
    const seed = seedMatch ? parseInt(seedMatch[1]!, 10) : 16; // Default to 16 if no seed found

    // Ensure we always get a valid region by using modulo
    const regionIndex = Math.abs(parseInt(team.id, 10)) % regions.length;
    const region = regions[regionIndex]!;

    return {
      id: team.id,
      name: team.location,
      mascot: team.name,
      seed,
      region,
      record: "0-0", // This would need to be fetched from a different endpoint
      ppg: 0, // This would need to be fetched from a different endpoint
      oppg: 0, // This would need to be fetched from a different endpoint
      logoUrl: defaultLogo,
    };
  });

  // Cache the results for 1 hour
  await redis.set("espn-teams", teams, {
    ex: 3600, // 1 hour in seconds
  });

  return teams;
}

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async (): Promise<Team[]> => {
    console.log("Fetching matchups for team mapping...");
    const { espnTeamIdToDerivedTeamId } = await getMatchups();
    console.log("Team ID mapping:", {
      hasMappings: Boolean(espnTeamIdToDerivedTeamId),
      mappingCount: Object.keys(espnTeamIdToDerivedTeamId || {}).length,
    });

    console.log("Fetching all teams...");
    const teams = await getAllTeams();
    console.log("Teams fetched:", {
      teamsLength: teams.length,
      firstTeamId: teams[0]?.id,
      firstTeamName: teams[0]?.name,
    });

    return teams.map((team) => {
      const derivedId = espnTeamIdToDerivedTeamId?.[team.id];
      const finalId = derivedId ?? `${team.id}:${team.name}`;

      return {
        ...team,
        // prevents teams that are not in the tournament from sharing an id with teams that are in the tournament
        id: finalId,
      };
    });
  }),

  // Add additional procedures here as needed, for example:
  getByRegion: publicProcedure
    .input(z.object({ region: z.enum(regions) }))
    .query(async ({ input }): Promise<Team[]> => {
      const allTeams = await getAllTeams();
      return allTeams.filter((team) => team.region === input.region);
    }),
});
