import axios from "axios";
import fs from "fs";
import path from "path";

interface Team {
  id: string;
  uid: string;
  slug: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name: string;
  nickname: string;
  location: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  isAllStar: boolean;
  logos: Array<{
    href: string;
    alt: string;
    rel: string[];
    width: number;
    height: number;
  }>;
}

interface ESPNResponse {
  sports: Array<{
    leagues: Array<{
      teams: Array<{
        team: Team;
      }>;
    }>;
  }>;
}

async function fetchPage(page: number): Promise<ESPNResponse> {
  const response = await axios.get<ESPNResponse>(
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?page=${page}`,
  );
  return response.data;
}

async function findTeam(
  location?: string,
  mascot?: string,
): Promise<Team | null> {
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`Fetching page ${page}...`);
    const data = await fetchPage(page);

    const teams = data.sports[0]?.leagues[0]?.teams.map((t) => t.team) ?? [];

    if (teams.length === 0) {
      hasMore = false;
      continue;
    }

    const matchingTeam = teams.find((team) => {
      const locationMatch =
        location === undefined ||
        team.location.toLowerCase().includes(location.toLowerCase());
      const mascotMatch =
        mascot === undefined ||
        team.name.toLowerCase().includes(mascot.toLowerCase()) ||
        team.nickname.toLowerCase().includes(mascot.toLowerCase());

      return locationMatch && mascotMatch;
    });

    if (matchingTeam) {
      return matchingTeam;
    }

    page++;
  }

  return null;
}

async function main() {
  const location = process.argv[2];
  const mascot = process.argv[3];

  if (!location && !mascot) {
    console.error("Please provide at least one argument: location or mascot");
    process.exit(1);
  }

  console.log(
    `Searching for team with location: ${location ?? "any"} and mascot: ${mascot ?? "any"}`,
  );

  const team = await findTeam(location, mascot);

  if (team) {
    console.log("Found team:", team.displayName);

    // Create teams directory if it doesn't exist
    const teamsDir = path.join(__dirname, "teams");
    if (!fs.existsSync(teamsDir)) {
      fs.mkdirSync(teamsDir);
    }

    // Save team data to a JSON file
    const filename = `${team.id}.json`;
    const filepath = path.join(teamsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(team, null, 2));
    console.log(`Team data saved to ${filepath}`);
  } else {
    console.log("No matching team found");
  }
}

main().catch(console.error);
