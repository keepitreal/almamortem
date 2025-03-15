// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TournamentManager} from "../src/TournamentManager.sol";
import {BracketNFT} from "../src/BracketNFT.sol";
import {GameScoreOracle} from "../src/GameScoreOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {}
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

string constant SAMPLE_DATA = "000c2001520026100296002b100422004d1007f1009630098400992009c200e4300ef100f5100f8200fb10100101091010d201481014d401643087810888108ca208cd10901109a9109b3109cd50a493";

contract TournamentManagerTest is Test {
    TournamentManager public manager;
    BracketNFT public nft;
    GameScoreOracle public oracle;
    MockERC20 public token;
    
    address public treasury;
    address public user1;
    address public user2;
    address public constant MOCK_ROUTER = address(1); // Mock Chainlink Functions Router
    
    function setUp() public {
        // Deploy mock contracts and set up test environment
        treasury = makeAddr("treasury");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        vm.startPrank(address(this));
        nft = new BracketNFT();
        oracle = new GameScoreOracle(MOCK_ROUTER);
        token = new MockERC20();
        manager = new TournamentManager(
            address(nft),
            treasury,
            address(oracle)
        );
        
        // Setup roles and permissions
        nft.setTournamentManager(address(manager));
        vm.stopPrank();
    }

    function testConstructorErrors() public {
        // Test InvalidNFTAddress
        vm.expectRevert(TournamentManager.InvalidNFTAddress.selector);
        new TournamentManager(address(0), treasury, address(oracle));

        // Test InvalidTreasuryAddress
        vm.expectRevert(TournamentManager.InvalidTreasuryAddress.selector);
        new TournamentManager(address(nft), address(0), address(oracle));

        // Test InvalidGameScoreOracleAddress
        vm.expectRevert(TournamentManager.InvalidGameScoreOracleAddress.selector);
        new TournamentManager(address(nft), treasury, address(0));
    }

    function testCreateTournamentErrors() public {
        // Test StartTimeMustBeInFuture
        vm.expectRevert(TournamentManager.StartTimeMustBeInFuture.selector);
        manager.createTournament(1 ether, address(0), block.timestamp);
    }

    function testEnterTournamentErrors() public {
        // Create a tournament first
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Test TournamentAlreadyStarted
        vm.warp(startTime + 1);
        vm.expectRevert(TournamentManager.TournamentAlreadyStarted.selector);
        manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );

        // Reset time and test IncorrectETHAmount
        vm.warp(startTime - 1 days);
        vm.expectRevert(TournamentManager.IncorrectETHAmount.selector);
        manager.enterTournament{value: 0.5 ether}(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );

        // Test ETHNotAccepted for ERC20 tournament
        uint256 erc20TournamentId = manager.createTournament(
            1 ether,
            address(token),
            startTime
        );
        vm.expectRevert(TournamentManager.ETHNotAccepted.selector);
        manager.enterTournament{value: 1 ether}(
            user1,
            erc20TournamentId,
            bytes32(0),
            0,
            "uri"
        );
    }

    function testFinalizeTournamentErrors() public {
        uint256 tournamentId = manager.createTournament(1 ether, address(0), block.timestamp + 1 days);
        
        // Test TournamentNotEnded
        address[] memory winners = new address[](1);
        uint256[] memory prizes = new uint256[](1);
        vm.expectRevert(TournamentManager.TournamentNotEnded.selector);
        manager.finalizeTournament(tournamentId, winners, prizes);

        // Mock tournament as over for remaining tests
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );

        // Test TooManyWinners
        address[] memory tooManyWinners = new address[](4);
        uint256[] memory tooManyPrizes = new uint256[](4);
        vm.expectRevert(TournamentManager.TooManyWinners.selector);
        manager.finalizeTournament(tournamentId, tooManyWinners, tooManyPrizes);

        // Test WinnersPrizesLengthMismatch
        address[] memory mismatchWinners = new address[](2);
        uint256[] memory mismatchPrizes = new uint256[](1);
        vm.expectRevert(TournamentManager.WinnersPrizesLengthMismatch.selector);
        manager.finalizeTournament(tournamentId, mismatchWinners, mismatchPrizes);

        // Test PrizesExceedPool
        // First enter tournament to create prize pool
        vm.deal(address(this), 1 ether);
        manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );
        
        // Try to distribute more than pool
        address[] memory validWinners = new address[](1);
        uint256[] memory tooHighPrizes = new uint256[](1);
        validWinners[0] = user1;
        tooHighPrizes[0] = 2 ether; // More than pool
        
        vm.expectRevert(TournamentManager.PrizesExceedPool.selector);
        manager.finalizeTournament(tournamentId, validWinners, tooHighPrizes);
    }

    function testScoreBracketSuccess() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create sample team IDs and win counts for a valid bracket
        uint256[] memory teamIds = new uint256[](4);
        uint256[] memory winCounts = new uint256[](4);
        
        // Example: Team 1 is champion (6 wins), Team 2 got to finals (5 wins)
        // Team 3 got to Final Four (4 wins), Team 4 got to Elite 8 (3 wins)
        teamIds[0] = 1;
        teamIds[1] = 2;
        teamIds[2] = 3;
        teamIds[3] = 4;
        
        winCounts[0] = 6; // Champion
        winCounts[1] = 5; // Runner-up
        winCounts[2] = 4; // Final Four
        winCounts[3] = 3; // Elite 8
        
        // Generate bracket hash
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        // Enter tournament with computed hash
        vm.deal(address(this), 1 ether);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bracketHash,
            0,
            "uri"
        );
        
        // Verify scoring works with original arrays
        uint256 score = manager.scoreBracket(tokenId, teamIds, winCounts);
        assertEq(score, 0, "Bracket scoring should succeed with correct team IDs and win counts");
    }

    function testScoreBracketInvalidHash() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create initial bracket data
        uint256[] memory teamIds = new uint256[](4);
        uint256[] memory winCounts = new uint256[](4);
        teamIds[0] = 1;
        teamIds[1] = 2;
        teamIds[2] = 3;
        teamIds[3] = 4;
        winCounts[0] = 6;
        winCounts[1] = 5;
        winCounts[2] = 4;
        winCounts[3] = 3;
        
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        // Enter tournament with original hash
        vm.deal(address(this), 1 ether);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bracketHash,
            0,
            "uri"
        );
        
        // Modify win counts to create invalid data
        winCounts[0] = 5;
        winCounts[1] = 6;
        
        uint256 score = manager.scoreBracket(tokenId, teamIds, winCounts);
        assertEq(score, 0, "Bracket scoring should fail with modified win counts");
    }

    function testScoreBracketInvalidWinCounts() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        uint256[] memory teamIds = new uint256[](2);
        uint256[] memory winCounts = new uint256[](2);
        
        // Test case: Multiple teams with 6 wins (invalid)
        teamIds[0] = 1;
        teamIds[1] = 2;
        winCounts[0] = 6;
        winCounts[1] = 6;
        
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        vm.deal(address(this), 1 ether);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bracketHash,
            0,
            "uri"
        );
        
        vm.expectRevert(TournamentManager.InvalidWinCounts.selector);
        manager.scoreBracket(tokenId, teamIds, winCounts);
    }

    function testScoreBracketInvalidTeamIds() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        uint256[] memory teamIds = new uint256[](2);
        uint256[] memory winCounts = new uint256[](2);
        
        // Test case: Invalid team ID (0 is not valid)
        teamIds[0] = 0;
        teamIds[1] = 2;
        winCounts[0] = 6;
        winCounts[1] = 5;
        
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        vm.deal(address(this), 1 ether);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bracketHash,
            0,
            "uri"
        );
        
        vm.expectRevert(TournamentManager.InvalidTeamId.selector);
        manager.scoreBracket(tokenId, teamIds, winCounts);
    }

    function testScoreBracketNewScoringFormula() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create sample team IDs and win counts for a valid bracket
        uint256[] memory teamIds = new uint256[](4);
        uint256[] memory winCounts = new uint256[](4);
        
        // Example: Team 1 is champion (6 wins), Team 2 got to finals (5 wins)
        // Team 3 got to Final Four (4 wins), Team 4 got to Elite 8 (3 wins)
        teamIds[0] = 1;
        teamIds[1] = 2;
        teamIds[2] = 3;
        teamIds[3] = 4;
        
        winCounts[0] = 6; // Champion
        winCounts[1] = 5; // Runner-up
        winCounts[2] = 4; // Final Four
        winCounts[3] = 3; // Elite 8
        
        // Generate bracket hash
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        // Enter tournament with computed hash
        vm.deal(address(this), 1 ether);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bracketHash,
            0,
            "uri"
        );

        // Mock the oracle to return actual wins matching predictions
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(1)),
            abi.encode(uint8(6))  // Champion - all 6 wins correct
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(2)),
            abi.encode(uint8(5))  // Runner-up - all 5 wins correct
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(3)),
            abi.encode(uint8(4))  // Final Four - all 4 wins correct
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(4)),
            abi.encode(uint8(3))  // Elite 8 - all 3 wins correct
        );
        
        // Score the bracket
        uint256 score = manager.scoreBracket(tokenId, teamIds, winCounts);
        
        // Calculate expected score:
        // Team 1 (Champion):     1 + 2 + 4 + 8 + 16 + 32 = 63 points
        // Team 2 (Runner-up):    1 + 2 + 4 + 8 + 16      = 31 points
        // Team 3 (Final Four):   1 + 2 + 4 + 8           = 15 points
        // Team 4 (Elite 8):      1 + 2 + 4               = 7 points
        // Total:                                         116 points
        assertEq(score, 116, "Score should match sum of 2^(round-1) for each correct pick");

        // Test partial correctness - team 1 only made it to Final Four when predicted champion
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(1)),
            abi.encode(uint8(4))  // Only made it to Final Four
        );
        
        score = manager.scoreBracket(tokenId, teamIds, winCounts);
        // New expected score:
        // Team 1 (only to F4):   1 + 2 + 4 + 8          = 15 points (not 63)
        // Team 2 (Runner-up):    1 + 2 + 4 + 8 + 16     = 31 points
        // Team 3 (Final Four):   1 + 2 + 4 + 8          = 15 points
        // Team 4 (Elite 8):      1 + 2 + 4              = 7 points
        // Total:                                         68 points
        assertEq(score, 68, "Score should award points only for actual wins up to predicted round");
    }

    receive() external payable {}

    function testEmergencyRefundFeature() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enter tournament with ETH
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        uint256 tokenId = manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );
        
        // Verify emergency refund is disabled by default
        assertEq(manager.emergencyRefundEnabled(), false, "Emergency refund should be disabled by default");
        
        // Attempt to refund when feature is disabled should fail
        vm.prank(user1);
        vm.expectRevert(TournamentManager.IncompatibleEmergencyRefundState.selector);
        manager.refundBracket(tokenId);
        
        // Enable emergency refund (only owner can do this)
        vm.prank(address(this)); // Contract is the owner
        manager.setEmergencyRefundEnabled(true);
        assertEq(manager.emergencyRefundEnabled(), true, "Emergency refund should be enabled");
        
        // Check user1's balance before refund
        uint256 balanceBefore = user1.balance;
        
        // User1 should now be able to claim refund
        vm.prank(user1);
        manager.refundBracket(tokenId);
        
        // Verify user1 received the full refund
        assertEq(user1.balance, balanceBefore + 1 ether, "User should receive full entry fee as refund");
        
        // Verify token is marked as refunded
        assertEq(manager.isRefunded(tokenId), true, "Token should be marked as refunded");
        
        // Attempting to refund the same token again should fail
        vm.prank(user1);
        vm.expectRevert(TournamentManager.BracketAlreadyRefunded.selector);
        manager.refundBracket(tokenId);
        
        // Disable emergency refund
        vm.prank(address(this));
        manager.setEmergencyRefundEnabled(false);
        assertEq(manager.emergencyRefundEnabled(), false, "Emergency refund should be disabled");
    }
    
    function testEmergencyRefundWithERC20() public {
        // Create a tournament with ERC20 token
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(token), startTime);
        
        // Mint tokens to user2
        token.mint(user2, 2 ether);
        
        // Approve tokens for tournament manager
        vm.prank(user2);
        token.approve(address(manager), 1 ether);
        
        // Enter tournament with ERC20
        vm.prank(user2);
        uint256 tokenId = manager.enterTournament(
            user2,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );
        
        // Enable emergency refund
        vm.prank(address(this));
        manager.setEmergencyRefundEnabled(true);
        
        // Check user2's token balance before refund
        uint256 balanceBefore = token.balanceOf(user2);
        
        // User2 should be able to claim refund
        vm.prank(user2);
        manager.refundBracket(tokenId);
        
        // Verify user2 received the full token refund
        assertEq(token.balanceOf(user2), balanceBefore + 1 ether, "User should receive full entry fee as token refund");
    }
    
    function testFinalizeTournamentWithEmergencyRefund() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enable emergency refund
        manager.setEmergencyRefundEnabled(true);
        
        // Attempt to finalize tournament while emergency refund is enabled should fail
        address[] memory winners = new address[](1);
        uint256[] memory prizes = new uint256[](1);
        winners[0] = user1;
        prizes[0] = 0.9 ether;
        
        vm.prank(address(oracle));
        vm.expectRevert(TournamentManager.IncompatibleEmergencyRefundState.selector);
        manager.finalizeTournament(tournamentId, winners, prizes);
    }
    
    function testDeveloperFeePayment() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enter tournament with ETH
        vm.deal(address(this), 1 ether);
        manager.enterTournament{value: 1 ether}(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );
        
        // Check that developer fee is accrued but not paid yet
        (,,,,,uint256 devFeeAccrued,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 0.1 ether, "Developer fee should be accrued");
        
        // Check treasury balance before finalization
        uint256 treasuryBalanceBefore = treasury.balance;
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Finalize tournament
        address[] memory winners = new address[](1);
        uint256[] memory prizes = new uint256[](1);
        winners[0] = user1;
        prizes[0] = 0.9 ether; // 90% of pool
        
        manager.finalizeTournament(tournamentId, winners, prizes);
        
        // Verify developer fee was paid to treasury
        assertEq(treasury.balance, treasuryBalanceBefore + 0.1 ether, "Developer fee should be paid to treasury");
        
        // Verify developer fee is reset
        (,,,,,devFeeAccrued,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 0, "Developer fee should be reset after payment");
    }
    
    function testDeveloperFeePaymentWithERC20() public {
        // Create a tournament with ERC20
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(token), startTime);
        
        // Mint tokens to user
        token.mint(user1, 1 ether);
        
        // Approve tokens for tournament manager
        vm.prank(user1);
        token.approve(address(manager), 1 ether);
        
        // Enter tournament with ERC20
        vm.prank(user1);
        manager.enterTournament(
            user1,
            tournamentId,
            bytes32(0),
            0,
            "uri"
        );
        
        // Check that developer fee is accrued but not paid yet
        (,,,,,uint256 devFeeAccrued,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 0.1 ether, "Developer fee should be accrued");
        
        // Check treasury token balance before finalization
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Finalize tournament
        address[] memory winners = new address[](1);
        uint256[] memory prizes = new uint256[](1);
        winners[0] = user1;
        prizes[0] = 0.9 ether; // 90% of pool
        
        manager.finalizeTournament(tournamentId, winners, prizes);
        
        // Verify developer fee was paid to treasury
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + 0.1 ether, "Developer fee should be paid to treasury");
        
        // Verify developer fee is reset
        (,,,,,devFeeAccrued,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 0, "Developer fee should be reset after payment");
    }
    
    function testOnlyOwnerCanSetEmergencyRefund() public {
        vm.prank(user1);
        vm.expectRevert();
        manager.setEmergencyRefundEnabled(true);
    }

    function testSetGameScoreOracle() public {
        // Create a new mock oracle
        GameScoreOracle newOracle = new GameScoreOracle(MOCK_ROUTER);
        address oldOracleAddress = address(oracle);
        
        // Non-owner should not be able to set the oracle
        vm.prank(user1);
        vm.expectRevert();
        manager.setGameScoreOracle(address(newOracle));
        
        // Owner should be able to set the oracle
        vm.prank(address(this));
        vm.expectEmit(true, true, false, false);
        emit TournamentManager.GameScoreOracleUpdated(oldOracleAddress, address(newOracle));
        manager.setGameScoreOracle(address(newOracle));
        
        // Verify the oracle was updated
        assertEq(address(manager.gameScoreOracle()), address(newOracle));
        
        // Should revert when trying to set to zero address
        vm.prank(address(this));
        vm.expectRevert(TournamentManager.InvalidGameScoreOracleAddress.selector);
        manager.setGameScoreOracle(address(0));
    }

    function testSubmitBracketForFinalScoring() public {
        // Create tournament and enter it
        uint256 tournamentId = createTournamentHelper(0.1 ether, address(0));
        uint256 tokenId = enterTournamentHelper(user1, tournamentId, bytes32(0), 0, "uri");

        // Set tournament as not over yet
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(false)
        );

        // Try to submit when tournament is not over
        vm.expectRevert(TournamentManager.TournamentNotEnded.selector);
        manager.submitBracketForFinalScoring(tokenId);

        // Set tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );

        // Submit bracket for scoring
        manager.submitBracketForFinalScoring(tokenId);

        // Verify bracket is marked as scored
        assertTrue(nft.isScoreSubmitted(tokenId));

        // Try to submit again
        vm.expectRevert(TournamentManager.BracketAlreadyScored.selector);
        manager.submitBracketForFinalScoring(tokenId);
    }

    function testSubmitBracketForFinalScoringEmergencyRefund() public {
        // Create tournament and enter it
        uint256 tournamentId = createTournamentHelper(0.1 ether, address(0));
        uint256 tokenId = enterTournamentHelper(user1, tournamentId, bytes32(0), 0, "uri");

        // Enable emergency refund
        vm.prank(manager.owner());
        manager.setEmergencyRefundEnabled(true);

        // Set tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );

        // Try to submit when emergency refund is enabled
        vm.expectRevert(TournamentManager.IncompatibleEmergencyRefundState.selector);
        manager.submitBracketForFinalScoring(tokenId);
    }

    // Helper functions
    function createTournamentHelper(uint256 entryFee, address paymentToken) internal returns (uint256) {
        uint256 startTime = block.timestamp + 1 days;
        return manager.createTournament(entryFee, paymentToken, startTime);
    }

    function enterTournamentHelper(
        address participant,
        uint256 tournamentId,
        bytes32 bracketHash,
        uint256 tiebreaker,
        string memory bracketURI
    ) internal returns (uint256) {
        (uint256 entryFee, address paymentToken,,,,, ) = manager.getTournament(tournamentId);
        if (paymentToken == address(0)) {
            vm.deal(participant, entryFee);
            vm.prank(participant);
            return manager.enterTournament{value: entryFee}(
                participant,
                tournamentId,
                bracketHash,
                tiebreaker,
                bracketURI
            );
        } else {
            vm.prank(participant);
            return manager.enterTournament(
                participant,
                tournamentId,
                bracketHash,
                tiebreaker,
                bracketURI
            );
        }
    }
} 