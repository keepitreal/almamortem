// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BracketNFT} from "./BracketNFT.sol";
import {GameScoreOracle} from "./GameScoreOracle.sol";
/**
 * @title TournamentManager
 * @notice Manages tournament creation, entry fees, and prize distribution
 */
contract TournamentManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom Errors
    error InvalidNFTAddress();
    error InvalidTreasuryAddress();
    error InvalidGameScoreOracleAddress();
    error StartTimeMustBeInFuture();
    error TournamentAlreadyStarted();
    error IncorrectETHAmount();
    error DevFeeTransferFailed();
    error ETHNotAccepted();
    error OnlyGameScoreOracle();
    error TournamentNotEnded();
    error TooManyWinners();
    error WinnersPrizesLengthMismatch();
    error PrizesExceedPool();
    error PrizeTransferFailed();
    error InvalidWinCounts();
    error InvalidTeamId();
    error TeamIdsWinCountsLengthMismatch();
    error InvalidHash();
    error IncompatibleEmergencyRefundState();
    error BracketAlreadyRefunded();
    error RefundFailed();
    error BracketAlreadyScored();

    // Structs
    struct Tournament {
        uint256 entryFee;
        address paymentToken;      // address(0) for ETH
        uint256 startTime;
        uint256 prizePool;
        uint256 totalEntries;
        uint256 developerFeeAccrued; // Track developer fee separately
        address[] winners;         // Ordered list of winners (max 3)
    }

    // Constants
    uint256 public constant DEVELOPER_FEE = 1000;  // 10% (basis points)
    uint256 public constant MAX_WINNERS = 3;       // Configurable number of winners
    address public immutable BRACKET_NFT;
    GameScoreOracle public gameScoreOracle;
    address public developerTreasury;

    // State variables
    mapping(uint256 => Tournament) public tournaments;
    uint256 public nextTournamentId;
    mapping(uint256 tournamentId => uint256[] sortedTokenIdsByScore) public tournamentWinners;
    mapping(uint256 tournamentId => uint256[] sortedScores) public tournamentScores;

    // In the event of a catastrophic event, we can enable emergency refunds for all players
    bool public emergencyRefundEnabled;
    mapping(uint256 tokenId => bool isRefunded) public isRefunded;

    // Modifiers
    modifier onlyGameScoreOracle() {
        if (msg.sender != address(gameScoreOracle)) revert OnlyGameScoreOracle();
        _;
    }

    // Events
    event TournamentCreated(
        uint256 indexed tournamentId,
        uint256 entryFee,
        address paymentToken,
        uint256 startTime
    );
    event BracketEntered(
        uint256 indexed tournamentId,
        address indexed participant,
        uint256 indexed tokenId
    );
    event TournamentFinalized(
        uint256 indexed tournamentId,
        address[] winners,
        uint256[] prizes
    );
    event GameScoreOracleUpdated(address indexed oldGameScoreOracle, address indexed newGameScoreOracle);
    event EmergencyRefundEnabledStateChange(bool enabled);
    event DeveloperFeePaid(uint256 indexed tournamentId, uint256 amount);

    constructor(address _bracketNFT, address _treasury, address _gameScoreOracle) Ownable(msg.sender) {
        if (_bracketNFT == address(0)) revert InvalidNFTAddress();
        if (_treasury == address(0)) revert InvalidTreasuryAddress();
        if (_gameScoreOracle == address(0)) revert InvalidGameScoreOracleAddress();
        BRACKET_NFT = _bracketNFT;
        developerTreasury = _treasury;
        gameScoreOracle = GameScoreOracle(_gameScoreOracle);
    }

    // Tournament Management Functions
    function createTournament(
        uint256 entryFee,
        address paymentToken,
        uint256 startTime
    ) external onlyOwner returns (uint256) {
        if (startTime <= block.timestamp) revert StartTimeMustBeInFuture();

        uint256 tournamentId = nextTournamentId++;
        tournaments[tournamentId] = Tournament({
            entryFee: entryFee,
            paymentToken: paymentToken,
            startTime: startTime,
            prizePool: 0,
            totalEntries: 0,
            developerFeeAccrued: 0,
            winners: new address[](0)
        });

        emit TournamentCreated(
            tournamentId,
            entryFee,
            paymentToken,
            startTime
        );

        return tournamentId;
    }

    function enterTournament(
        address participant,
        uint256 tournamentId,
        bytes32 bracketHash,
        uint256 tiebreaker,
        string calldata bracketURI
    ) external payable nonReentrant returns (uint256) {
        Tournament storage tournament = tournaments[tournamentId];
        
        if (block.timestamp >= tournament.startTime) revert TournamentAlreadyStarted();
        
        // Handle entry fee
        if (tournament.paymentToken == address(0)) {
            if (msg.value != tournament.entryFee) revert IncorrectETHAmount();
            uint256 devFee = (msg.value * DEVELOPER_FEE) / 10000;
            tournament.prizePool += msg.value - devFee;
            tournament.developerFeeAccrued += devFee;
        } else {
            if (msg.value != 0) revert ETHNotAccepted();
            uint256 beforeBalance = IERC20(tournament.paymentToken).balanceOf(address(this));
            IERC20(tournament.paymentToken).safeTransferFrom(
                participant,
                address(this),
                tournament.entryFee
            );
            uint256 received = IERC20(tournament.paymentToken).balanceOf(address(this)) - beforeBalance;
            uint256 devFee = (received * DEVELOPER_FEE) / 10000;
            tournament.prizePool += received - devFee;
            tournament.developerFeeAccrued += devFee;
        }

        // Mint bracket NFT
        uint256 tokenId = BracketNFT(BRACKET_NFT).mintBracket(
            participant,
            tournamentId,
            bracketHash,
            tiebreaker,
            bracketURI
        );

        tournament.totalEntries++;

        emit BracketEntered(tournamentId, participant, tokenId);
        
        return tokenId;
    }

    function finalizeTournament(
        uint256 tournamentId,
        address[] calldata winners,
        uint256[] calldata prizes
    ) external {
        if (emergencyRefundEnabled) revert IncompatibleEmergencyRefundState();
        if (!GameScoreOracle(gameScoreOracle).isTournamentOver()) revert TournamentNotEnded();
        Tournament storage tournament = tournaments[tournamentId];
        
        if (winners.length > MAX_WINNERS) revert TooManyWinners();
        if (winners.length != prizes.length) revert WinnersPrizesLengthMismatch();

        uint256 totalPrizes;
        for (uint256 i = 0; i < prizes.length; i++) {
            totalPrizes += prizes[i];
        }
        if (totalPrizes > tournament.prizePool) revert PrizesExceedPool();

        tournament.winners = winners;

        // Distribute prizes
        for (uint256 i = 0; i < winners.length; i++) {
            if (tournament.paymentToken == address(0)) {
                (bool success, ) = winners[i].call{value: prizes[i]}("");
                if (!success) revert PrizeTransferFailed();
            } else {
                IERC20(tournament.paymentToken).safeTransfer(winners[i], prizes[i]);
            }
        }

        // Now that the tournament is finalized, pay out the developer fee
        if (tournament.developerFeeAccrued > 0) {
            if (tournament.paymentToken == address(0)) {
                (bool success, ) = developerTreasury.call{value: tournament.developerFeeAccrued}("");
                if (!success) revert DevFeeTransferFailed();
            } else {
                IERC20(tournament.paymentToken).safeTransfer(developerTreasury, tournament.developerFeeAccrued);
            }
            emit DeveloperFeePaid(tournamentId, tournament.developerFeeAccrued);
            tournament.developerFeeAccrued = 0;
        }

        emit TournamentFinalized(tournamentId, winners, prizes);
    }

    // View Functions
    function getTournament(uint256 tournamentId) external view returns (
        uint256 entryFee,
        address paymentToken,
        uint256 startTime,
        uint256 prizePool,
        uint256 totalEntries,
        uint256 developerFeeAccrued,
        address[] memory winners
    ) {
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.entryFee,
            tournament.paymentToken,
            tournament.startTime,
            tournament.prizePool,
            tournament.totalEntries,
            tournament.developerFeeAccrued,
            tournament.winners
        );
    }

    /**
     * @notice Score a bracket by verifying team IDs and win counts match the stored hash
     * @param tokenId The ID of the bracket NFT to score
     * @param teamIds Array of team IDs in the bracket
     * @param winCounts Array of predicted win counts for each team
     * @return score The number of points earned based on correct picks (max 192)
     */
    function scoreBracket(
        uint256 tokenId,
        uint256[] calldata teamIds,
        uint256[] calldata winCounts
    ) public view returns (uint256) {
        // Validate array lengths match
        if (teamIds.length != winCounts.length) revert TeamIdsWinCountsLengthMismatch();

        // Validate team IDs and win counts
        uint256 championCount = 0;
        for (uint256 i = 0; i < teamIds.length; i++) {
            // Validate team ID
            if (teamIds[i] == 0) revert InvalidTeamId();
            
            // Validate win count
            if (winCounts[i] > 6) revert InvalidWinCounts();
            if (winCounts[i] == 6) championCount++;
        }

        // Ensure exactly one champion (if we have any teams with wins)
        if (teamIds.length > 0 && championCount != 1) revert InvalidWinCounts();

        // Invalid hashes get a score of 0
        if (!hashMatches(tokenId, teamIds, winCounts)) return 0;

        // Calculate score based on standard scoring formula
        uint256 score = 0;
        for (uint256 i = 0; i < teamIds.length; i++) {
            uint8 actualWins = GameScoreOracle(gameScoreOracle).getTeamWins(teamIds[i]);
            // For each actual win up to the predicted number, add points based on the round
            for (uint8 win = 1; win <= actualWins && win <= winCounts[i]; win++) {
                // Points = 2^round where round starts at 1
                // win 1 = round 1 (1 point)
                // win 2 = round 2 (2 points)
                // win 3 = round 3 (4 points)
                // win 4 = round 4 (8 points)
                // win 5 = round 5 (16 points)
                // win 6 = round 6 (32 points)
                score += 1 << (win - 1);
            }
        }

        return score;
    }

    function submitBracketForFinalScoring(uint256 tokenId, uint256[] calldata teamIds, uint256[] calldata winCounts) external {
        // Safety checks
        if (emergencyRefundEnabled) revert IncompatibleEmergencyRefundState();
        if (!GameScoreOracle(gameScoreOracle).isTournamentOver()) revert TournamentNotEnded();
        if (BracketNFT(BRACKET_NFT).isScoreSubmitted(tokenId)) revert BracketAlreadyScored();
        if (!hashMatches(tokenId, teamIds, winCounts)) revert InvalidHash();
        
        // Set the bracket as scored
        BracketNFT(BRACKET_NFT).setIsScoreSubmitted(tokenId);

        // Score the bracket
        uint256 score = scoreBracket(tokenId, teamIds, winCounts);

        // Get tournament ID from the bracket
        uint256 tournamentId = BracketNFT(BRACKET_NFT).bracketTournaments(tokenId);

        // Get current arrays
        uint256[] storage winners = tournamentWinners[tournamentId];
        uint256[] storage scores = tournamentScores[tournamentId];

        // Find insertion point to maintain descending order
        uint256 insertAt = scores.length;
        for (uint256 i = 0; i < scores.length; i++) {
            if (score > scores[i]) {
                insertAt = i;
                break;
            }
        }

        // Extend both arrays by one
        winners.push();
        scores.push();

        // Shift elements in both arrays
        for (uint256 i = scores.length - 1; i > insertAt; i--) {
            scores[i] = scores[i-1];
            winners[i] = winners[i-1];
        }

        // Insert new score and tokenId at the same position
        scores[insertAt] = score;
        winners[insertAt] = tokenId;
    }

    function hashMatches(uint256 tokenId, uint256[] calldata teamIds, uint256[] calldata winCounts) public view returns (bool) {
        bytes32 storedHash = BracketNFT(BRACKET_NFT).bracketHashes(tokenId);
        bytes32 hash = keccak256(abi.encode(teamIds, winCounts));
        return hash == storedHash;
    }

    function refundBracket(uint256 tokenId) external nonReentrant {
        if (!emergencyRefundEnabled) revert IncompatibleEmergencyRefundState();
        if (isRefunded[tokenId]) revert BracketAlreadyRefunded();
        isRefunded[tokenId] = true;
        
        address owner = BracketNFT(BRACKET_NFT).ownerOf(tokenId);
        uint256 tournamentId = BracketNFT(BRACKET_NFT).bracketTournaments(tokenId);
        Tournament storage tournament = tournaments[tournamentId];
        
        // Refund the full entry fee
        if (tournament.paymentToken == address(0)) {
            (bool success, ) = owner.call{value: tournament.entryFee}("");
            if (!success) revert RefundFailed();
        } else {
            IERC20(tournament.paymentToken).safeTransfer(owner, tournament.entryFee);
        }
        
        // Adjust the prize pool and developer fee to account for the refund
        uint256 devFee = (tournament.entryFee * DEVELOPER_FEE) / 10000;
        uint256 prizeAmount = tournament.entryFee - devFee;
        
        tournament.prizePool -= prizeAmount;
        tournament.developerFeeAccrued -= devFee;
    }

    // View function to get tournament winners array
    function getTournamentWinners(uint256 tournamentId) external view returns (uint256[] memory) {
        uint256[] storage winners = tournamentWinners[tournamentId];
        uint256[] memory result = new uint256[](winners.length);
        for (uint256 i = 0; i < winners.length; i++) {
            result[i] = winners[i];
        }
        return result;
    }

    function getTournamentScores(uint256 tournamentId) external view returns (uint256[] memory) {
        uint256[] storage scores = tournamentScores[tournamentId];
        uint256[] memory result = new uint256[](scores.length);
        for (uint256 i = 0; i < scores.length; i++) {
            result[i] = scores[i];
        }
        return result;
    }

    function setEmergencyRefundEnabled(bool enabled) external onlyOwner {
        emergencyRefundEnabled = enabled;
        emit EmergencyRefundEnabledStateChange(enabled);
    }

    // In the event something goes wrong with the ESPN API, we can set a new game score oracle
    function setGameScoreOracle(address _gameScoreOracle) external onlyOwner {
        if (_gameScoreOracle == address(0)) revert InvalidGameScoreOracleAddress();
        address oldGameScoreOracle = address(gameScoreOracle);
        gameScoreOracle = GameScoreOracle(_gameScoreOracle);
        emit GameScoreOracleUpdated(oldGameScoreOracle, _gameScoreOracle);
    }

    // Receive function to accept ETH
    receive() external payable {}
}