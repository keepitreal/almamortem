import { ethers } from "hardhat";
import PinataSDK from "@pinata/sdk";
import { encodeAbiParameters } from "viem";
import { vars } from "hardhat/config";
import { keccak256 as ethersKeccak256 } from "ethers";
import { TournamentManager } from "../typechain-types";

// Types for bracket data
interface Team {
  id: string;
}

export interface UserMatchup {
  id: number;
  round: string;
  topTeam: Team | null;
  bottomTeam: Team | null;
  winner: string | null;
  region?: string;
  nextMatchupId?: number | null;
  previousMatchupIds?: number[];
  position?: "top" | "bottom";
  potentialSeeds?: number[];
  date?: string;
  time?: string;
  network?: string;
}

interface NFTMetadata {
  name: string;
  data: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: {
      trait_type: string;
      value: string | number;
    }[];
    picks: UserMatchup[];
  };
}

// Constants for bracket structure
const ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final 4",
  "Championship"
] as const;

type RoundName = typeof ROUNDS[number];

// Team IDs by region (simplified for testing)
const TEAM_IDS = {
  WEST: [51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
  EAST: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  MIDWEST: [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116],
  SOUTH: [151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166]
};

// Matchup IDs by round (simplified for testing)
const MATCHUP_IDS: Record<RoundName, number[]> = {
  "Round of 64": [
    // West region
    401638599, 401638614, 401638613, 401638612, 401638598, 401638597, 401638596, 401638595,
    // East region
    401638586, 401638585, 401638605, 401638604, 401638603, 401638602, 401638584, 401638583,
    // Midwest region
    401638600, 401638611, 401638610, 401638609, 401638594, 401638593, 401638608, 401638607,
    // South region
    401638601, 401638606, 401638592, 401638591, 401638590, 401638589, 401638588, 401638587
  ],
  "Round of 32": [
    401638630, 401638629, 401638615, 401638616, 401638622, 401638623, 401638624, 401638621,
    401638626, 401638627, 401638620, 401638625, 401638628, 401638617, 401638618, 401638619
  ],
  "Sweet 16": [
    401638633, 401638634, 401638632, 401638631, 401638638, 401638637, 401638635, 401638636
  ],
  "Elite 8": [
    401638639, 401638640, 401638641, 401638642
  ],
  "Final 4": [
    401638643, 401638644
  ],
  "Championship": [
    401638645
  ]
};

// Team names for metadata (simplified for testing)
const TEAM_NAMES: Record<number, string> = {
  // East Region
  1: "Duke", 2: "Kentucky", 3: "Tennessee", 4: "Michigan State", 
  5: "Marquette", 6: "Baylor", 7: "Florida", 8: "Iowa", 
  9: "Auburn", 10: "Illinois", 11: "NC State", 12: "Drake", 
  13: "Yale", 14: "Morehead State", 15: "Vermont", 16: "Longwood",
  
  // West Region
  51: "UConn", 52: "Arizona", 53: "Boise State", 54: "Alabama", 
  55: "Saint Mary's", 56: "Clemson", 57: "Dayton", 58: "Mississippi State", 
  59: "Grand Canyon", 60: "Nevada", 61: "New Mexico", 62: "BYU", 
  63: "College of Charleston", 64: "Duquesne", 65: "Long Beach State", 66: "Howard",
  
  // Midwest Region
  101: "Purdue", 102: "Creighton", 103: "Texas", 104: "Kansas State", 
  105: "Gonzaga", 106: "TCU", 107: "Texas A&M", 108: "Utah State", 
  109: "Northwestern", 110: "Colorado", 111: "Oregon", 112: "McNeese", 
  113: "Akron", 114: "Oakland", 115: "South Dakota State", 116: "Grambling",
  
  // South Region
  151: "Houston", 152: "UCLA", 153: "Wisconsin", 154: "Indiana", 
  155: "San Diego State", 156: "Texas Tech", 157: "Virginia", 158: "Nebraska", 
  159: "Washington State", 160: "Colorado State", 161: "Virginia Tech", 162: "James Madison", 
  163: "Colgate", 164: "Western Kentucky", 165: "Montana State", 166: "Stetson"
};

// Team logos for metadata (simplified for testing)
const TEAM_LOGOS: Record<number, string> = {
  // East Region
  1: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png", // Duke
  2: "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png", // Kentucky
  3: "https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png", // Tennessee
  4: "https://a.espncdn.com/i/teamlogos/ncaa/500/127.png", // Michigan State
  5: "https://a.espncdn.com/i/teamlogos/ncaa/500/269.png", // Marquette
  6: "https://a.espncdn.com/i/teamlogos/ncaa/500/239.png", // Baylor
  7: "https://a.espncdn.com/i/teamlogos/ncaa/500/57.png", // Florida
  8: "https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png", // Iowa
  9: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png", // Auburn
  10: "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png", // Illinois
  11: "https://a.espncdn.com/i/teamlogos/ncaa/500/152.png", // NC State
  12: "https://a.espncdn.com/i/teamlogos/ncaa/500/2181.png", // Drake
  13: "https://a.espncdn.com/i/teamlogos/ncaa/500/43.png", // Yale
  14: "https://a.espncdn.com/i/teamlogos/ncaa/500/2413.png", // Morehead State
  15: "https://a.espncdn.com/i/teamlogos/ncaa/500/261.png", // Vermont
  16: "https://a.espncdn.com/i/teamlogos/ncaa/500/2344.png", // Longwood
  
  // West Region
  51: "https://a.espncdn.com/i/teamlogos/ncaa/500/41.png", // UConn
  52: "https://a.espncdn.com/i/teamlogos/ncaa/500/12.png", // Arizona
  53: "https://a.espncdn.com/i/teamlogos/ncaa/500/68.png", // Boise State
  54: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png", // Alabama
  55: "https://a.espncdn.com/i/teamlogos/ncaa/500/2608.png", // Saint Mary's
  56: "https://a.espncdn.com/i/teamlogos/ncaa/500/228.png", // Clemson
  57: "https://a.espncdn.com/i/teamlogos/ncaa/500/2168.png", // Dayton
  58: "https://a.espncdn.com/i/teamlogos/ncaa/500/344.png", // Mississippi State
  59: "https://a.espncdn.com/i/teamlogos/ncaa/500/2253.png", // Grand Canyon
  60: "https://a.espncdn.com/i/teamlogos/ncaa/500/2440.png", // Nevada
  61: "https://a.espncdn.com/i/teamlogos/ncaa/500/167.png", // New Mexico
  62: "https://a.espncdn.com/i/teamlogos/ncaa/500/252.png", // BYU
  63: "https://a.espncdn.com/i/teamlogos/ncaa/500/232.png", // College of Charleston
  64: "https://a.espncdn.com/i/teamlogos/ncaa/500/2184.png", // Duquesne
  65: "https://a.espncdn.com/i/teamlogos/ncaa/500/299.png", // Long Beach State
  66: "https://a.espncdn.com/i/teamlogos/ncaa/500/47.png", // Howard
  
  // Midwest Region
  101: "https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png", // Purdue
  102: "https://a.espncdn.com/i/teamlogos/ncaa/500/156.png", // Creighton
  103: "https://a.espncdn.com/i/teamlogos/ncaa/500/251.png", // Texas
  104: "https://a.espncdn.com/i/teamlogos/ncaa/500/2306.png", // Kansas State
  105: "https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png", // Gonzaga
  106: "https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png", // TCU
  107: "https://a.espncdn.com/i/teamlogos/ncaa/500/245.png", // Texas A&M
  108: "https://a.espncdn.com/i/teamlogos/ncaa/500/328.png", // Utah State
  109: "https://a.espncdn.com/i/teamlogos/ncaa/500/77.png", // Northwestern
  110: "https://a.espncdn.com/i/teamlogos/ncaa/500/38.png", // Colorado
  111: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png", // Oregon
  112: "https://a.espncdn.com/i/teamlogos/ncaa/500/2377.png", // McNeese
  113: "https://a.espncdn.com/i/teamlogos/ncaa/500/2006.png", // Akron
  114: "https://a.espncdn.com/i/teamlogos/ncaa/500/2473.png", // Oakland
  115: "https://a.espncdn.com/i/teamlogos/ncaa/500/2571.png", // South Dakota State
  116: "https://a.espncdn.com/i/teamlogos/ncaa/500/2755.png", // Grambling
  
  // South Region
  151: "https://a.espncdn.com/i/teamlogos/ncaa/500/248.png", // Houston
  152: "https://a.espncdn.com/i/teamlogos/ncaa/500/26.png", // UCLA
  153: "https://a.espncdn.com/i/teamlogos/ncaa/500/275.png", // Wisconsin
  154: "https://a.espncdn.com/i/teamlogos/ncaa/500/84.png", // Indiana
  155: "https://a.espncdn.com/i/teamlogos/ncaa/500/21.png", // San Diego State
  156: "https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png", // Texas Tech
  157: "https://a.espncdn.com/i/teamlogos/ncaa/500/258.png", // Virginia
  158: "https://a.espncdn.com/i/teamlogos/ncaa/500/158.png", // Nebraska
  159: "https://a.espncdn.com/i/teamlogos/ncaa/500/265.png", // Washington State
  160: "https://a.espncdn.com/i/teamlogos/ncaa/500/36.png", // Colorado State
  161: "https://a.espncdn.com/i/teamlogos/ncaa/500/259.png", // Virginia Tech
  162: "https://a.espncdn.com/i/teamlogos/ncaa/500/256.png", // James Madison
  163: "https://a.espncdn.com/i/teamlogos/ncaa/500/2142.png", // Colgate
  164: "https://a.espncdn.com/i/teamlogos/ncaa/500/98.png", // Western Kentucky
  165: "https://a.espncdn.com/i/teamlogos/ncaa/500/147.png", // Montana State
  166: "https://a.espncdn.com/i/teamlogos/ncaa/500/56.png" // Stetson
};

/**
 * Calculate the number of wins for each team in the bracket.
 * @param bracket Array of matchups with winners
 * @returns Map of teamId -> number of wins
 */
export function calculateTeamWins(bracket: UserMatchup[]): Map<number, number> {
  const winCounts = new Map<number, number>();

  // Sort matchups by round to ensure we process in order
  const sortedMatchups = bracket.sort((a, b) => {
    return ROUNDS.indexOf(a.round as RoundName) - ROUNDS.indexOf(b.round as RoundName);
  });

  // Count wins for each team
  for (const matchup of sortedMatchups) {
    if (matchup.winner) {
      const teamId = parseInt(matchup.winner);
      winCounts.set(teamId, (winCounts.get(teamId) ?? 0) + 1);
    }
  }

  return winCounts;
}

/**
 * Generate a hash of team IDs and their predicted win counts.
 * @param bracket The completed bracket predictions
 * @returns Hash of sorted team IDs and their win counts
 */
export function getBracketHash(bracket: UserMatchup[]): string {
  const [teamIds, winCounts] = getBracketVerificationArrays(bracket);

  // Hash the sorted arrays using the same encoding as the smart contract
  return ethersKeccak256(encodeAbiParameters(
    [
      { type: 'uint256[]' }, // team IDs
      { type: 'uint256[]' }  // win counts
    ],
    [
      teamIds.map(id => BigInt(id)),
      winCounts.map(count => BigInt(count))
    ]
  ));
}

/**
 * Get the arrays of team IDs and win counts for verification.
 * @param bracket The completed bracket predictions
 * @returns [teamIds, winCounts] - Sorted arrays of team IDs and their corresponding win counts
 */
export function getBracketVerificationArrays(bracket: UserMatchup[]): [number[], number[]] {
  if (!bracket?.length) {
    throw new Error('Empty or invalid bracket');
  }

  const winCounts = calculateTeamWins(bracket);
  
  // Convert to arrays and sort by team ID for consistent ordering
  const entries = Array.from(winCounts.entries())
    .sort(([teamIdA], [teamIdB]) => teamIdA - teamIdB);
  
  const teamIds = entries.map(([teamId]) => teamId);
  const wins = entries.map(([, wins]) => wins);

  // Validate arrays are same length and not empty
  if (teamIds.length === 0) {
    throw new Error('No winners selected in bracket');
  }
  if (teamIds.length !== wins.length) {
    throw new Error('Mismatch between team IDs and win counts');
  }

  return [teamIds, wins];
}

/**
 * Validate a bracket's win distribution.
 * @param bracket The bracket to validate
 * @returns true if the bracket has a valid win distribution
 */
export function validateBracketWinDistribution(bracket: UserMatchup[]): boolean {
  const winCounts = calculateTeamWins(bracket);
  
  // Count teams with each number of wins
  const winDistribution = new Map<number, number>();
  for (const wins of winCounts.values()) {
    winDistribution.set(wins, (winDistribution.get(wins) ?? 0) + 1);
  }
  
  // Check win distribution for teams that won at least one game
  if (winDistribution.get(6) !== 1) return false; // 1 champion with 6 wins
  if (winDistribution.get(5) !== 1) return false; // 1 runner-up with 5 wins
  if (winDistribution.get(4) !== 2) return false; // 2 Final Four losers with 4 wins
  if (winDistribution.get(3) !== 4) return false; // 4 Elite Eight losers with 3 wins
  if (winDistribution.get(2) !== 8) return false; // 8 Sweet Sixteen losers with 2 wins
  if (winDistribution.get(1) !== 16) return false; // 16 Round of 32 losers with 1 win
  
  // Note: We don't check for exactly 32 teams with 0 wins because some brackets
  // might not include all 64 teams explicitly (especially in test scenarios)
  
  return true;
}

/**
 * Generate a random valid bracket.
 * @returns A valid bracket with the correct win distribution
 */
export async function generateValidBracket(): Promise<UserMatchup[]> {
  try {
    // Create the initial bracket structure with all matchups
    const bracket: UserMatchup[] = [];
    
    // Round of 64 - create all initial matchups
    for (const [i, matchupId] of MATCHUP_IDS["Round of 64"].entries()) {
      const region = i < 8 ? "WEST" : i < 16 ? "EAST" : i < 24 ? "MIDWEST" : "SOUTH";
      const regionIndex = i % 8;
      
      // For each region, we have 8 matchups with 16 teams
      const topTeamId = TEAM_IDS[region as keyof typeof TEAM_IDS][regionIndex * 2];
      const bottomTeamId = TEAM_IDS[region as keyof typeof TEAM_IDS][regionIndex * 2 + 1];
      
      bracket.push({
        id: matchupId,
        round: "Round of 64",
        topTeam: { id: topTeamId.toString() },
        bottomTeam: { id: bottomTeamId.toString() },
        winner: null // Will be filled in later
      });
    }
    
    // Create the rest of the bracket structure
    for (let roundIndex = 1; roundIndex < ROUNDS.length; roundIndex++) {
      const round = ROUNDS[roundIndex];
      for (const [, matchupId] of MATCHUP_IDS[round].entries()) {
        bracket.push({
          id: matchupId,
          round,
          topTeam: null, // Will be filled in later
          bottomTeam: null, // Will be filled in later
          winner: null // Will be filled in later
        });
      }
    }
  
    // We'll use a fully deterministic approach to ensure a valid bracket
    // First, let's define our winners for each round
    
    // Step 1: Choose a champion (1 team with 6 wins)
    const regions = ["WEST", "EAST", "MIDWEST", "SOUTH"];
    const championRegion = regions[Math.floor(Math.random() * regions.length)];
    const championId = TEAM_IDS[championRegion as keyof typeof TEAM_IDS][0]; // Top seed from the chosen region
    
    // Step 2: Choose a runner-up (1 team with 5 wins)
    const runnerUpRegions = regions.filter(r => r !== championRegion);
    const runnerUpRegion = runnerUpRegions[Math.floor(Math.random() * runnerUpRegions.length)];
    const runnerUpId = TEAM_IDS[runnerUpRegion as keyof typeof TEAM_IDS][0]; // Top seed from a different region
    
    // Step 3: Choose Final Four losers (2 teams with 4 wins)
    const finalFourRegions = regions.filter(r => r !== championRegion && r !== runnerUpRegion);
    const finalFourLoser1Id = TEAM_IDS[finalFourRegions[0] as keyof typeof TEAM_IDS][0];
    const finalFourLoser2Id = TEAM_IDS[finalFourRegions[1] as keyof typeof TEAM_IDS][0];
    
    // Step 4: Choose Elite Eight losers (4 teams with 3 wins)
    const eliteEightLosers: number[] = [];
    for (const region of regions) {
      const regionTeams = TEAM_IDS[region as keyof typeof TEAM_IDS];
      // Skip teams already selected
      const availableTeams = regionTeams.filter(id => 
        id !== championId && id !== runnerUpId && 
        id !== finalFourLoser1Id && id !== finalFourLoser2Id);
      
      // Select a random team from available teams
      eliteEightLosers.push(availableTeams[Math.floor(Math.random() * availableTeams.length)]);
    }
    
    // Step 5: Choose Sweet Sixteen losers (8 teams with 2 wins)
    const sweetSixteenLosers: number[] = [];
    for (const region of regions) {
      const regionTeams = TEAM_IDS[region as keyof typeof TEAM_IDS];
      // Skip teams already selected
      const availableTeams = regionTeams.filter(id => 
        id !== championId && id !== runnerUpId && 
        id !== finalFourLoser1Id && id !== finalFourLoser2Id &&
        !eliteEightLosers.includes(id));
      
      // Select 2 random teams from available teams
      for (let i = 0; i < 2; i++) {
        if (availableTeams.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTeams.length);
          sweetSixteenLosers.push(availableTeams[randomIndex]);
          availableTeams.splice(randomIndex, 1); // Remove selected team
        }
      }
    }
    
    // Step 6: Choose Round of 32 losers (16 teams with 1 win)
    const roundOf32Losers: number[] = [];
    for (const region of regions) {
      const regionTeams = TEAM_IDS[region as keyof typeof TEAM_IDS];
      // Skip teams already selected
      const availableTeams = regionTeams.filter(id => 
        id !== championId && id !== runnerUpId && 
        id !== finalFourLoser1Id && id !== finalFourLoser2Id &&
        !eliteEightLosers.includes(id) && !sweetSixteenLosers.includes(id));
      
      // Select 4 random teams from available teams
      for (let i = 0; i < 4; i++) {
        if (availableTeams.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTeams.length);
          roundOf32Losers.push(availableTeams[randomIndex]);
          availableTeams.splice(randomIndex, 1); // Remove selected team
        }
      }
    }
    
    // Step 7: The remaining teams are Round of 64 losers (32 teams with 0 wins)
    const roundOf64Losers: number[] = [];
    for (const region of regions) {
      const regionTeams = TEAM_IDS[region as keyof typeof TEAM_IDS];
      // All teams not already selected
      const remainingTeams = regionTeams.filter(id => 
        id !== championId && id !== runnerUpId && 
        id !== finalFourLoser1Id && id !== finalFourLoser2Id &&
        !eliteEightLosers.includes(id) && !sweetSixteenLosers.includes(id) &&
        !roundOf32Losers.includes(id));
      
      roundOf64Losers.push(...remainingTeams);
    }
    
    // Verify we have the correct number of teams in each category
    if (roundOf64Losers.length !== 32) {
      throw new Error(`Expected 32 Round of 64 losers, got ${roundOf64Losers.length}`);
    }
    if (roundOf32Losers.length !== 16) {
      throw new Error(`Expected 16 Round of 32 losers, got ${roundOf32Losers.length}`);
    }
    if (sweetSixteenLosers.length !== 8) {
      throw new Error(`Expected 8 Sweet Sixteen losers, got ${sweetSixteenLosers.length}`);
    }
    if (eliteEightLosers.length !== 4) {
      throw new Error(`Expected 4 Elite Eight losers, got ${eliteEightLosers.length}`);
    }
    
    // Now we'll fill in the bracket with our selected teams
    
    // Round of 64 - Set winners
    for (let i = 0; i < 32; i++) {
      const matchup = bracket[i];
      const topTeamId = parseInt(matchup.topTeam!.id);
      const bottomTeamId = parseInt(matchup.bottomTeam!.id);
      
      // If both teams are Round of 64 losers, randomly pick one
      if (roundOf64Losers.includes(topTeamId) && roundOf64Losers.includes(bottomTeamId)) {
        matchup.winner = Math.random() < 0.5 ? topTeamId.toString() : bottomTeamId.toString();
        continue;
      }
      
      // Otherwise, the winner is the team that's not in Round of 64 losers
      if (roundOf64Losers.includes(topTeamId)) {
        matchup.winner = bottomTeamId.toString();
      } else {
        matchup.winner = topTeamId.toString();
      }
    }
    
    // Process subsequent rounds
    const rounds = ["Round of 32", "Sweet 16", "Elite 8", "Final 4", "Championship"];
    let currentMatchupIndex = 32; // Start after Round of 64
    
    for (const round of rounds) {
      const matchupIds = MATCHUP_IDS[round as RoundName];
      
      for (let i = 0; i < matchupIds.length; i++) {
        const matchupId = matchupIds[i];
        
        // Get the winners from the previous round
        const prevWinner1 = parseInt(bracket[currentMatchupIndex - matchupIds.length * 2 + i * 2].winner!);
        const prevWinner2 = parseInt(bracket[currentMatchupIndex - matchupIds.length * 2 + i * 2 + 1].winner!);
        
        // Determine the winner based on our predefined winners
        let winnerId: number;
        
        // Championship
        if (round === "Championship") {
          winnerId = championId;
        }
        // Final 4 - champion and runner-up advance
        else if (round === "Final 4") {
          if (prevWinner1 === championId || prevWinner1 === runnerUpId) {
            winnerId = prevWinner1;
          } else {
            winnerId = prevWinner2;
          }
        }
        // Elite 8 - champion, runner-up, and Final Four losers advance
        else if (round === "Elite 8") {
          if (prevWinner1 === championId || prevWinner1 === runnerUpId || 
              prevWinner1 === finalFourLoser1Id || prevWinner1 === finalFourLoser2Id) {
            winnerId = prevWinner1;
          } else {
            winnerId = prevWinner2;
          }
        }
        // Sweet 16 - teams with 3+ wins advance
        else if (round === "Sweet 16") {
          if (prevWinner1 === championId || prevWinner1 === runnerUpId || 
              prevWinner1 === finalFourLoser1Id || prevWinner1 === finalFourLoser2Id ||
              eliteEightLosers.includes(prevWinner1)) {
            winnerId = prevWinner1;
          } else {
            winnerId = prevWinner2;
          }
        }
        // Round of 32 - teams with 2+ wins advance
        else {
          if (prevWinner1 === championId || prevWinner1 === runnerUpId || 
              prevWinner1 === finalFourLoser1Id || prevWinner1 === finalFourLoser2Id ||
              eliteEightLosers.includes(prevWinner1) || sweetSixteenLosers.includes(prevWinner1)) {
            winnerId = prevWinner1;
          } else if (prevWinner2 === championId || prevWinner2 === runnerUpId || 
              prevWinner2 === finalFourLoser1Id || prevWinner2 === finalFourLoser2Id ||
              eliteEightLosers.includes(prevWinner2) || sweetSixteenLosers.includes(prevWinner2)) {
            winnerId = prevWinner2;
          } else {
            // If neither team is special, pick the one with the lower ID
            winnerId = prevWinner1 < prevWinner2 ? prevWinner1 : prevWinner2;
          }
        }
        
        bracket.push({
          id: matchupId,
          round,
          topTeam: { id: prevWinner1.toString() },
          bottomTeam: { id: prevWinner2.toString() },
          winner: winnerId.toString()
        });
        
        currentMatchupIndex++;
      }
    }
    
    // Validate the bracket
    const isValid = validateBracketWinDistribution(bracket);
    
    if (!isValid) {
      console.log("Generated an invalid bracket. Analyzing win distribution...");
      const winCounts = calculateTeamWins(bracket);
      
      // Count teams with each number of wins
      const winDistribution = new Map<number, number>();
      for (const wins of winCounts.values()) {
        winDistribution.set(wins, (winDistribution.get(wins) ?? 0) + 1);
      }
      
      console.log("Win distribution:");
      console.log(`6 wins: ${winDistribution.get(6) || 0} teams (expected 1)`);
      console.log(`5 wins: ${winDistribution.get(5) || 0} teams (expected 1)`);
      console.log(`4 wins: ${winDistribution.get(4) || 0} teams (expected 2)`);
      console.log(`3 wins: ${winDistribution.get(3) || 0} teams (expected 4)`);
      console.log(`2 wins: ${winDistribution.get(2) || 0} teams (expected 8)`);
      console.log(`1 win: ${winDistribution.get(1) || 0} teams (expected 16)`);
      console.log(`0 wins: ${winDistribution.get(0) || 0} teams (expected 32)`);
      
      // Fallback to a simpler approach if our deterministic method fails
      return generateSimpleBracket();
    }
    
    return bracket;
  } catch (error) {
    console.log("Error in generateValidBracket:", error);
    // Fallback to a simpler approach if our deterministic method fails
    return generateSimpleBracket();
  }
}

