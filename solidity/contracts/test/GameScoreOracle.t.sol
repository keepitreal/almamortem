// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {GameScoreOracle} from "../src/GameScoreOracle.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";

// Helper contract to expose internal functions for testing
contract GameScoreOracleExposed is GameScoreOracle {
    constructor(address router_) GameScoreOracle(router_) {}

    function exposed_fulfillRequest(bytes32 requestId, bytes memory response) public {
        fulfillRequest(requestId, response, "");
    }
}

contract MockRouter {
    function getConfig() external pure returns (uint8, uint8, uint32, uint32, uint32, uint96, uint32, uint32) {
        return (0, 0, 0, 0, 0, 0, 0, 0);
    }
}

contract GameScoreOracleTest is Test {
    GameScoreOracleExposed public oracle;
    MockRouter public router;

    // Real tournament data sample
    string constant SAMPLE_DATA = "000c2001520026100296002b100422004d1007f1009630098400992009c200e4300ef100f5100f8200fb10100101091010d201481014d401643087810888108ca208cd10901109a9109b3109cd50a493";

    function setUp() public {
        router = new MockRouter();
        oracle = new GameScoreOracleExposed(address(router));
    }

    function testRealTournamentData() public {
        oracle.exposed_fulfillRequest(bytes32(0), bytes(SAMPLE_DATA));

        // Test a sampling of teams and their win counts
        // Team 12 (000c) should have 2 wins
        assertEq(oracle.getTeamWins(12), 2, "Team 12 wins");
        
        // Team 21 (0015) should have 2 wins
        assertEq(oracle.getTeamWins(21), 2, "Team 21 wins");
        
        // Team 41 (0029) should have 6 wins
        assertEq(oracle.getTeamWins(41), 6, "Team 41 wins");
        
        // Team 150 (0096) should have 3 wins
        assertEq(oracle.getTeamWins(150), 3, "Team 150 wins");
        
        // Team 152 (0098) should have 4 wins
        assertEq(oracle.getTeamWins(152), 4, "Team 152 wins");
        
        // Team 2509 (09cd) should have 5 wins
        assertEq(oracle.getTeamWins(2509), 5, "Team 2509 wins");
        
        // Team 2633 (0a49) should have 3 wins
        assertEq(oracle.getTeamWins(2633), 3, "Team 2633 wins");

        // Verify some teams that should have specific win counts
        assertEq(oracle.getTeamWins(228), 3, "Team 228 wins");
        assertEq(oracle.getTeamWins(333), 4, "Team 333 wins");
        assertEq(oracle.getTeamWins(356), 3, "Team 356 wins");
    }

    function testDataFormat() public {
        // Verify each 5-character group is properly formatted
        bytes memory data = bytes(SAMPLE_DATA);
        uint256 numTeams = data.length / 5;
        
        for(uint256 i = 0; i < numTeams; i++) {
            // Each group should be 5 valid hex characters
            for(uint256 j = 0; j < 5; j++) {
                bytes1 c = data[i * 5 + j];
                assertTrue(
                    (c >= "0" && c <= "9") || 
                    (c >= "a" && c <= "f"),
                    "Invalid hex character"
                );
            }
        }
    }

    function testAllTeamsHaveValidWins() public {
        oracle.exposed_fulfillRequest(bytes32(0), bytes(SAMPLE_DATA));
        
        bytes memory data = bytes(SAMPLE_DATA);
        uint256 numTeams = data.length / 5;
        
        for(uint256 i = 0; i < numTeams; i++) {
            string memory teamHex = string(bytes.concat(
                data[i * 5],
                data[i * 5 + 1],
                data[i * 5 + 2],
                data[i * 5 + 3],
                data[i * 5 + 4]
            ));
            
            uint256 packed = uint256(_parseHexString(teamHex));
            uint256 teamId = packed >> 4;
            uint8 wins = uint8(packed & 0xF);
            
            // Verify win count is valid (0-6 for tournament)
            assertTrue(wins <= 6, "Win count exceeds maximum");
            
            // Verify stored win count matches packed data
            if (wins > 0) {
                assertEq(oracle.getTeamWins(teamId), wins, "Stored wins mismatch");
            }
        }
    }

    function testSetTournamentOver() public {
        // First verify tournament is not over initially
        assertFalse(oracle.isTournamentOver(), "Tournament should not be over initially");

        // Load sample data which has team 41 with 6 wins
        oracle.exposed_fulfillRequest(bytes32(0), bytes(SAMPLE_DATA));
        
        // Try with a team that has less than 6 wins (team 12 has 2 wins)
        oracle.setIsTournamentOver(12);
        assertFalse(oracle.isTournamentOver(), "Tournament should not be over with team having 2 wins");

        // Set tournament over with team 41 which has 6 wins
        oracle.setIsTournamentOver(41);
        assertTrue(oracle.isTournamentOver(), "Tournament should be over with team having 6 wins");
    }

    function testSetTournamentOverWithNoWins() public {
        // Try to set tournament over with a team that doesn't exist in the data
        oracle.setIsTournamentOver(99999);
        assertFalse(oracle.isTournamentOver(), "Tournament should not be over with non-existent team");
        
        // Load data but try with a team that has no wins
        oracle.exposed_fulfillRequest(bytes32(0), bytes(SAMPLE_DATA));
        oracle.setIsTournamentOver(99999);
        assertFalse(oracle.isTournamentOver(), "Tournament should not be over with team having 0 wins");
    }

    function _parseHexString(string memory str) internal pure returns (uint256) {
        bytes memory strBytes = bytes(str);
        uint256 result = 0;
        for(uint i = 0; i < strBytes.length; i++) {
            result = result * 16 + _hexCharToUint(strBytes[i]);
        }
        return result;
    }

    function _hexCharToUint(bytes1 c) internal pure returns (uint8) {
        if (uint8(c) >= 48 && uint8(c) <= 57) {  // 0-9
            return uint8(c) - 48;
        }
        if (uint8(c) >= 97 && uint8(c) <= 102) {  // a-f
            return uint8(c) - 87;
        }
        revert("Invalid hex character");
    }

    function testGetTeamWinsBatch() public {
        // Load the sample data
        oracle.exposed_fulfillRequest(bytes32(0), bytes(SAMPLE_DATA));

        // Create an array of team IDs to test, including:
        // - Teams we know have wins
        // - Teams with different win counts
        // - Teams that don't exist in the data
        uint256[] memory teamIds = new uint256[](7);
        teamIds[0] = 12;    // Should have 2 wins
        teamIds[1] = 41;    // Should have 6 wins (champion)
        teamIds[2] = 150;   // Should have 3 wins
        teamIds[3] = 2509;  // Should have 5 wins
        teamIds[4] = 99999; // Should have 0 wins (doesn't exist)
        teamIds[5] = 152;   // Should have 4 wins
        teamIds[6] = 2633;  // Should have 3 wins

        // Get the win counts in batch
        uint8[] memory winCounts = oracle.getTeamWinsBatch(teamIds);

        // Verify array length matches
        assertEq(winCounts.length, teamIds.length, "Win counts array length should match team IDs length");

        // Verify each win count matches what we expect
        assertEq(winCounts[0], 2, "Team 12 should have 2 wins");
        assertEq(winCounts[1], 6, "Team 41 should have 6 wins");
        assertEq(winCounts[2], 3, "Team 150 should have 3 wins");
        assertEq(winCounts[3], 5, "Team 2509 should have 5 wins");
        assertEq(winCounts[4], 0, "Non-existent team should have 0 wins");
        assertEq(winCounts[5], 4, "Team 152 should have 4 wins");
        assertEq(winCounts[6], 3, "Team 2633 should have 3 wins");

        // Verify empty array case
        uint256[] memory emptyArray = new uint256[](0);
        uint8[] memory emptyResult = oracle.getTeamWinsBatch(emptyArray);
        assertEq(emptyResult.length, 0, "Empty input should return empty array");
    }
} 