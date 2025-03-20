import { keccak256 } from "thirdweb/utils";
import { encodeAbiParameters } from "viem";

import type { UserMatchup } from "~/types/bracket";

/**
 * Calculate the number of wins for each team in the bracket.
 * Validates that the bracket data is consistent (no invalid win counts).
 * @param bracket Array of matchups with winners
 * @returns Map of teamId -> number of wins
 * @throws Error if bracket data is invalid
 */
function calculateTeamWins(bracket: UserMatchup[]): Map<number, number> {
  const winCounts = new Map<number, number>();
  const seenMatchups = new Set<number>();

  // Sort matchups by round to ensure we process in order
  // from Round of 64 to Championship
  const sortedMatchups = bracket.sort((a, b) => {
    const rounds = [
      "Round of 64",
      "Round of 32",
      "Sweet 16",
      "Elite 8",
      "Final 4",
      "Championship",
    ];
    return rounds.indexOf(a.round) - rounds.indexOf(b.round);
  });

  // Count wins for each team
  for (const matchup of sortedMatchups) {
    // Ensure no duplicate matchups
    if (seenMatchups.has(matchup.id)) {
      throw new Error(`Duplicate matchup ID: ${matchup.id}`);
    }
    seenMatchups.add(matchup.id);

    if (matchup.winner) {
      const teamId = matchup.winner;
      if (isNaN(teamId) || teamId <= 0) {
        throw new Error(`Invalid team ID: ${matchup.winner}`);
      }

      // For each win, also verify that the team was in this matchup
      if (
        !matchup.bottomTeam?.id?.toString().includes(teamId.toString()) &&
        !matchup.topTeam?.id?.toString().includes(teamId.toString())
      ) {
        throw new Error(
          `Team ${teamId} won matchup ${matchup.id} but wasn't a participant`,
        );
      }

      winCounts.set(teamId, (winCounts.get(teamId) ?? 0) + 1);
    }
  }

  // Validate win counts
  for (const [teamId, wins] of winCounts) {
    if (wins > 6) {
      throw new Error(
        `Team ${teamId} has ${wins} wins, which is impossible in a March Madness bracket`,
      );
    }
  }

  // Validate that exactly one team has 6 wins (the champion)
  const champions = Array.from(winCounts.entries()).filter(
    ([, wins]) => wins === 6,
  );
  if (champions.length > 1) {
    throw new Error(
      "Multiple teams have 6 wins - only one team can be champion",
    );
  }
  if (sortedMatchups.length === 63 && champions.length === 0) {
    throw new Error(
      "No team has 6 wins - must have one champion in a complete bracket",
    );
  }

  return winCounts;
}

/**
 * Generate a hash of team IDs and their predicted win counts.
 * This is the value you'll store in the smart contract when submitting a bracket.
 * @param bracket The completed bracket predictions
 * @returns Hash of sorted team IDs and their win counts
 * @throws Error if bracket data is invalid
 */
export function getBracketHash(bracket: UserMatchup[]): string {
  const [teamIds, winCounts] = getBracketVerificationArrays(bracket);

  // Hash the sorted arrays using the same encoding as the smart contract
  return keccak256(
    encodeAbiParameters(
      [
        { type: "uint256[]" }, // team IDs
        { type: "uint256[]" }, // win counts
      ],
      [
        teamIds.map((id) => BigInt(id)),
        winCounts.map((count) => BigInt(count)),
      ],
    ),
  );
}

/**
 * Get the arrays of team IDs and win counts for verification.
 * These are the values you'll pass to the smart contract's verification function.
 * @param bracket The completed bracket predictions
 * @returns [teamIds, winCounts] - Sorted arrays of team IDs and their corresponding win counts
 * @throws Error if bracket data is invalid
 */
export function getBracketVerificationArrays(
  bracket: UserMatchup[],
): [number[], number[]] {
  if (!bracket?.length) {
    throw new Error("Empty or invalid bracket");
  }

  const winCounts = calculateTeamWins(bracket);

  // Convert to arrays and sort by team ID for consistent ordering
  const entries = Array.from(winCounts.entries()).sort(
    ([teamIdA], [teamIdB]) => teamIdA - teamIdB,
  );

  const teamIds = entries.map(([teamId]) => teamId);
  const wins = entries.map(([, wins]) => wins);

  // Validate arrays are same length and not empty
  if (teamIds.length === 0) {
    throw new Error("No winners selected in bracket");
  }
  if (teamIds.length !== wins.length) {
    throw new Error("Mismatch between team IDs and win counts");
  }

  return [teamIds, wins];
}

/**
 * Validate a bracket's data structure before hashing.
 * @param bracket The bracket to validate
 * @returns true if the bracket is valid
 * @throws Error with description if bracket is invalid
 */
export function validateBracket(bracket: UserMatchup[]): boolean {
  if (!bracket?.length) {
    throw new Error("Empty or invalid bracket");
  }

  // This will throw if any validation fails
  getBracketVerificationArrays(bracket);

  return true;
}
