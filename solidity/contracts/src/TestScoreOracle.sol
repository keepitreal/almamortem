// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TestScoreOracle is Ownable {
    // Last time any wins were updated
    uint256 public lastUpdateTimestamp;

    // true if the tournament has ended
    bool public isTournamentOver;

    address public router;

    mapping(uint256 teamId => uint8 wins) public teamWins;

    ////////////////////////////////////
    ///////////    EVENTS    ///////////
    ////////////////////////////////////
    event WinsUpdateRequested(bytes32 indexed requestId);
    event WinsUpdated(bytes32 indexed requestId);
    event TournamentOver(uint256 indexed winningTeamId);

    constructor(address owner_) Ownable(owner_) {}

    function getTeamWins(uint256 teamId) public view returns (uint8) {
      return teamWins[teamId];
    }

    /**
     * @notice Get win counts for multiple teams in one call
     * @param teamIds Array of team IDs to get win counts for
     * @return winCounts Array of win counts in the same order as the input team IDs
     */
    function getTeamWinsBatch(uint256[] calldata teamIds) external view returns (uint8[] memory) {
        uint8[] memory winCounts = new uint8[](teamIds.length);
        
        for(uint256 i = 0; i < teamIds.length; i++) {
            winCounts[i] = getTeamWins(teamIds[i]);
        }
        
        return winCounts;
    }

    function fetchTeamWins(
        string[] memory,
        uint64,
        uint32,
        bytes32
    ) external returns (bytes32 requestId) {
        // generate a random bytes32 requestId
        requestId = bytes32(uint256(uint160(msg.sender)) | block.timestamp);

        // Update timestamp before making request
        lastUpdateTimestamp = block.timestamp; 
        emit WinsUpdateRequested(requestId);
    }

    function setIsTournamentOver(uint256 teamId) external {
        // if a team has 6 wins, the tournament is over
        if (getTeamWins(teamId) >= 6) {
            isTournamentOver = true;
            emit TournamentOver(teamId);
        }
    }

    function setTeamWins(uint256 teamId, uint8 wins) external onlyOwner {
        teamWins[teamId] = wins;
        emit WinsUpdated(bytes32(uint256(uint160(msg.sender)) | block.timestamp));
    }
}
