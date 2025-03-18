import { createThirdwebClient, defineChain, type Hex } from "thirdweb";
import { type Address } from "viem";
import { base, baseSepolia, type Chain } from "wagmi/chains";

import { env } from "~/env";
import type { Region, RoundName } from "~/types/bracket";

export const APP_NAME = "Alma Mortem";
export const APP_DESCRIPTION = "A tribute to the 2025 NCAA Tournament";
export const APP_URL = "https://almamortem.com";
export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [baseSepolia];
export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0];
export const THIRDWEB_CHAIN = defineChain(DEFAULT_CHAIN.id);

export const CLIENT = createThirdwebClient({
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const CHAINLINK_SUBSCRIPTION_ID: Record<number, bigint> = {
  [baseSepolia.id]: 290n,
  [base.id]: 6n,
};
export const CHAINLINK_JOB_ID: Record<number, Hex> = {
  [base.id]:
    "0x66756e2d626173652d6d61696e6e65742d310000000000000000000000000000",
  [baseSepolia.id]:
    "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000",
};
export const CHAINLINK_GAS_LIMIT = 200000;

export const TOURNAMENT_ADDRESS: Record<number, Address> = {
  [base.id]: "0x0000000000000000000000000000000000000000",
  [baseSepolia.id]: "0x69c6eF3Ecaf2f11E3D1409DC39418859bA4A0f9a",
};

export const ORACLE_ADDRESS: Record<number, Address> = {
  [base.id]: "0x0000000000000000000000000000000000000000",
  [baseSepolia.id]: "0x4008119f8E3Dd2a5dC28a04CfF36093c52EB2d17",
};

export const NFT_ADDRESS: Record<number, Address> = {
  [base.id]: "0x0000000000000000000000000000000000000000",
  [baseSepolia.id]: "0xc4C1272A867252876752c2bc7c40867ec4B7F006",
};

export const SEASON = 2025; // 2025
export const RANDOM_ROUND_OF_64 = false; // useful if testing a year where teams arent announced yet

export const INITIAL_SEED_PAIRS = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

export const ROUND_NAME_BY_ROUND_ID: Record<number, RoundName> = {
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite 8",
  5: "Final 4",
  6: "Championship",
};

export const REGION_PAIRS = [
  ["South", "West"],
  ["East", "Midwest"],
];

export const TOP_TEAM_BY_SEED_AND_ROUND = {
  "Round of 32": {
    TOP: [1, 16, 5, 12, 6, 11, 7, 10],
  },
  "Sweet 16": {
    TOP: [1, 16, 8, 9, 6, 11, 3, 14],
  },
  "Elite 8": {
    TOP: [1, 16, 8, 9, 5, 12, 4, 13],
  },
};

export const TOP_TEAM_BY_SEED_AND_ROUND_ID = {
  1: {
    TOP: [1, 8, 5, 4, 6, 3, 7, 2],
  },
  2: {
    TOP: [1, 16, 5, 12, 6, 11, 7, 10],
  },
  3: {
    TOP: [1, 16, 8, 9, 6, 11, 3, 14],
  },
  4: {
    TOP: [1, 16, 8, 9, 5, 12, 4, 13],
  },
};

export const TOP_REGIONS_FOR_FINAL_FOUR = ["South", "East"];
export const TOP_REGIONS_FOR_CHAMPIONSHIP = ["South", "West"];

export const FIRST_FOUR_EVENTS_BY_REGION_AND_SEED: Record<
  Region,
  Record<number, string>
> = {
  South: {
    16: "SFPA VS ALST",
    11: "UNC VS SDSU",
  },
  East: {
    16: "MSM VS AMER",
  },
  Midwest: {
    11: "XAV VS TEX",
  },
  West: {},
  All: {},
  SouthWest: {},
  EastMidwest: {},
};

export const ROUND_NAMES: RoundName[] = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final 4",
  "Championship",
];

// Maps each game to its next game in the tournament progression
// Pattern verified against 2024 tournament data
export const EVENT_PROGRESSION_2025: Record<string, string> = {
  // Round of 64 to Round of 32 - East Region
  "401745974": "401746036", // Game 1 -> Round of 32 Game 1
  "401745972": "401746036", // Game 2 -> Round of 32 Game 1
  "401745970": "401746034", // Game 3 -> Round of 32 Game 2
  "401745968": "401746034", // Game 4 -> Round of 32 Game 2
  "401745966": "401746032", // Game 5 -> Round of 32 Game 3
  "401745963": "401746032", // Game 6 -> Round of 32 Game 3
  "401745959": "401746030", // Game 7 -> Round of 32 Game 4
  "401745957": "401746030", // Game 8 -> Round of 32 Game 4

  // Round of 64 to Round of 32 - West Region
  "401745989": "401746044", // Game 1 -> Round of 32 Game 1
  "401745987": "401746044", // Game 2 -> Round of 32 Game 1
  "401745986": "401746042", // Game 3 -> Round of 32 Game 2
  "401745985": "401746042", // Game 4 -> Round of 32 Game 2
  "401745984": "401746040", // Game 5 -> Round of 32 Game 3
  "401745983": "401746040", // Game 6 -> Round of 32 Game 3
  "401745980": "401746038", // Game 7 -> Round of 32 Game 4
  "401745978": "401746038", // Game 8 -> Round of 32 Game 4

  // Round of 64 to Round of 32 - South Region
  "401746021": "401746054", // Game 1 -> Round of 32 Game 1
  "401746019": "401746054", // Game 2 -> Round of 32 Game 1
  "401746018": "401746052", // Game 3 -> Round of 32 Game 2
  "401746017": "401746052", // Game 4 -> Round of 32 Game 2
  "401746016": "401746050", // Game 5 -> Round of 32 Game 3
  "401746015": "401746050", // Game 6 -> Round of 32 Game 3
  "401746014": "401746049", // Game 7 -> Round of 32 Game 4
  "401746012": "401746049", // Game 8 -> Round of 32 Game 4

  // Round of 64 to Round of 32 - Midwest Region
  "401746009": "401746048", // Game 1 -> Round of 32 Game 1
  "401746007": "401746048", // Game 2 -> Round of 32 Game 1
  "401746005": "401746047", // Game 3 -> Round of 32 Game 2
  "401746003": "401746047", // Game 4 -> Round of 32 Game 2
  "401746001": "401746046", // Game 5 -> Round of 32 Game 3
  "401745999": "401746046", // Game 6 -> Round of 32 Game 3
  "401745997": "401746045", // Game 7 -> Round of 32 Game 4
  "401745995": "401746045", // Game 8 -> Round of 32 Game 4

  // Round of 32 to Sweet 16 - South Region (All Sweet 16 games are in South region)
  // First bracket
  "401746054": "401746061", // Game 1 -> Sweet 16 Game 1
  "401746052": "401746061", // Game 2 -> Sweet 16 Game 1
  "401746050": "401746062", // Game 3 -> Sweet 16 Game 2
  "401746049": "401746062", // Game 4 -> Sweet 16 Game 2

  // Second bracket
  "401746044": "401746063", // Game 1 -> Sweet 16 Game 3
  "401746042": "401746063", // Game 2 -> Sweet 16 Game 3
  "401746040": "401746065", // Game 3 -> Sweet 16 Game 4
  "401746038": "401746065", // Game 4 -> Sweet 16 Game 4

  // Third bracket
  "401746036": "401746069", // Game 1 -> Sweet 16 Game 5
  "401746034": "401746069", // Game 2 -> Sweet 16 Game 5
  "401746032": "401746070", // Game 3 -> Sweet 16 Game 6
  "401746030": "401746070", // Game 4 -> Sweet 16 Game 6

  // Fourth bracket
  "401746048": "401746071", // Game 1 -> Sweet 16 Game 7
  "401746047": "401746071", // Game 2 -> Sweet 16 Game 7
  "401746046": "401746072", // Game 3 -> Sweet 16 Game 8
  "401746045": "401746072", // Game 4 -> Sweet 16 Game 8

  // Sweet 16 to Elite 8 (All in South region)
  "401746061": "401746076", // Sweet 16 Game 1 -> Elite 8 Game 1
  "401746062": "401746076", // Sweet 16 Game 2 -> Elite 8 Game 1
  "401746063": "401746077", // Sweet 16 Game 3 -> Elite 8 Game 2
  "401746065": "401746077", // Sweet 16 Game 4 -> Elite 8 Game 2
  "401746069": "401746078", // Sweet 16 Game 5 -> Elite 8 Game 3
  "401746070": "401746078", // Sweet 16 Game 6 -> Elite 8 Game 3
  "401746071": "401746079", // Sweet 16 Game 7 -> Elite 8 Game 4
  "401746072": "401746079", // Sweet 16 Game 8 -> Elite 8 Game 4

  // Elite 8 to Final Four (South region)
  "401746076": "401746080", // Elite 8 Game 1 -> Final Four Game 1
  "401746077": "401746080", // Elite 8 Game 2 -> Final Four Game 1
  "401746078": "401746081", // Elite 8 Game 3 -> Final Four Game 2
  "401746079": "401746081", // Elite 8 Game 4 -> Final Four Game 2

  // Final Four to Championship
  "401746080": "401746082", // Final Four Game 1 winner -> Championship
  "401746081": "401746082", // Final Four Game 2 winner -> Championship
};

export const EVENT_PROGRESSION_2024 = {
  "401638583": "401638621",
  "401638584": "401638621",
  "401638585": "401638622",
  "401638586": "401638622",
  "401638587": "401638619",
  "401638588": "401638619",
  "401638589": "401638618",
  "401638590": "401638618",
  "401638591": "401638617",
  "401638592": "401638617",
  "401638593": "401638620",
  "401638594": "401638620",
  "401638595": "401638616",
  "401638596": "401638616",
  "401638597": "401638615",
  "401638598": "401638615",
  "401638599": "401638630",
  "401638600": "401638626",
  "401638601": "401638628",
  "401638602": "401638624",
  "401638603": "401638624",
  "401638604": "401638623",
  "401638605": "401638623",
  "401638606": "401638628",
  "401638607": "401638625",
  "401638608": "401638625",
  "401638609": "401638627",
  "401638610": "401638627",
  "401638611": "401638626",
  "401638612": "401638629",
  "401638613": "401638629",
  "401638614": "401638630",
  "401638615": "401638634",
  "401638616": "401638634",
  "401638617": "401638635",
  "401638618": "401638636",
  "401638619": "401638636",
  "401638620": "401638637",
  "401638621": "401638631",
  "401638622": "401638632",
  "401638623": "401638632",
  "401638624": "401638631",
  "401638625": "401638637",
  "401638626": "401638638",
  "401638627": "401638638",
  "401638628": "401638635",
  "401638629": "401638633",
  "401638630": "401638633",
  "401638631": "401638640",
  "401638632": "401638640",
  "401638633": "401638639",
  "401638634": "401638639",
  "401638635": "401638642",
  "401638636": "401638642",
  "401638637": "401638641",
  "401638638": "401638641",
  "401638639": "401638644",
  "401638640": "401638644",
  "401638641": "401638643",
  "401638642": "401638643",
  "401638643": "401638645",
  "401638644": "401638645",
};
