// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract GameScoreOracle is ConfirmedOwner, FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    string public constant SOURCE =
        "const teamWinCounts = {};"
        "async function fetchAndProcessData(dateRange) {"
        "  const apiResponse = await Functions.makeHttpRequest({"
        "    url: `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${dateRange}`"
        "  });"
        "  if (apiResponse.error) throw Error(\"Request failed\");"
        "  const { data } = apiResponse;"
        "  if (!data.events) return;"
        "  data.events.forEach(event => {"
        "    const competition = event.competitions[0];"
        "    if (!competition || !competition.competitors || competition.type?.id !== \"6\") return;"
        "    if (competition.notes && competition.notes.some(note => note.headline.toLowerCase().includes(\"first four\"))) return;"
        "    competition.competitors.forEach(team => {"
        "      if (team.winner) {"
        "        const teamId = parseInt(team.team.id);"
        "        teamWinCounts[teamId] = (teamWinCounts[teamId] || 0) + 1;"
        "      }"
        "    });"
        "  });"
        "}"
        "const dateRanges = ["
        "  \"20240321-20240327\","
        "  \"20240328-20240403\","
        "  \"20240404-20240410\""
        "];"
        "for (const range of dateRanges) {"
        "  await fetchAndProcessData(range);"
        "}"
        "function packData(teamId, wins) {"
        "  return ((BigInt(teamId) & 0xFFFFn) << 4n) | (BigInt(wins) & 0xFn);"
        "}"
        "const packedResults = Object.entries(teamWinCounts)"
        "  .filter(([_, wins]) => wins > 0)"
        "  .map(([teamId, wins]) => packData(teamId, wins).toString(16).padStart(5, '0'))"
        "  .join('');"
        "return Functions.encodeString(packedResults);"
    ;

    // cooldown before wins can be requested again
    uint256 public constant WIN_UPDATE_COOLDOWN = 10 minutes;
    
    // Last time any wins were updated
    uint256 public lastUpdateTimestamp;

    // data returned from the oracle representing the number of wins for each team
    bytes public packedTeamDataBytes;

    // true if the tournament has ended
    bool public isTournamentOver;

    ////////////////////////////////////
    ///////////    EVENTS    ///////////
    ////////////////////////////////////
    event WinsUpdateRequested(bytes32 indexed requestId);
    event WinsUpdated(bytes32 indexed requestId);
    event WinUpdateError(bytes32 indexed requestId, bytes error);
    event TournamentOver(uint256 indexed winningTeamId);

    error CoolDownNotMet();
    error TeamNotFound();

    constructor(
        address router_
    )
    FunctionsClient(router_)
    ConfirmedOwner(msg.sender) {}

    function getTeamWins(uint256 teamId) public view returns (uint8) {
        bytes memory data = packedTeamDataBytes;
        uint256 numTeams = data.length / 5;
        
        for(uint256 i = 0; i < numTeams; i++) {
            // Parse team ID from first 4 characters (16 bits)
            uint256 currentTeamId = 0;
            for(uint256 j = 0; j < 4; j++) {
                uint8 digit = uint8(data[i * 5 + j]);
                // Convert ASCII hex to value
                digit = digit >= 97 ? digit - 87 : digit - 48;
                currentTeamId = currentTeamId * 16 + digit;
            }
            
            if (currentTeamId == teamId) {
                // Parse wins from last character (4 bits)
                uint8 winsDigit = uint8(data[i * 5 + 4]);
                // Convert ASCII hex to value
                return winsDigit >= 97 ? winsDigit - 87 : winsDigit - 48;
            }
        }
        
        return 0; // Return 0 if team not found
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

    /**
     * @notice Send a request to update team win counts
     * @param args List of arguments accessible from within the source code
     * @param subscriptionId Billing ID
     * @param gasLimit Gas limit for the request
     * @param jobId bytes32 representation of donId
     */
    function fetchTeamWins(
        string[] memory args,
        uint64 subscriptionId,
        uint32 gasLimit,
        bytes32 jobId
    ) external returns (bytes32 requestId) {
        if (timeUntilCooldownExpires() > 0) {
            revert CoolDownNotMet();
        }

        // Update timestamp before making request
        lastUpdateTimestamp = block.timestamp;

        // create a chainlink request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        if (args.length > 0) req.setArgs(args);
        
        // Send the request
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            jobId
        );
        
        emit WinsUpdateRequested(requestId);
    }

    function timeUntilCooldownExpires() public view returns (uint256) {
        if (lastUpdateTimestamp == 0) return 0;
        uint256 timeSinceLastRequest = block.timestamp - lastUpdateTimestamp;
        if (timeSinceLastRequest >= WIN_UPDATE_COOLDOWN) {
            return 0;
        } else {
            return WIN_UPDATE_COOLDOWN - timeSinceLastRequest;
        }
    }

    function setIsTournamentOver(uint256 teamId) external {
        // if a team has 6 wins, the tournament is over
        if (getTeamWins(teamId) >= 6) {
            isTournamentOver = true;
            emit TournamentOver(teamId);
        }
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            emit WinUpdateError(requestId, err);
            return;
        }
        
        lastUpdateTimestamp = block.timestamp;

        packedTeamDataBytes = response;
        
        emit WinsUpdated(requestId);
    }
}
