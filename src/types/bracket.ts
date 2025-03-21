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
  | "SouthWest"
  | "EastMidwest";

export interface Team {
  id: number;
  espnId?: string;
  name: string;
  mascot: string;
  location: string;
  seed: number;
  region: Region;
  record: string;
  ppg: number;
  oppg: number;
  logoUrl: string;
  isFirstFour: boolean;
}

export interface Matchup {
  id: number;
  roundId: number;
  topTeam: Team | null;
  topTeamSeed: number | null;
  bottomTeam: Team | null;
  bottomTeamSeed: number | null;
  round: RoundName;
  region: Region;
  nextMatchupId: number | null;
  previousMatchupIds: number[];
  position: "top" | "bottom";
  potentialSeeds?: number[]; // Array of possible seed values for this matchup
  date: string;
  time: string;
  network: string;
  firstFour: Team[];
}

export interface UserMatchup extends Matchup {
  winner: number | null; // Team ID of the winner
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
  "Round of 64": "r64",
  "Round of 32": "r32",
  "Sweet 16": "s16",
  "Elite 8": "e8",
  "Final 4": "f4",
  Championship: "champ",
};

export const regionToUniversityNamesDemo = {
  west: "alabama",
  east: "uconn",
  midwest: "purdue",
  south: "ncstate",
};

export interface NFTPick {
  id: number;
  round: string;
  topTeam: {
    id: string;
  };
  bottomTeam: {
    id: string;
  };
  winner: string;
}

export interface NFTMetadata {
  name: string;
  data: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
    picks: NFTPick[];
  };
}