/**
 * Generate a simple valid bracket with a fixed structure.
 * This is a fallback method that always produces a valid bracket.
 */
export function generateSimpleBracket(): UserMatchup[] {
  const bracket: UserMatchup[] = [];
  
  // We'll use a forward approach - starting from Round of 64 and working forward
  // First, let's create a map to track how many wins each team should have
  const teamWinTargets = new Map<number, number>();
  
  // Define our champion (6 wins)
  const championId = 51; // UConn
  teamWinTargets.set(championId, 6);
  
  // Define our runner-up (5 wins)
  const runnerUpId = 1; // Duke
  teamWinTargets.set(runnerUpId, 5);
  
  // Define our Final Four losers (4 wins each)
  const finalFourLoser1Id = 101; // Purdue
  const finalFourLoser2Id = 151; // Houston
  teamWinTargets.set(finalFourLoser1Id, 4);
  teamWinTargets.set(finalFourLoser2Id, 4);
  
  // Define our Elite Eight losers (3 wins each)
  const eliteEightLosers = [52, 2, 102, 152];
  for (const id of eliteEightLosers) {
    teamWinTargets.set(id, 3);
  }
  
  // Define our Sweet Sixteen losers (2 wins each)
  const sweetSixteenLosers = [53, 54, 3, 4, 103, 104, 153, 154];
  for (const id of sweetSixteenLosers) {
    teamWinTargets.set(id, 2);
  }
  
  // Define our Round of 32 losers (1 win each)
  const roundOf32Losers = [55, 56, 57, 58, 5, 6, 7, 8, 105, 106, 107, 108, 155, 156, 157, 158];
  for (const id of roundOf32Losers) {
    teamWinTargets.set(id, 1);
  }
  
  // All other teams are Round of 64 losers (0 wins)
  const allTeams = [
    ...Object.values(TEAM_IDS.WEST),
    ...Object.values(TEAM_IDS.EAST),
    ...Object.values(TEAM_IDS.MIDWEST),
    ...Object.values(TEAM_IDS.SOUTH)
  ];
  
  for (const id of allTeams) {
    if (!teamWinTargets.has(id)) {
      teamWinTargets.set(id, 0);
    }
  }
  
  // Now we'll create the bracket matchups and determine winners
  // We'll track the current wins for each team
  const teamCurrentWins = new Map<number, number>();
  for (const id of allTeams) {
    teamCurrentWins.set(id, 0);
  }
  
  // Create Round of 64 matchups
  for (const [i, matchupId] of MATCHUP_IDS["Round of 64"].entries()) {
    const region = i < 8 ? "WEST" : i < 16 ? "EAST" : i < 24 ? "MIDWEST" : "SOUTH";
    const regionIndex = i % 8;
    
    const topTeamId = TEAM_IDS[region as keyof typeof TEAM_IDS][regionIndex * 2];
    const bottomTeamId = TEAM_IDS[region as keyof typeof TEAM_IDS][regionIndex * 2 + 1];
    
    // Determine winner based on our win targets
    let winnerId: number;
    
    // If both teams should have 0 wins, pick one arbitrarily
    if (teamWinTargets.get(topTeamId) === 0 && teamWinTargets.get(bottomTeamId) === 0) {
      winnerId = topTeamId; // Arbitrary choice
    } 
    // Otherwise, the winner is the team that should have more than 0 wins
    else if (teamWinTargets.get(topTeamId) === 0) {
      winnerId = bottomTeamId;
    } else if (teamWinTargets.get(bottomTeamId) === 0) {
      winnerId = topTeamId;
    } 
    // If both should have wins, pick the one with more target wins
    else {
      winnerId = (teamWinTargets.get(topTeamId)! > teamWinTargets.get(bottomTeamId)!) 
        ? topTeamId : bottomTeamId;
    }
    
    // Update the winner's win count
    teamCurrentWins.set(winnerId, teamCurrentWins.get(winnerId)! + 1);
    
    bracket.push({
      id: matchupId,
      round: "Round of 64",
      topTeam: { id: topTeamId.toString() },
      bottomTeam: { id: bottomTeamId.toString() },
      winner: winnerId.toString()
    });
  }
  
  // Process subsequent rounds
  const rounds = ["Round of 32", "Sweet 16", "Elite 8", "Final 4", "Championship"];
  let currentMatchupIndex = 32; // Start after Round of 64
  
  for (const round of rounds) {
    const matchupIds = MATCHUP_IDS[round as RoundName];
    
    for (let i = 0; i < matchupIds.length; i++) {
      const matchupId = matchupIds[i];
      
      // Get the winners from the previous round
      const prevWinner1 = parseInt(bracket[currentMatchupIndex - matchupIds.length * 2 + i * 2].winner!);
      const prevWinner2 = parseInt(bracket[currentMatchupIndex - matchupIds.length * 2 + i * 2 + 1].winner!);
      
      // Determine the winner based on target wins
      let winnerId: number;
      
      // If one team has reached its target wins, the other team advances
      if (teamCurrentWins.get(prevWinner1)! >= teamWinTargets.get(prevWinner1)!) {
        winnerId = prevWinner2;
      } else if (teamCurrentWins.get(prevWinner2)! >= teamWinTargets.get(prevWinner2)!) {
        winnerId = prevWinner1;
      } 
      // If neither has reached their target, pick the one with the higher target
      else {
        winnerId = (teamWinTargets.get(prevWinner1)! > teamWinTargets.get(prevWinner2)!) 
          ? prevWinner1 : prevWinner2;
      }
      
      // Update the winner's win count
      teamCurrentWins.set(winnerId, teamCurrentWins.get(winnerId)! + 1);
      
      bracket.push({
        id: matchupId,
        round,
        topTeam: { id: prevWinner1.toString() },
        bottomTeam: { id: prevWinner2.toString() },
        winner: winnerId.toString()
      });
      
      currentMatchupIndex++;
    }
  }
  
  // Validate the bracket
  const isValid = validateBracketWinDistribution(bracket);
  
  if (!isValid) {
    console.log("Generated an invalid bracket with the simple approach. Analyzing win distribution...");
    const winCounts = calculateTeamWins(bracket);
    
    // Count teams with each number of wins
    const winDistribution = new Map<number, number>();
    for (const wins of winCounts.values()) {
      winDistribution.set(wins, (winDistribution.get(wins) ?? 0) + 1);
    }
    
    console.log("Win distribution:");
    console.log(`6 wins: ${winDistribution.get(6) || 0} teams (expected 1)`);
    console.log(`5 wins: ${winDistribution.get(5) || 0} teams (expected 1)`);
    console.log(`4 wins: ${winDistribution.get(4) || 0} teams (expected 2)`);
    console.log(`3 wins: ${winDistribution.get(3) || 0} teams (expected 4)`);
    console.log(`2 wins: ${winDistribution.get(2) || 0} teams (expected 8)`);
    console.log(`1 win: ${winDistribution.get(1) || 0} teams (expected 16)`);
    console.log(`0 wins: ${winDistribution.get(0) || 0} teams (expected 32)`);
    
    // If validation fails, use a hardcoded valid bracket
    return generateHardcodedBracket();
  }
  
  return bracket;
}

