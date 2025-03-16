import { expect } from "chai";
import { describe, it } from "mocha";
import { 
  generateValidBracket, 
  generateSimpleBracket, 
  generateHardcodedBracket, 
  validateBracketWinDistribution,
  calculateTeamWins,
  getBracketHash,
  getBracketVerificationArrays,
  UserMatchup
} from "../utils/enterTournamentWithTesters";

describe("Bracket Generation and Validation", function() {
  this.timeout(10000); // Some bracket generation might take time

  describe("Bracket Generation", () => {
    it("should generate a valid bracket with generateValidBracket", async () => {
      const bracket = await generateValidBracket();
      
      // Check that bracket is an array
      const isArray = Array.isArray(bracket);
      void expect(isArray).to.be.true;
      
      // Validate the win distribution
      const isValid = validateBracketWinDistribution(bracket);
      void expect(isValid).to.be.true;
    });

    it("should generate a valid bracket with generateSimpleBracket", () => {
      const bracket = generateSimpleBracket();
      
      // Check that bracket is an array
      const isArray = Array.isArray(bracket);
      void expect(isArray).to.be.true;
      
      // Validate the win distribution
      const isValid = validateBracketWinDistribution(bracket);
      void expect(isValid).to.be.true;
    });

    it("should generate a valid bracket with generateHardcodedBracket", () => {
      const bracket = generateHardcodedBracket();
      
      // Check that bracket is an array
      const isArray = Array.isArray(bracket);
      void expect(isArray).to.be.true;
      
      // Validate the win distribution
      const isValid = validateBracketWinDistribution(bracket);
      void expect(isValid).to.be.true;
    });
  });

  describe("Bracket Validation", () => {
    let validBracket: UserMatchup[];
    
    before(async () => {
      // Generate a known valid bracket for testing
      validBracket = await generateValidBracket();
    });

    it("should correctly validate a valid bracket", () => {
      const isValid = validateBracketWinDistribution(validBracket);
      void expect(isValid).to.be.true;
    });

    it("should reject an invalid bracket with wrong win distribution", () => {
      // Create an invalid bracket with two champions
      const invalidBracket: UserMatchup[] = [
        // Round of 64
        { id: 401638599, round: "Round of 64", topTeam: { id: "51" }, bottomTeam: { id: "66" }, winner: "51" },
        { id: 401638586, round: "Round of 64", topTeam: { id: "1" }, bottomTeam: { id: "16" }, winner: "1" },
        { id: 401638600, round: "Round of 64", topTeam: { id: "101" }, bottomTeam: { id: "116" }, winner: "101" },
        { id: 401638601, round: "Round of 64", topTeam: { id: "151" }, bottomTeam: { id: "166" }, winner: "151" },
        
        // Round of 32
        { id: 401638630, round: "Round of 32", topTeam: { id: "51" }, bottomTeam: { id: "1" }, winner: "51" },
        { id: 401638626, round: "Round of 32", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "101" },
        
        // Sweet 16
        { id: 401638633, round: "Sweet 16", topTeam: { id: "51" }, bottomTeam: { id: "101" }, winner: "51" },
        { id: 401638634, round: "Sweet 16", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "101" },
        
        // Elite 8
        { id: 401638635, round: "Elite 8", topTeam: { id: "51" }, bottomTeam: { id: "101" }, winner: "51" },
        { id: 401638636, round: "Elite 8", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "101" },
        
        // Final Four
        { id: 401638637, round: "Final Four", topTeam: { id: "51" }, bottomTeam: { id: "101" }, winner: "51" },
        { id: 401638638, round: "Final Four", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "101" },
        
        // Championship - both teams win, creating two champions
        { id: 401638645, round: "Championship", topTeam: { id: "51" }, bottomTeam: { id: "101" }, winner: "51" },
        { id: 401638646, round: "Championship", topTeam: { id: "101" }, bottomTeam: { id: "151" }, winner: "101" }
      ];
      
      // This should create an invalid bracket with 2 champions
      const winCounts = calculateTeamWins(invalidBracket);
      const championCount = Array.from(winCounts.entries())
        .filter(([, wins]) => wins >= 6).length;
      
      // Verify we've created an invalid bracket
      void expect(championCount).to.be.greaterThan(1);
      
      // Now validate it - should fail
      const isValid = validateBracketWinDistribution(invalidBracket);
      void expect(isValid).to.be.false;
    });
  });

  describe("Team Win Calculation", () => {
    let validBracket: UserMatchup[];
    
    before(async () => {
      validBracket = generateHardcodedBracket(); // Use hardcoded bracket for consistent results
    });

    it("should correctly calculate team wins", () => {
      const winCounts = calculateTeamWins(validBracket);
      
      // Check that we have the correct win distribution
      const winDistribution = new Map<number, number>();
      for (const wins of winCounts.values()) {
        winDistribution.set(wins, (winDistribution.get(wins) ?? 0) + 1);
      }
      
      // Check for the champion (6 wins)
      const championCount = winDistribution.get(6) === 1;
      void expect(championCount).to.be.true;
      
      // Check for the runner-up (5 wins)
      const runnerUpCount = winDistribution.get(5) === 1;
      void expect(runnerUpCount).to.be.true;
      
      // Check for Final Four losers (4 wins)
      const finalFourCount = winDistribution.get(4) === 2;
      void expect(finalFourCount).to.be.true;
      
      // Check for Elite Eight losers (3 wins)
      const eliteEightCount = winDistribution.get(3) === 4;
      void expect(eliteEightCount).to.be.true;
      
      // Check for Sweet Sixteen losers (2 wins)
      const sweetSixteenCount = winDistribution.get(2) === 8;
      void expect(sweetSixteenCount).to.be.true;
      
      // Check for Round of 32 losers (1 win)
      const roundOf32Count = winDistribution.get(1) === 16;
      void expect(roundOf32Count).to.be.true;
    });
  });

  describe("Bracket Hash Generation", () => {
    let validBracket: UserMatchup[];
    let anotherValidBracket: UserMatchup[];
    
    before(async () => {
      validBracket = generateHardcodedBracket(); // Use hardcoded bracket for consistent results
      
      // Create a different bracket by directly modifying a matchup
      anotherValidBracket = JSON.parse(JSON.stringify(validBracket)); // Deep clone
      
      // Find a Round of 64 matchup
      const roundOf64Index = anotherValidBracket.findIndex(m => m.round === "Round of 64");
      
      if (roundOf64Index >= 0) {
        // Swap the winner to the other team
        const matchup = anotherValidBracket[roundOf64Index];
        const currentWinner = matchup.winner;
        const newWinner = currentWinner === matchup.topTeam?.id 
          ? matchup.bottomTeam?.id || null
          : matchup.topTeam?.id || null;
        
        // Ensure we're actually changing the winner
        if (newWinner !== currentWinner) {
          anotherValidBracket[roundOf64Index] = {
            ...matchup,
            winner: newWinner
          };
          
          // Log the change to verify
          console.log(`Changed winner in matchup ${matchup.id} from ${currentWinner} to ${newWinner}`);
        } else {
          console.error("Failed to change winner - both options are the same");
        }
      } else {
        console.error("No Round of 64 matchup found");
      }
    });

    it("should generate a consistent hash for the same bracket", () => {
      const hash1 = getBracketHash(validBracket);
      const hash2 = getBracketHash(validBracket);
      
      const hashesMatch = hash1 === hash2;
      void expect(hashesMatch).to.be.true;
    });

    it("should generate different hashes for different brackets", () => {
      const hash1 = getBracketHash(validBracket);
      const hash2 = getBracketHash(anotherValidBracket);
      
      // The hashes should be different for different brackets
      const hashesAreDifferent = hash1 !== hash2;
      void expect(hashesAreDifferent).to.be.true;
    });

    it("should correctly extract team IDs and win counts", () => {
      const [teamIds, winCounts] = getBracketVerificationArrays(validBracket);
      
      // Check that arrays are the same length
      const arraysHaveSameLength = teamIds.length === winCounts.length;
      void expect(arraysHaveSameLength).to.be.true;
      
      // Check that team IDs are sorted
      let teamIdsAreSorted = true;
      for (let i = 1; i < teamIds.length; i++) {
        if (teamIds[i] <= teamIds[i-1]) {
          teamIdsAreSorted = false;
          break;
        }
      }
      void expect(teamIdsAreSorted).to.be.true;
      
      // Check that win counts are valid (0-6)
      let winCountsAreValid = true;
      for (const wins of winCounts) {
        if (wins < 0 || wins > 6) {
          winCountsAreValid = false;
          break;
        }
      }
      void expect(winCountsAreValid).to.be.true;
    });
  });
}); 