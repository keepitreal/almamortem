export type RoundName =
  | "Round of 64"
  | "Round of 32"
  | "Sweet 16"
  | "Elite 8"
  | "Final 4"
  | "Championship";

export type Region =
  | "West"
  | "East"
  | "South"
  | "Midwest"
  | "All"
  | "WestMidwest"
  | "SouthEast";

export interface Team {
  id: string;
  name: string;
  mascot: string;
  seed: number;
  region: Region;
  record: string;
  ppg: number;
  oppg: number;
  logoUrl: string;
}

export interface Matchup {
  id: number;
  topTeam: Team | null;
  bottomTeam: Team | null;
  round: RoundName;
  region: Region;
  nextMatchupId: number | null;
  previousMatchupIds: number[];
  position: "top" | "bottom";
  potentialSeeds?: number[]; // Array of possible seed values for this matchup
  date: string;
  time: string;
  network: string;
}

export interface UserMatchup extends Matchup {
  winner: string | null; // Team ID of the winner
}

export type MatchupMap = Record<number, Matchup>;
export type UserMatchupMap = Record<number, UserMatchup>;

export interface BracketState {
  matchups: MatchupMap;
  results: Record<number, Team>;
  currentMatchupId: number;
  currentRound: RoundName;
  isComplete: boolean;
}

export const ROUND_TO_ROUND_ABBREVIATION: Record<RoundName, string> = {
  "Round of 64": "R64",
  "Round of 32": "R32",
  "Sweet 16": "S16",
  "Elite 8": "E8",
  "Final 4": "F4",
  Championship: "Champ",
};

export const regionToUniversityNamesDemo = {
  west: "alabama",
  east: "uconn",
  midwest: "purdue",
  south: "ncstate",
};
