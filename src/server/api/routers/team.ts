import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Team } from "~/types/bracket";

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
  return allTeams.map((espnTeam): Team => {
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
}

export const teamRouter = createTRPCRouter({
  getAll: publicProcedure.query(async (): Promise<Team[]> => {
    return getAllTeams();
  }),

  // Add additional procedures here as needed, for example:
  getByRegion: publicProcedure
    .input(z.object({ region: z.enum(regions) }))
    .query(async ({ input }): Promise<Team[]> => {
      const allTeams = await getAllTeams();
      return allTeams.filter((team) => team.region === input.region);
    }),
});