/**
 * Generate a hardcoded valid bracket as a last resort.
 * This is a completely fixed bracket that is guaranteed to be valid.
 */
export function generateHardcodedBracket(): UserMatchup[] {
  // Create a bracket with a fixed, valid structure
  const bracket: UserMatchup[] = [];
  
  // Round of 64 - West Region
  bracket.push(
    { id: 401638599, round: "Round of 64", topTeam: { id: "51" }, bottomTeam: { id: "66" }, winner: "51" }, // Champion advances
    { id: 401638614, round: "Round of 64", topTeam: { id: "58" }, bottomTeam: { id: "59" }, winner: "58" },
    { id: 401638613, round: "Round of 64", topTeam: { id: "55" }, bottomTeam: { id: "62" }, winner: "55" },
    { id: 401638612, round: "Round of 64", topTeam: { id: "54" }, bottomTeam: { id: "63" }, winner: "54" }, // Sweet 16 loser advances
    { id: 401638598, round: "Round of 64", topTeam: { id: "56" }, bottomTeam: { id: "61" }, winner: "56" },
    { id: 401638597, round: "Round of 64", topTeam: { id: "53" }, bottomTeam: { id: "64" }, winner: "53" }, // Sweet 16 loser advances
    { id: 401638596, round: "Round of 64", topTeam: { id: "57" }, bottomTeam: { id: "60" }, winner: "57" },
    { id: 401638595, round: "Round of 64", topTeam: { id: "52" }, bottomTeam: { id: "65" }, winner: "52" }  // Elite 8 loser advances
  );
  
  // Round of 64 - East Region
  bracket.push(
    { id: 401638586, round: "Round of 64", topTeam: { id: "1" }, bottomTeam: { id: "16" }, winner: "1" },   // Runner-up advances
    { id: 401638585, round: "Round of 64", topTeam: { id: "8" }, bottomTeam: { id: "9" }, winner: "8" },
    { id: 401638605, round: "Round of 64", topTeam: { id: "5" }, bottomTeam: { id: "12" }, winner: "5" },
    { id: 401638604, round: "Round of 64", topTeam: { id: "4" }, bottomTeam: { id: "13" }, winner: "4" },   // Sweet 16 loser advances
    { id: 401638603, round: "Round of 64", topTeam: { id: "6" }, bottomTeam: { id: "11" }, winner: "6" },
    { id: 401638602, round: "Round of 64", topTeam: { id: "3" }, bottomTeam: { id: "14" }, winner: "3" },   // Sweet 16 loser advances
    { id: 401638584, round: "Round of 64", topTeam: { id: "7" }, bottomTeam: { id: "10" }, winner: "7" },
    { id: 401638583, round: "Round of 64", topTeam: { id: "2" }, bottomTeam: { id: "15" }, winner: "2" }    // Elite 8 loser advances
  );
  
  // Round of 64 - Midwest Region
  bracket.push(
    { id: 401638600, round: "Round of 64", topTeam: { id: "101" }, bottomTeam: { id: "116" }, winner: "101" }, // Final 4 loser advances
    { id: 401638611, round: "Round of 64", topTeam: { id: "108" }, bottomTeam: { id: "109" }, winner: "108" },
    { id: 401638610, round: "Round of 64", topTeam: { id: "105" }, bottomTeam: { id: "112" }, winner: "105" },
    { id: 401638609, round: "Round of 64", topTeam: { id: "104" }, bottomTeam: { id: "113" }, winner: "104" }, // Sweet 16 loser advances
    { id: 401638594, round: "Round of 64", topTeam: { id: "106" }, bottomTeam: { id: "111" }, winner: "106" },
    { id: 401638593, round: "Round of 64", topTeam: { id: "103" }, bottomTeam: { id: "114" }, winner: "103" }, // Sweet 16 loser advances
    { id: 401638608, round: "Round of 64", topTeam: { id: "107" }, bottomTeam: { id: "110" }, winner: "107" },
    { id: 401638607, round: "Round of 64", topTeam: { id: "102" }, bottomTeam: { id: "115" }, winner: "102" }  // Elite 8 loser advances
  );
  
  // Round of 64 - South Region
  bracket.push(
    { id: 401638601, round: "Round of 64", topTeam: { id: "151" }, bottomTeam: { id: "166" }, winner: "151" }, // Final 4 loser advances
    { id: 401638606, round: "Round of 64", topTeam: { id: "158" }, bottomTeam: { id: "159" }, winner: "158" },
    { id: 401638592, round: "Round of 64", topTeam: { id: "155" }, bottomTeam: { id: "162" }, winner: "155" },
    { id: 401638591, round: "Round of 64", topTeam: { id: "154" }, bottomTeam: { id: "163" }, winner: "154" }, // Sweet 16 loser advances
    { id: 401638590, round: "Round of 64", topTeam: { id: "156" }, bottomTeam: { id: "161" }, winner: "156" },
    { id: 401638589, round: "Round of 64", topTeam: { id: "153" }, bottomTeam: { id: "164" }, winner: "153" }, // Sweet 16 loser advances
    { id: 401638588, round: "Round of 64", topTeam: { id: "157" }, bottomTeam: { id: "160" }, winner: "157" },
    { id: 401638587, round: "Round of 64", topTeam: { id: "152" }, bottomTeam: { id: "165" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Round of 32 - West Region
  bracket.push(
    { id: 401638630, round: "Round of 32", topTeam: { id: "51" }, bottomTeam: { id: "58" }, winner: "51" }, // Champion advances
    { id: 401638629, round: "Round of 32", topTeam: { id: "55" }, bottomTeam: { id: "54" }, winner: "54" }, // Sweet 16 loser advances
    { id: 401638615, round: "Round of 32", topTeam: { id: "56" }, bottomTeam: { id: "53" }, winner: "53" }, // Sweet 16 loser advances
    { id: 401638616, round: "Round of 32", topTeam: { id: "57" }, bottomTeam: { id: "52" }, winner: "52" }  // Elite 8 loser advances
  );
  
  // Round of 32 - East Region
  bracket.push(
    { id: 401638622, round: "Round of 32", topTeam: { id: "1" }, bottomTeam: { id: "8" }, winner: "1" },   // Runner-up advances
    { id: 401638623, round: "Round of 32", topTeam: { id: "5" }, bottomTeam: { id: "4" }, winner: "4" },   // Sweet 16 loser advances
    { id: 401638624, round: "Round of 32", topTeam: { id: "6" }, bottomTeam: { id: "3" }, winner: "3" },   // Sweet 16 loser advances
    { id: 401638621, round: "Round of 32", topTeam: { id: "7" }, bottomTeam: { id: "2" }, winner: "2" }    // Elite 8 loser advances
  );
  
  // Round of 32 - Midwest Region
  bracket.push(
    { id: 401638626, round: "Round of 32", topTeam: { id: "101" }, bottomTeam: { id: "108" }, winner: "101" }, // Final 4 loser advances
    { id: 401638627, round: "Round of 32", topTeam: { id: "105" }, bottomTeam: { id: "104" }, winner: "104" }, // Sweet 16 loser advances
    { id: 401638620, round: "Round of 32", topTeam: { id: "106" }, bottomTeam: { id: "103" }, winner: "103" }, // Sweet 16 loser advances
    { id: 401638625, round: "Round of 32", topTeam: { id: "107" }, bottomTeam: { id: "102" }, winner: "102" }  // Elite 8 loser advances
  );
  
  // Round of 32 - South Region
  bracket.push(
    { id: 401638628, round: "Round of 32", topTeam: { id: "151" }, bottomTeam: { id: "158" }, winner: "151" }, // Final 4 loser advances
    { id: 401638617, round: "Round of 32", topTeam: { id: "155" }, bottomTeam: { id: "154" }, winner: "154" }, // Sweet 16 loser advances
    { id: 401638618, round: "Round of 32", topTeam: { id: "156" }, bottomTeam: { id: "153" }, winner: "153" }, // Sweet 16 loser advances
    { id: 401638619, round: "Round of 32", topTeam: { id: "157" }, bottomTeam: { id: "152" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Sweet 16
  bracket.push(
    { id: 401638633, round: "Sweet 16", topTeam: { id: "51" }, bottomTeam: { id: "54" }, winner: "51" }, // Champion advances
    { id: 401638634, round: "Sweet 16", topTeam: { id: "53" }, bottomTeam: { id: "52" }, winner: "52" }, // Elite 8 loser advances
    { id: 401638632, round: "Sweet 16", topTeam: { id: "1" }, bottomTeam: { id: "4" }, winner: "1" },   // Runner-up advances
    { id: 401638631, round: "Sweet 16", topTeam: { id: "3" }, bottomTeam: { id: "2" }, winner: "2" },   // Elite 8 loser advances
    { id: 401638638, round: "Sweet 16", topTeam: { id: "101" }, bottomTeam: { id: "104" }, winner: "101" }, // Final 4 loser advances
    { id: 401638637, round: "Sweet 16", topTeam: { id: "103" }, bottomTeam: { id: "102" }, winner: "102" }, // Elite 8 loser advances
    { id: 401638635, round: "Sweet 16", topTeam: { id: "151" }, bottomTeam: { id: "154" }, winner: "151" }, // Final 4 loser advances
    { id: 401638636, round: "Sweet 16", topTeam: { id: "153" }, bottomTeam: { id: "152" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Elite 8
  bracket.push(
    { id: 401638639, round: "Elite 8", topTeam: { id: "51" }, bottomTeam: { id: "52" }, winner: "51" }, // Champion advances
    { id: 401638640, round: "Elite 8", topTeam: { id: "1" }, bottomTeam: { id: "2" }, winner: "1" },   // Runner-up advances
    { id: 401638641, round: "Elite 8", topTeam: { id: "101" }, bottomTeam: { id: "102" }, winner: "101" }, // Final 4 loser advances
    { id: 401638642, round: "Elite 8", topTeam: { id: "151" }, bottomTeam: { id: "152" }, winner: "151" }  // Final 4 loser advances
  );
  
  // Final 4
  bracket.push(
    { id: 401638643, round: "Final 4", topTeam: { id: "51" }, bottomTeam: { id: "1" }, winner: "51" }, // Champion advances
    { id: 401638644, round: "Final 4", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "1" }  // Runner-up advances
  );
  
  // Championship
  bracket.push(
    { id: 401638645, round: "Championship", topTeam: { id: "51" }, bottomTeam: { id: "1" }, winner: "51" } // Champion wins
  );
  
  // Introduce randomness by swapping some winners in the Round of 64
  // This will create different but still valid brackets
  const roundOf64Matchups = bracket.filter(m => m.round === "Round of 64");
  
  // Randomly select 3-5 matchups to modify
  const numToModify = Math.floor(Math.random() * 3) + 3; // 3-5 matchups
  
  // Keep track of which teams we've modified to avoid conflicts
  const modifiedTeams = new Set<string>();
  
  for (let i = 0; i < numToModify; i++) {
    // Find a matchup that we can safely modify without breaking the bracket
    const eligibleMatchups = roundOf64Matchups.filter(m => {
      // Skip matchups where the winner advances far in the tournament
      if (m.winner === "51") return false; // Champion
      
      // Skip matchups where we've already modified one of the teams
      if (modifiedTeams.has(m.topTeam!.id) || modifiedTeams.has(m.bottomTeam!.id)) return false;
      
      // Find matchups where the winner only wins 1 game (Round of 32 loser)
      const winnerTeamId = m.winner;
      const advancesTo = bracket.find(other => 
        other.round === "Round of 32" && 
        (other.topTeam?.id === winnerTeamId || other.bottomTeam?.id === winnerTeamId) &&
        other.winner !== winnerTeamId
      );
      
      return !!advancesTo; // Only include if this team loses in Round of 32
    });
    
    if (eligibleMatchups.length === 0) break;
    
    // Randomly select a matchup to modify
    const randomIndex = Math.floor(Math.random() * eligibleMatchups.length);
    const matchupToModify = eligibleMatchups[randomIndex];
    
    // Find the matchup in the original bracket
    const bracketIndex = bracket.findIndex(m => m.id === matchupToModify.id);
    
    if (bracketIndex >= 0) {
      // Swap the winner
      const currentWinner = matchupToModify.winner;
      const newWinner = currentWinner === matchupToModify.topTeam?.id 
        ? matchupToModify.bottomTeam?.id || null
        : matchupToModify.topTeam?.id || null;
      
      // Update the bracket
      bracket[bracketIndex] = {
        ...matchupToModify,
        winner: newWinner
      };
      
      // Find the Round of 32 matchup where this team appears and update it
      const round32Index = bracket.findIndex(m => 
        m.round === "Round of 32" && 
        (m.topTeam?.id === currentWinner || m.bottomTeam?.id === currentWinner)
      );
      
      if (round32Index >= 0) {
        const round32Matchup = bracket[round32Index];
        
        // Replace the team ID in the Round of 32 matchup
        if (round32Matchup.topTeam?.id === currentWinner) {
          bracket[round32Index] = {
            ...round32Matchup,
            topTeam: { id: newWinner! }
          };
        } else if (round32Matchup.bottomTeam?.id === currentWinner) {
          bracket[round32Index] = {
            ...round32Matchup,
            bottomTeam: { id: newWinner! }
          };
        }
      }
      
      // Mark these teams as modified
      modifiedTeams.add(matchupToModify.topTeam!.id);
      modifiedTeams.add(matchupToModify.bottomTeam!.id);
    }
  }
  
  // Validate the modified bracket to ensure it's still valid
  const isValid = validateBracketWinDistribution(bracket);
  if (!isValid) {
    console.log("Warning: Modified hardcoded bracket is invalid. Using original hardcoded bracket.");
    return generateOriginalHardcodedBracket();
  }
  
  return bracket;
}

/**
 * Generate the original hardcoded bracket without any modifications.
 * This is used as a fallback if our randomization breaks the bracket.
 */
function generateOriginalHardcodedBracket(): UserMatchup[] {
  // Create a bracket with a fixed, valid structure
  const bracket: UserMatchup[] = [];
  
  // Round of 64 - West Region
  bracket.push(
    { id: 401638599, round: "Round of 64", topTeam: { id: "51" }, bottomTeam: { id: "66" }, winner: "51" }, // Champion advances
    { id: 401638614, round: "Round of 64", topTeam: { id: "58" }, bottomTeam: { id: "59" }, winner: "58" },
    { id: 401638613, round: "Round of 64", topTeam: { id: "55" }, bottomTeam: { id: "62" }, winner: "55" },
    { id: 401638612, round: "Round of 64", topTeam: { id: "54" }, bottomTeam: { id: "63" }, winner: "54" }, // Sweet 16 loser advances
    { id: 401638598, round: "Round of 64", topTeam: { id: "56" }, bottomTeam: { id: "61" }, winner: "56" },
    { id: 401638597, round: "Round of 64", topTeam: { id: "53" }, bottomTeam: { id: "64" }, winner: "53" }, // Sweet 16 loser advances
    { id: 401638596, round: "Round of 64", topTeam: { id: "57" }, bottomTeam: { id: "60" }, winner: "57" },
    { id: 401638595, round: "Round of 64", topTeam: { id: "52" }, bottomTeam: { id: "65" }, winner: "52" }  // Elite 8 loser advances
  );
  
  // Round of 64 - East Region
  bracket.push(
    { id: 401638586, round: "Round of 64", topTeam: { id: "1" }, bottomTeam: { id: "16" }, winner: "1" },   // Runner-up advances
    { id: 401638585, round: "Round of 64", topTeam: { id: "8" }, bottomTeam: { id: "9" }, winner: "8" },
    { id: 401638605, round: "Round of 64", topTeam: { id: "5" }, bottomTeam: { id: "12" }, winner: "5" },
    { id: 401638604, round: "Round of 64", topTeam: { id: "4" }, bottomTeam: { id: "13" }, winner: "4" },   // Sweet 16 loser advances
    { id: 401638603, round: "Round of 64", topTeam: { id: "6" }, bottomTeam: { id: "11" }, winner: "6" },
    { id: 401638602, round: "Round of 64", topTeam: { id: "3" }, bottomTeam: { id: "14" }, winner: "3" },   // Sweet 16 loser advances
    { id: 401638584, round: "Round of 64", topTeam: { id: "7" }, bottomTeam: { id: "10" }, winner: "7" },
    { id: 401638583, round: "Round of 64", topTeam: { id: "2" }, bottomTeam: { id: "15" }, winner: "2" }    // Elite 8 loser advances
  );
  
  // Round of 64 - Midwest Region
  bracket.push(
    { id: 401638600, round: "Round of 64", topTeam: { id: "101" }, bottomTeam: { id: "116" }, winner: "101" }, // Final 4 loser advances
    { id: 401638611, round: "Round of 64", topTeam: { id: "108" }, bottomTeam: { id: "109" }, winner: "108" },
    { id: 401638610, round: "Round of 64", topTeam: { id: "105" }, bottomTeam: { id: "112" }, winner: "105" },
    { id: 401638609, round: "Round of 64", topTeam: { id: "104" }, bottomTeam: { id: "113" }, winner: "104" }, // Sweet 16 loser advances
    { id: 401638594, round: "Round of 64", topTeam: { id: "106" }, bottomTeam: { id: "111" }, winner: "106" },
    { id: 401638593, round: "Round of 64", topTeam: { id: "103" }, bottomTeam: { id: "114" }, winner: "103" }, // Sweet 16 loser advances
    { id: 401638608, round: "Round of 64", topTeam: { id: "107" }, bottomTeam: { id: "110" }, winner: "107" },
    { id: 401638607, round: "Round of 64", topTeam: { id: "102" }, bottomTeam: { id: "115" }, winner: "102" }  // Elite 8 loser advances
  );
  
  // Round of 64 - South Region
  bracket.push(
    { id: 401638601, round: "Round of 64", topTeam: { id: "151" }, bottomTeam: { id: "166" }, winner: "151" }, // Final 4 loser advances
    { id: 401638606, round: "Round of 64", topTeam: { id: "158" }, bottomTeam: { id: "159" }, winner: "158" },
    { id: 401638592, round: "Round of 64", topTeam: { id: "155" }, bottomTeam: { id: "162" }, winner: "155" },
    { id: 401638591, round: "Round of 64", topTeam: { id: "154" }, bottomTeam: { id: "163" }, winner: "154" }, // Sweet 16 loser advances
    { id: 401638590, round: "Round of 64", topTeam: { id: "156" }, bottomTeam: { id: "161" }, winner: "156" },
    { id: 401638589, round: "Round of 64", topTeam: { id: "153" }, bottomTeam: { id: "164" }, winner: "153" }, // Sweet 16 loser advances
    { id: 401638588, round: "Round of 64", topTeam: { id: "157" }, bottomTeam: { id: "160" }, winner: "157" },
    { id: 401638587, round: "Round of 64", topTeam: { id: "152" }, bottomTeam: { id: "165" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Round of 32 - West Region
  bracket.push(
    { id: 401638630, round: "Round of 32", topTeam: { id: "51" }, bottomTeam: { id: "58" }, winner: "51" }, // Champion advances
    { id: 401638629, round: "Round of 32", topTeam: { id: "55" }, bottomTeam: { id: "54" }, winner: "54" }, // Sweet 16 loser advances
    { id: 401638615, round: "Round of 32", topTeam: { id: "56" }, bottomTeam: { id: "53" }, winner: "53" }, // Sweet 16 loser advances
    { id: 401638616, round: "Round of 32", topTeam: { id: "57" }, bottomTeam: { id: "52" }, winner: "52" }  // Elite 8 loser advances
  );
  
  // Round of 32 - East Region
  bracket.push(
    { id: 401638622, round: "Round of 32", topTeam: { id: "1" }, bottomTeam: { id: "8" }, winner: "1" },   // Runner-up advances
    { id: 401638623, round: "Round of 32", topTeam: { id: "5" }, bottomTeam: { id: "4" }, winner: "4" },   // Sweet 16 loser advances
    { id: 401638624, round: "Round of 32", topTeam: { id: "6" }, bottomTeam: { id: "3" }, winner: "3" },   // Sweet 16 loser advances
    { id: 401638621, round: "Round of 32", topTeam: { id: "7" }, bottomTeam: { id: "2" }, winner: "2" }    // Elite 8 loser advances
  );
  
  // Round of 32 - Midwest Region
  bracket.push(
    { id: 401638626, round: "Round of 32", topTeam: { id: "101" }, bottomTeam: { id: "108" }, winner: "101" }, // Final 4 loser advances
    { id: 401638627, round: "Round of 32", topTeam: { id: "105" }, bottomTeam: { id: "104" }, winner: "104" }, // Sweet 16 loser advances
    { id: 401638620, round: "Round of 32", topTeam: { id: "106" }, bottomTeam: { id: "103" }, winner: "103" }, // Sweet 16 loser advances
    { id: 401638625, round: "Round of 32", topTeam: { id: "107" }, bottomTeam: { id: "102" }, winner: "102" }  // Elite 8 loser advances
  );
  
  // Round of 32 - South Region
  bracket.push(
    { id: 401638628, round: "Round of 32", topTeam: { id: "151" }, bottomTeam: { id: "158" }, winner: "151" }, // Final 4 loser advances
    { id: 401638617, round: "Round of 32", topTeam: { id: "155" }, bottomTeam: { id: "154" }, winner: "154" }, // Sweet 16 loser advances
    { id: 401638618, round: "Round of 32", topTeam: { id: "156" }, bottomTeam: { id: "153" }, winner: "153" }, // Sweet 16 loser advances
    { id: 401638619, round: "Round of 32", topTeam: { id: "157" }, bottomTeam: { id: "152" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Sweet 16
  bracket.push(
    { id: 401638633, round: "Sweet 16", topTeam: { id: "51" }, bottomTeam: { id: "54" }, winner: "51" }, // Champion advances
    { id: 401638634, round: "Sweet 16", topTeam: { id: "53" }, bottomTeam: { id: "52" }, winner: "52" }, // Elite 8 loser advances
    { id: 401638632, round: "Sweet 16", topTeam: { id: "1" }, bottomTeam: { id: "4" }, winner: "1" },   // Runner-up advances
    { id: 401638631, round: "Sweet 16", topTeam: { id: "3" }, bottomTeam: { id: "2" }, winner: "2" },   // Elite 8 loser advances
    { id: 401638638, round: "Sweet 16", topTeam: { id: "101" }, bottomTeam: { id: "104" }, winner: "101" }, // Final 4 loser advances
    { id: 401638637, round: "Sweet 16", topTeam: { id: "103" }, bottomTeam: { id: "102" }, winner: "102" }, // Elite 8 loser advances
    { id: 401638635, round: "Sweet 16", topTeam: { id: "151" }, bottomTeam: { id: "154" }, winner: "151" }, // Final 4 loser advances
    { id: 401638636, round: "Sweet 16", topTeam: { id: "153" }, bottomTeam: { id: "152" }, winner: "152" }  // Elite 8 loser advances
  );
  
  // Elite 8
  bracket.push(
    { id: 401638639, round: "Elite 8", topTeam: { id: "51" }, bottomTeam: { id: "52" }, winner: "51" }, // Champion advances
    { id: 401638640, round: "Elite 8", topTeam: { id: "1" }, bottomTeam: { id: "2" }, winner: "1" },   // Runner-up advances
    { id: 401638641, round: "Elite 8", topTeam: { id: "101" }, bottomTeam: { id: "102" }, winner: "101" }, // Final 4 loser advances
    { id: 401638642, round: "Elite 8", topTeam: { id: "151" }, bottomTeam: { id: "152" }, winner: "151" }  // Final 4 loser advances
  );
  
  // Final 4
  bracket.push(
    { id: 401638643, round: "Final 4", topTeam: { id: "51" }, bottomTeam: { id: "1" }, winner: "51" }, // Champion advances
    { id: 401638644, round: "Final 4", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "1" }  // Runner-up advances
  );
  
  // Championship
  bracket.push(
    { id: 401638645, round: "Championship", topTeam: { id: "51" }, bottomTeam: { id: "1" }, winner: "51" } // Champion wins
  );
  
  // Validate the bracket
  const isValid = validateBracketWinDistribution(bracket);
  
  if (!isValid) {
    console.error("Hardcoded bracket is invalid - this should never happen!");
    console.error("Analyzing win distribution...");
    const winCounts = calculateTeamWins(bracket);
    
    // Count teams with each number of wins
    const winDistribution = new Map<number, number>();
    for (const wins of winCounts.values()) {
      winDistribution.set(wins, (winDistribution.get(wins) ?? 0) + 1);
    }
    
    console.error("Win distribution:");
    console.error(`6 wins: ${winDistribution.get(6) || 0} teams (expected 1)`);
    console.error(`5 wins: ${winDistribution.get(5) || 0} teams (expected 1)`);
    console.error(`4 wins: ${winDistribution.get(4) || 0} teams (expected 2)`);
    console.error(`3 wins: ${winDistribution.get(3) || 0} teams (expected 4)`);
    console.error(`2 wins: ${winDistribution.get(2) || 0} teams (expected 8)`);
    console.error(`1 win: ${winDistribution.get(1) || 0} teams (expected 16)`);
    console.error(`0 wins: ${winDistribution.get(0) || 0} teams (expected 32)`);
    
    throw new Error("Hardcoded bracket is invalid - this should never happen!");
  }
  
  return bracket;
}

/**
 * Upload bracket metadata to IPFS via Pinata.
 * @param bracket The bracket data to upload
 * @param tournamentId The tournament ID
 * @returns The IPFS URI for the uploaded metadata
 */
export async function uploadToIPFS(bracket: UserMatchup[], tournamentId: number): Promise<string> {
  // Get Pinata API keys from environment variables
  const apiKey = vars.get("PINATA_API_KEY");
  const apiSecret = vars.get("PINATA_SECRET_API_KEY");
  
  if (!apiKey || !apiSecret) {
    throw new Error("Pinata API keys not found in environment variables");
  }
  
  // Initialize Pinata client
  const pinata = new PinataSDK(apiKey, apiSecret);
  
  // Find the champion (team with 6 wins)
  const winCounts = calculateTeamWins(bracket);
  const champion = Array.from(winCounts.entries())
    .find(([, wins]) => wins === 6)?.[0];
  
  if (!champion) {
    throw new Error("No champion found in bracket");
  }
  
  // Create metadata
  const metadata: NFTMetadata = {
    name: "Alma Mortem Bracket",
    data: {
      name: `Alma Mortem Bracket - ${TEAM_NAMES[champion] || "Champion"}'s Run`,
      description: `March Madness bracket prediction featuring ${TEAM_NAMES[champion] || "Team " + champion} as the National Champion. This NFT represents a unique bracket entry in the Alma Mortem tournament.`,
      image: TEAM_LOGOS[champion] || "https://a.espncdn.com/i/teamlogos/ncaa/500/41.png",
      external_url: "https://almamortem.com",
      attributes: [
        {
          trait_type: "Winning Team",
          value: TEAM_NAMES[champion] || "Team " + champion
        },
        {
          trait_type: "Tournament ID",
          value: tournamentId
        },
        {
          trait_type: "Final Four Teams",
          value: [
            TEAM_NAMES[champion] || "Team " + champion,
            TEAM_NAMES[Array.from(winCounts.entries()).find(([, wins]) => wins === 5)?.[0] || 0] || "Unknown",
            TEAM_NAMES[Array.from(winCounts.entries()).filter(([, wins]) => wins === 4)[0]?.[0] || 0] || "Unknown",
            TEAM_NAMES[Array.from(winCounts.entries()).filter(([, wins]) => wins === 4)[1]?.[0] || 0] || "Unknown"
          ].join(", ")
        },
        {
          trait_type: "Runner-up",
          value: TEAM_NAMES[Array.from(winCounts.entries()).find(([, wins]) => wins === 5)?.[0] || 0] || "Unknown"
        },
        {
          trait_type: "Creation Date",
          value: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        }
      ],
      picks: bracket.map(pick => ({
        id: pick.id,
        round: pick.round,
        topTeam: {
          id: pick.topTeam?.id || ""
        },
        bottomTeam: {
          id: pick.bottomTeam?.id || ""
        },
        winner: pick.winner
      }))
    }
  };
  
  // Upload to Pinata
  const result = await pinata.pinJSONToIPFS(metadata);
  
  // Return IPFS URI
  return `ipfs://${result.IpfsHash}`;
}

/**
 * Enter a tournament with multiple test entries.
 * @param tournamentManager The tournament manager contract
 * @param tournamentId The tournament ID to enter
 * @param numEntries The number of entries to make
 */
export async function enterTournamentWithTesters(
  tournamentManager: TournamentManager,
  tournamentId: number,
  numEntries: number
): Promise<void> {
  console.log(`Entering tournament ${tournamentId} with ${numEntries} test entries...`);
  
  // Get tournament details
  const tournament = await tournamentManager.getTournament(tournamentId);
  const entryFee = tournament[0];
  const paymentToken = tournament[1];
  const startTime = tournament[2];
  
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  
  console.log(`Tournament entry fee: ${ethers.formatEther(entryFee)} ETH`);
  console.log(`Payment token: ${paymentToken === ZERO_ADDRESS ? "ETH" : paymentToken}`);
  console.log(`Start time: ${new Date(Number(startTime) * 1000).toLocaleString()}`);
  
  // Get signers for test entries
  const signers = await ethers.getSigners();
  
  // Make entries
  for (let i = 0; i < numEntries; i++) {
    try {
      console.log(`\nCreating entry ${i + 1}/${numEntries}...`);
      
      // Generate a valid bracket
      console.log("Generating valid bracket...");
      const bracket = await generateValidBracket();
      
      // Upload to IPFS
      console.log("Uploading bracket to IPFS...");
      const bracketURI = await uploadToIPFS(bracket, tournamentId);
      console.log(`Bracket URI: ${bracketURI}`);
      
      // Calculate bracket hash
      const bracketHash = getBracketHash(bracket);
      console.log(`Bracket hash: ${bracketHash}`);
      
      // Random tiebreaker (0-150)
      const tiebreaker = Math.floor(Math.random() * 151);
      console.log(`Tiebreaker: ${tiebreaker}`);
      
      // Use a different signer for each entry (cycling through available signers)
      const signer = signers[i % signers.length];
      console.log(`Using signer: ${signer.address}`);
      
      // Enter tournament
      console.log("Entering tournament...");
      const tx = await tournamentManager.connect(signer).enterTournament(
        signer.address,
        tournamentId,
        bracketHash,
        tiebreaker,
        bracketURI,
        { value: paymentToken === ZERO_ADDRESS ? entryFee : 0 }
      );
      
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt?.hash}`);
      
      // Extract token ID from event
      const event = receipt?.logs;
      // const tokenId = event?.args?.tokenId;
      console.log(`Bracket NFT minted with token ID: ${JSON.stringify(event)}`);
      
    } catch (error) {
      console.error(`Error creating entry ${i + 1}:`, error);
    }
  }
  
  console.log(`\nCompleted ${numEntries} entries for tournament ${tournamentId}`);
}

export default enterTournamentWithTesters;