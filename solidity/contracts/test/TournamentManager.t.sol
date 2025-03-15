// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {TournamentManager} from "../src/TournamentManager.sol";
import {BracketNFT} from "../src/BracketNFT.sol";
import {GameScoreOracle} from "../src/GameScoreOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {MockERC20} from "./MockERC20.sol";

string constant SAMPLE_DATA = "000c2001520026100296002b100422004d1007f1009630098400992009c200e4300ef100f5100f8200fb10100101091010d201481014d401643087810888108ca208cd10901109a9109b3109cd50a493";

contract TournamentManagerTest is Test, IERC721Receiver {
    TournamentManager public manager;
    BracketNFT public nft;
    GameScoreOracle public oracle;
    MockERC20 public token;
    
    address public treasury;
    address public user1;
    address public user2;
    address public constant MOCK_ROUTER = address(1); // Mock Chainlink Functions Router
    
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
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

    function testValidateBracketWinDistribution() public {   
        // Create a complete bracket with 64 teams
        uint256[] memory teamIds = new uint256[](64);
        uint256[] memory winCounts = new uint256[](64);
        
        // Fill in team IDs (1-64)
        for (uint256 i = 0; i < 64; i++) {
            teamIds[i] = i + 1;
        }
        
        // Set up a valid win distribution:
        // - 1 team with 6 wins (champion)
        // - 1 team with 5 wins (runner-up)
        // - 2 teams with 4 wins (final four losers)
        // - 4 teams with 3 wins (elite eight losers)
        // - 8 teams with 2 wins (sweet sixteen losers)
        // - 16 teams with 1 win (round of 32 losers)
        // - 32 teams with 0 wins (round of 64 losers)
        
        // Champion (1 team)
        winCounts[0] = 6;
        
        // Runner-up (1 team)
        winCounts[1] = 5;
        
        // Final Four losers (2 teams)
        for (uint256 i = 2; i < 4; i++) {
            winCounts[i] = 4;
        }
        
        // Elite Eight losers (4 teams)
        for (uint256 i = 4; i < 8; i++) {
            winCounts[i] = 3;
        }
        
        // Sweet Sixteen losers (8 teams)
        for (uint256 i = 8; i < 16; i++) {
            winCounts[i] = 2;
        }
        
        // Round of 32 losers (16 teams)
        for (uint256 i = 16; i < 32; i++) {
            winCounts[i] = 1;
        }
        
        // Round of 64 losers (32 teams)
        for (uint256 i = 32; i < 64; i++) {
            winCounts[i] = 0;
        }
                
        // Enter tournament with computed hash
        vm.deal(address(this), 1 ether);
        
        // This should not revert
        manager.validateBracketWinDistribution(teamIds, winCounts);
        
        // Now test invalid distributions
        
        // Test 1: Two champions
        uint256[] memory invalidWinCounts1 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts1[i] = winCounts[i];
        }
        invalidWinCounts1[2] = 6; // Second champion
        
        vm.expectRevert(TournamentManager.InvalidWinCounts.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts1);
        
        // Test 2: Wrong number of runner-ups
        uint256[] memory invalidWinCounts2 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts2[i] = winCounts[i];
        }
        invalidWinCounts2[1] = 4; // Change runner-up to final four
        invalidWinCounts2[4] = 5; // Add another runner-up
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts2);
        
        // Test 3: Wrong number of final four teams
        uint256[] memory invalidWinCounts3 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts3[i] = winCounts[i];
        }
        invalidWinCounts3[2] = 3; // Change final four to elite eight
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts3);
        
        // Test 4: Wrong number of elite eight teams
        uint256[] memory invalidWinCounts4 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts4[i] = winCounts[i];
        }
        invalidWinCounts4[4] = 2; // Change elite eight to sweet sixteen
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts4);
        
        // Test 5: Wrong number of sweet sixteen teams
        uint256[] memory invalidWinCounts5 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts5[i] = winCounts[i];
        }
        invalidWinCounts5[8] = 1; // Change sweet sixteen to round of 32
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts5);
        
        // Test 6: Wrong number of round of 32 teams
        uint256[] memory invalidWinCounts6 = new uint256[](64);
        for (uint256 i = 0; i < 64; i++) {
            invalidWinCounts6[i] = winCounts[i];
        }
        invalidWinCounts6[16] = 0; // Change round of 32 to round of 64
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.validateBracketWinDistribution(teamIds, invalidWinCounts6);
    }

    function testScoreBracketWithInvalidWinDistribution() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create a complete bracket with 64 teams
        uint256[] memory teamIds = new uint256[](64);
        uint256[] memory winCounts = new uint256[](64);
        
        // Fill in team IDs (1-64)
        for (uint256 i = 0; i < 64; i++) {
            teamIds[i] = i + 1;
        }
        
        // Set up an invalid win distribution with wrong number of teams in each round
        // Champion (1 team)
        winCounts[0] = 6;
        
        // Runner-up (1 team)
        winCounts[1] = 5;
        
        // Final Four losers (3 teams instead of 2)
        for (uint256 i = 2; i < 5; i++) {
            winCounts[i] = 4;
        }
        
        // Elite Eight losers (3 teams instead of 4)
        for (uint256 i = 5; i < 8; i++) {
            winCounts[i] = 3;
        }
        
        // Sweet Sixteen losers (8 teams)
        for (uint256 i = 8; i < 16; i++) {
            winCounts[i] = 2;
        }
        
        // Round of 32 losers (16 teams)
        for (uint256 i = 16; i < 32; i++) {
            winCounts[i] = 1;
        }
        
        // Round of 64 losers (32 teams)
        for (uint256 i = 32; i < 64; i++) {
            winCounts[i] = 0;
        }
        
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
        
        // Scoring should fail due to invalid win distribution
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.scoreBracket(tokenId, teamIds, winCounts);
        
        // Also test that submitBracketForFinalScoring fails
        vm.warp(startTime + 30 days); // Fast forward to after tournament
        
        // Mock the oracle to say tournament is over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        vm.expectRevert(TournamentManager.InvalidWinDistribution.selector);
        manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
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
        manager.distributePrizes(tournamentId);
    }
    
    function testDeveloperFeePayment() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enter tournament with 10 participants (MIN_PARTICIPANTS)
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participant, 1 ether);
            
            vm.startPrank(participant);
            
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
            
            manager.enterTournament{value: 1 ether}(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Check that developer fee is accrued but not paid yet
        (,,,,,uint256 devFeeAccrued,,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 1 ether, "Developer fee should be accrued"); // 10% of 10 ether
        
        // Check treasury balance before finalization
        uint256 treasuryBalanceBefore = treasury.balance;
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all participants to ensure they're ranked
        for (uint256 i = 0; i < 10; i++) {
            uint256 tokenId = i + 1; // Token IDs start at 1
            
            // Mock the bracket tournament mapping
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
                abi.encode(tournamentId)
            );
            
            // Mock isScoreSubmitted to return false
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("isScoreSubmitted(uint256)", tokenId),
                abi.encode(false)
            );
            
            // Mock setIsScoreSubmitted to do nothing
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("setIsScoreSubmitted(uint256)", tokenId),
                abi.encode()
            );
            
            // Mock bracketHashes to return a valid hash
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
            
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketHashes(uint256)", tokenId),
                abi.encode(bracketHash)
            );
            
            // Mock getTeamWins to return valid wins
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(1)),
                abi.encode(uint8(6))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(2)),
                abi.encode(uint8(5))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(3)),
                abi.encode(uint8(4))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(4)),
                abi.encode(uint8(3))
            );
            
            // Submit the bracket for scoring
            manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
        }
        
        // Distribute prizes
        manager.distributePrizes(tournamentId);
        
        // Verify developer fee was paid to treasury
        assertEq(treasury.balance, treasuryBalanceBefore + 1 ether, "Developer fee should be paid to treasury");
        
        // Verify developer fee is reset
        (,,,,,devFeeAccrued,,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 0, "Developer fee should be reset after payment");
    }
    
    function testDeveloperFeePaymentWithERC20() public {
        // Create a tournament with ERC20
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(token), startTime);
        
        // Enter tournament with 10 participants (MIN_PARTICIPANTS)
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            
            // Mint tokens to participant
            token.mint(participant, 1 ether);
            
            vm.startPrank(participant);
            
            // Approve tokens for tournament manager
            token.approve(address(manager), 1 ether);
            
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
            
            manager.enterTournament(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Check that developer fee is accrued but not paid yet
        (,,,,,uint256 devFeeAccrued,,) = manager.getTournament(tournamentId);
        assertEq(devFeeAccrued, 1 ether, "Developer fee should be accrued"); // 10% of 10 ether
        
        // Check treasury token balance before finalization
        uint256 treasuryBalanceBefore = token.balanceOf(treasury);
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all participants to ensure they're ranked
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            uint256 tokenId = i + 11; // Token IDs start at 11 (after the previous test)
            
            // Mock the bracket tournament mapping
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
                abi.encode(tournamentId)
            );
            
            // Mock isScoreSubmitted to return false
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("isScoreSubmitted(uint256)", tokenId),
                abi.encode(false)
            );
            
            // Mock setIsScoreSubmitted to do nothing
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("setIsScoreSubmitted(uint256)", tokenId),
                abi.encode()
            );
            
            // Mock bracketHashes to return a valid hash
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
            
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketHashes(uint256)", tokenId),
                abi.encode(bracketHash)
            );
            
            // Mock getTeamWins to return valid wins
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(1)),
                abi.encode(uint8(6))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(2)),
                abi.encode(uint8(5))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(3)),
                abi.encode(uint8(4))
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", uint256(4)),
                abi.encode(uint8(3))
            );
            
            // Mock ownerOf to return the participant
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("ownerOf(uint256)", tokenId),
                abi.encode(participant)
            );
            
            // Submit the bracket for scoring
            manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
        }
        
        // Distribute prizes
        manager.distributePrizes(tournamentId);
        
        // Verify developer fee was paid to treasury
        assertEq(token.balanceOf(treasury), treasuryBalanceBefore + 1 ether, "Developer fee should be paid to treasury");
        
        // Verify developer fee is reset
        (,,,,,devFeeAccrued,,) = manager.getTournament(tournamentId);
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

        // Create bracket data
        uint256[] memory teamIds = new uint256[](4);
        uint256[] memory winCounts = new uint256[](4);
        teamIds[0] = 1; teamIds[1] = 2; teamIds[2] = 3; teamIds[3] = 4;
        winCounts[0] = 6; winCounts[1] = 5; winCounts[2] = 4; winCounts[3] = 3;
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        uint256 tokenId = enterTournamentHelper(user1, tournamentId, bracketHash, 0, "uri");

        // Set tournament as not over yet
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(false)
        );

        // Try to submit when tournament is not over
        vm.expectRevert(TournamentManager.TournamentNotEnded.selector);
        manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);

        // Set tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );

        // Submit bracket for scoring
        manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);

        // Verify bracket is marked as scored
        assertTrue(nft.isScoreSubmitted(tokenId));

        // Try to submit again
        vm.expectRevert(TournamentManager.BracketAlreadyScored.selector);
        manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
    }

    function testSubmitBracketForFinalScoringEmergencyRefund() public {
        // Create tournament and enter it
        uint256 tournamentId = createTournamentHelper(0.1 ether, address(0));

        // Create bracket data
        uint256[] memory teamIds = new uint256[](4);
        uint256[] memory winCounts = new uint256[](4);
        teamIds[0] = 1; teamIds[1] = 2; teamIds[2] = 3; teamIds[3] = 4;
        winCounts[0] = 6; winCounts[1] = 5; winCounts[2] = 4; winCounts[3] = 3;
        bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
        
        uint256 tokenId = enterTournamentHelper(user1, tournamentId, bracketHash, 0, "uri");

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
        manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
    }

    function testSubmitBracketForFinalScoringOrder() public {
        // Create tournament
        uint256 tournamentId = createTournamentHelper(0.1 ether, address(0));

        // Create bracket data for highest score (Team 1 is champion)
        uint256[] memory teamIds1 = new uint256[](4);
        uint256[] memory winCounts1 = new uint256[](4);
        teamIds1[0] = 1; teamIds1[1] = 2; teamIds1[2] = 3; teamIds1[3] = 4;
        winCounts1[0] = 6; winCounts1[1] = 5; winCounts1[2] = 4; winCounts1[3] = 3;
        bytes32 bracketHash1 = keccak256(abi.encode(teamIds1, winCounts1));
        uint256 tokenId1 = enterTournamentHelper(user1, tournamentId, bracketHash1, 0, "uri1");

        // Create bracket data for medium score (Team 2 is champion)
        uint256[] memory teamIds2 = new uint256[](4);
        uint256[] memory winCounts2 = new uint256[](4);
        teamIds2[0] = 1; teamIds2[1] = 2; teamIds2[2] = 3; teamIds2[3] = 4;
        winCounts2[0] = 4; winCounts2[1] = 6; winCounts2[2] = 5; winCounts2[3] = 3;
        bytes32 bracketHash2 = keccak256(abi.encode(teamIds2, winCounts2));
        uint256 tokenId2 = enterTournamentHelper(user2, tournamentId, bracketHash2, 0, "uri2");

        // Create bracket data for lowest score (Team 3 is champion)
        uint256[] memory teamIds3 = new uint256[](4);
        uint256[] memory winCounts3 = new uint256[](4);
        teamIds3[0] = 1; teamIds3[1] = 2; teamIds3[2] = 3; teamIds3[3] = 4;
        winCounts3[0] = 3; winCounts3[1] = 4; winCounts3[2] = 6; winCounts3[3] = 5;
        bytes32 bracketHash3 = keccak256(abi.encode(teamIds3, winCounts3));
        uint256 tokenId3 = enterTournamentHelper(address(this), tournamentId, bracketHash3, 0, "uri3");

        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );

        // Mock oracle responses for team wins - all teams get their predicted wins
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(1)),
            abi.encode(uint8(6))  // Perfect for bracket 1
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(2)),
            abi.encode(uint8(4))  // Medium for bracket 2
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(3)),
            abi.encode(uint8(2))  // Low for bracket 3
        );
        vm.mockCall(
            address(oracle),
            abi.encodeWithSelector(GameScoreOracle.getTeamWins.selector, uint256(4)),
            abi.encode(uint8(1))
        );

        // Submit brackets in random order
        manager.submitBracketForFinalScoring(tokenId2, teamIds2, winCounts2);
        manager.submitBracketForFinalScoring(tokenId3, teamIds3, winCounts3);
        manager.submitBracketForFinalScoring(tokenId1, teamIds1, winCounts1);

        // Get winners array using the view function
        uint256[] memory winners = manager.getTournamentWinners(tournamentId);
        assertEq(winners.length, 3, "Should have 3 winners");
        assertEq(winners[0], tokenId1, "Highest score should be first");
        assertEq(winners[1], tokenId2, "Medium score should be second");
        assertEq(winners[2], tokenId3, "Lowest score should be last");
    }

    function testDistributePrizes() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create 20 participants (so top 10% = 2 winners)
        address[] memory participants = new address[](20);
        uint256[] memory tokenIds = new uint256[](20);
        
        for (uint256 i = 0; i < 20; i++) {
            participants[i] = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participants[i], 1 ether);
        }
        
        // Enter tournament with all participants
        for (uint256 i = 0; i < 20; i++) {
            vm.startPrank(participants[i]);
            
            // Create unique bracket data for each participant
            uint256[] memory teamIds = new uint256[](4);
            uint256[] memory winCounts = new uint256[](4);
            
            teamIds[0] = 1;
            teamIds[1] = 2;
            teamIds[2] = 3;
            teamIds[3] = 4;
            
            winCounts[0] = 6; // Champion
            winCounts[1] = 5; // Runner-up
            winCounts[2] = 4; // Final Four
            winCounts[3] = 3; // Elite 8
            
            bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
            
            tokenIds[i] = manager.enterTournament{value: 1 ether}(
                participants[i],
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Fast forward to after tournament ends
        vm.warp(startTime + 30 days);
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all brackets
        // We'll make participant[0] and participant[1] the winners with highest scores
        for (uint256 i = 0; i < 20; i++) {
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
            
            // Mock different scores based on participant index
            // First two participants get high scores
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[0]),
                abi.encode(i < 2 ? 6 : 3) // First two get 6 wins, others get 3
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[1]),
                abi.encode(i < 2 ? 5 : 2)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[2]),
                abi.encode(i < 2 ? 4 : 1)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[3]),
                abi.encode(i < 2 ? 3 : 0)
            );
            
            manager.submitBracketForFinalScoring(tokenIds[i], teamIds, winCounts);
        }
        
        // Check initial balances
        uint256 initialBalance0 = participants[0].balance;
        uint256 initialBalance1 = participants[1].balance;
        
        // Distribute prizes
        manager.distributePrizes(tournamentId);
        
        // Get tournament info
        (,,,,,,, bool isFinalized) = manager.getTournament(tournamentId);
        assertTrue(isFinalized, "Tournament should be finalized");
        
        // Check that prizes were distributed correctly
        // Top 10% = 2 winners (out of 20 participants)
        // Total prize pool = 18 ether (20 ether - 10% dev fee)
        // First place (participant[0]) should get 2/3 of the pool = 12 ether
        // Second place (participant[1]) should get 1/3 of the pool = 6 ether
        
        uint256 finalBalance0 = participants[0].balance;
        uint256 finalBalance1 = participants[1].balance;
        
        assertEq(finalBalance0 - initialBalance0, 12 ether, "First place should receive 12 ether");
        assertEq(finalBalance1 - initialBalance1, 6 ether, "Second place should receive 6 ether");
        
        // Check that prizes were marked as claimed
        assertTrue(manager.prizesClaimed(tournamentId, tokenIds[0]), "Prize for first place should be marked as claimed");
        assertTrue(manager.prizesClaimed(tournamentId, tokenIds[1]), "Prize for second place should be marked as claimed");
    }

    function testDistributePrizesWithERC20() public {
        // Create a tournament with ERC20 token
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(100 * 10**18, address(token), startTime);
        
        // Create 10 participants (so top 10% = 1 winner)
        address[] memory participants = new address[](10);
        uint256[] memory tokenIds = new uint256[](10);
        
        for (uint256 i = 0; i < 10; i++) {
            participants[i] = makeAddr(string(abi.encodePacked("participant", i)));
            token.mint(participants[i], 100 * 10**18);
        }
        
        // Enter tournament with all participants
        for (uint256 i = 0; i < 10; i++) {
            vm.startPrank(participants[i]);
            
            // Approve token spending
            token.approve(address(manager), 100 * 10**18);
            
            // Create unique bracket data for each participant
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
            
            tokenIds[i] = manager.enterTournament(
                participants[i],
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Fast forward to after tournament ends
        vm.warp(startTime + 30 days);
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all brackets
        // We'll make participant[0] the winner with highest score
        for (uint256 i = 0; i < 10; i++) {
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
            
            // Mock different scores based on participant index
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[0]),
                abi.encode(i == 0 ? 6 : 3) // First participant gets 6 wins, others get 3
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[1]),
                abi.encode(i == 0 ? 5 : 2)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[2]),
                abi.encode(i == 0 ? 4 : 1)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[3]),
                abi.encode(i == 0 ? 3 : 0)
            );
            
            manager.submitBracketForFinalScoring(tokenIds[i], teamIds, winCounts);
        }
        
        // Check initial balance
        uint256 initialBalance = token.balanceOf(participants[0]);
        
        // Distribute prizes
        manager.distributePrizes(tournamentId);
        
        // Get tournament info
        (,,,,,,, bool isFinalized) = manager.getTournament(tournamentId);
        assertTrue(isFinalized, "Tournament should be finalized");
        
        // Check that prize was distributed correctly
        // Top 10% = 1 winner (out of 10 participants)
        // Total prize pool = 900 * 10**18 (1000 * 10**18 - 10% dev fee)
        
        uint256 finalBalance = token.balanceOf(participants[0]);
        assertEq(finalBalance - initialBalance, 900 * 10**18, "Winner should receive 900 tokens");
        
        // Check that prize was marked as claimed
        assertTrue(manager.prizesClaimed(tournamentId, tokenIds[0]), "Prize should be marked as claimed");
    }

    function testDistributePrizesErrors() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Test NotEnoughParticipants
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        vm.expectRevert(TournamentManager.NotEnoughParticipants.selector);
        manager.distributePrizes(tournamentId);
        
        // Add 5 participants (still not enough)
        for (uint256 i = 0; i < 5; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participant, 1 ether);
            
            vm.startPrank(participant);
            
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
            
            manager.enterTournament{value: 1 ether}(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Still not enough participants
        vm.expectRevert(TournamentManager.NotEnoughParticipants.selector);
        manager.distributePrizes(tournamentId);
        
        // Test TournamentNotEnded
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(false)
        );
        
        // Add more participants to reach 10
        for (uint256 i = 5; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participant, 1 ether);
            
            vm.startPrank(participant);
            
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
            
            manager.enterTournament{value: 1 ether}(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        vm.expectRevert(TournamentManager.TournamentNotEnded.selector);
        manager.distributePrizes(tournamentId);
        
        // Test TournamentAlreadyFinalized
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all brackets
        for (uint256 i = 0; i < 10; i++) {           
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
            
            // Mock team wins
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[0]),
                abi.encode(6)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[1]),
                abi.encode(5)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[2]),
                abi.encode(4)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[3]),
                abi.encode(3)
            );
            
            // Get tokenId for this participant
            uint256 tokenId = i + 1; // Simplified for test
            
            // Mock bracket hash
            bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketHashes(uint256)", tokenId),
                abi.encode(bracketHash)
            );
            
            // Mock tournament ID
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
                abi.encode(tournamentId)
            );
            
            // Mock isScoreSubmitted
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("isScoreSubmitted(uint256)", tokenId),
                abi.encode(false)
            );
            
            // Mock setIsScoreSubmitted
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("setIsScoreSubmitted(uint256)", tokenId),
                abi.encode()
            );
            
            manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
        }
        
        // Distribute prizes
        manager.distributePrizes(tournamentId);
        
        // Try to distribute again
        vm.expectRevert(TournamentManager.TournamentAlreadyFinalized.selector);
        manager.distributePrizes(tournamentId);
    }

    function testCalculatePrizeDistribution() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Create 20 participants (so top 10% = 2 winners)
        address[] memory participants = new address[](20);
        uint256[] memory tokenIds = new uint256[](20);
        
        for (uint256 i = 0; i < 20; i++) {
            participants[i] = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participants[i], 1 ether);
        }
        
        // Enter tournament with all participants
        for (uint256 i = 0; i < 20; i++) {
            vm.startPrank(participants[i]);
            
            // Create unique bracket data for each participant
            uint256[] memory teamIds = new uint256[](4);
            uint256[] memory winCounts = new uint256[](4);
            
            teamIds[0] = 1;
            teamIds[1] = 2;
            teamIds[2] = 3;
            teamIds[3] = 4;
            
            winCounts[0] = 6; // Champion
            winCounts[1] = 5; // Runner-up
            winCounts[2] = 4; // Final Four
            winCounts[3] = 3; // Elite 8
            
            bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
            
            tokenIds[i] = manager.enterTournament{value: 1 ether}(
                participants[i],
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Fast forward to after tournament ends
        vm.warp(startTime + 30 days);
        
        // Mock tournament as over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Submit scores for all brackets
        // We'll make participant[0] and participant[1] the winners with highest scores
        for (uint256 i = 0; i < 20; i++) {
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
            
            // Mock different scores based on participant index
            // First two participants get high scores
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[0]),
                abi.encode(i < 2 ? 6 : 3) // First two get 6 wins, others get 3
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[1]),
                abi.encode(i < 2 ? 5 : 2)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[2]),
                abi.encode(i < 2 ? 4 : 1)
            );
            vm.mockCall(
                address(oracle),
                abi.encodeWithSignature("getTeamWins(uint256)", teamIds[3]),
                abi.encode(i < 2 ? 3 : 0)
            );
            
            manager.submitBracketForFinalScoring(tokenIds[i], teamIds, winCounts);
        }
        
        // Calculate prize distribution
        (uint256[] memory winnerTokenIds, uint256[] memory prizeAmounts, uint256 totalWinners) = 
            manager.calculatePrizeDistribution(tournamentId);
        
        // Verify the results
        assertEq(totalWinners, 2, "Should have 2 winners (10% of 20)");
        assertEq(winnerTokenIds.length, 2, "Should have 2 winner token IDs");
        assertEq(prizeAmounts.length, 2, "Should have 2 prize amounts");
        
        // Verify the winner token IDs
        assertEq(winnerTokenIds[0], tokenIds[0], "First winner should be participant 0");
        assertEq(winnerTokenIds[1], tokenIds[1], "Second winner should be participant 1");
        
        // Verify the prize amounts
        // Total prize pool = 18 ether (20 ether - 10% dev fee)
        // First place (participant[0]) should get 2/3 of the pool = 12 ether
        // Second place (participant[1]) should get 1/3 of the pool = 6 ether
        assertEq(prizeAmounts[0], 12 ether, "First place should receive 12 ether");
        assertEq(prizeAmounts[1], 6 ether, "Second place should receive 6 ether");
        
        // Test with no participants
        uint256 emptyTournamentId = manager.createTournament(1 ether, address(0), block.timestamp + 1 days);
        (uint256[] memory emptyWinnerTokenIds, uint256[] memory emptyPrizeAmounts, uint256 emptyTotalWinners) = 
            manager.calculatePrizeDistribution(emptyTournamentId);
        
        assertEq(emptyTotalWinners, 0, "Should have 0 winners for empty tournament");
        assertEq(emptyWinnerTokenIds.length, 0, "Should have 0 winner token IDs for empty tournament");
        assertEq(emptyPrizeAmounts.length, 0, "Should have 0 prize amounts for empty tournament");
    }

    function testInsufficientParticipantsRefund() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enter tournament with 5 participants (less than MIN_PARTICIPANTS which is 10)
        for (uint256 i = 0; i < 5; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participant, 1 ether);
            
            vm.startPrank(participant);
            
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
            
            manager.enterTournament{value: 1 ether}(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Try to claim refund before tournament starts - should fail
        address participant0 = makeAddr("participant0");
        uint256 tokenId = 1; // First token ID
        
        // Mock the bracket tournament mapping
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
            abi.encode(tournamentId)
        );
        
        // Mock the owner of the bracket
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("ownerOf(uint256)", tokenId),
            abi.encode(participant0)
        );
        
        vm.prank(participant0);
        vm.expectRevert(TournamentManager.TournamentNotStarted.selector);
        manager.claimInsufficientParticipantsRefund(tokenId);
        
        // Fast forward to after tournament start time
        vm.warp(startTime + 1 hours);
        
        // Check participant balance before refund
        uint256 balanceBefore = participant0.balance;
        
        // Claim refund
        vm.prank(participant0);
        manager.claimInsufficientParticipantsRefund(tokenId);
        
        // Verify participant received the refund
        assertEq(participant0.balance, balanceBefore + 1 ether, "Participant should receive full entry fee as refund");
        
        // Verify bracket is marked as refunded
        assertTrue(manager.isRefunded(tokenId));
        
        // Try to claim again - should fail
        vm.prank(participant0);
        vm.expectRevert(TournamentManager.BracketAlreadyRefunded.selector);
        manager.claimInsufficientParticipantsRefund(tokenId);
        
        // Try to distribute prizes - should fail due to not enough participants
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        vm.expectRevert(TournamentManager.NotEnoughParticipants.selector);
        manager.distributePrizes(tournamentId);
    }
    
    function testInsufficientParticipantsRefundWithERC20() public {
        // Create a tournament with ERC20 token
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(token), startTime);
        
        // Enter tournament with 5 participants (less than MIN_PARTICIPANTS which is 10)
        for (uint256 i = 0; i < 5; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            
            // Mint tokens to participant
            token.mint(participant, 1 ether);
            
            vm.startPrank(participant);
            
            // Approve tokens for tournament manager
            token.approve(address(manager), 1 ether);
            
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
            
            manager.enterTournament(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Fast forward to after tournament start time
        vm.warp(startTime + 1 hours);
        
        // Get the first participant's token ID
        address participant0 = makeAddr("participant0");
        uint256 tokenId = 6; // First token ID for this test (after the 5 from previous test)
        
        // Mock the bracket tournament mapping
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
            abi.encode(tournamentId)
        );
        
        // Mock the owner of the bracket
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("ownerOf(uint256)", tokenId),
            abi.encode(participant0)
        );
        
        // Check participant token balance before refund
        uint256 balanceBefore = token.balanceOf(participant0);
        
        // Claim refund
        vm.prank(participant0);
        manager.claimInsufficientParticipantsRefund(tokenId);
        
        // Verify participant received the token refund
        assertEq(token.balanceOf(participant0), balanceBefore + 1 ether, "Participant should receive full entry fee as token refund");
    }
    
    function testCannotClaimRefundWithEnoughParticipants() public {
        // Create a tournament
        uint256 startTime = block.timestamp + 1 days;
        uint256 tournamentId = manager.createTournament(1 ether, address(0), startTime);
        
        // Enter tournament with MIN_PARTICIPANTS (10)
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            vm.deal(participant, 1 ether);
            
            vm.startPrank(participant);
            
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
            
            manager.enterTournament{value: 1 ether}(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
            
            vm.stopPrank();
        }
        
        // Fast forward to after tournament start time
        vm.warp(startTime + 1 hours);
        
        // Try to claim refund - should fail because there are enough participants
        address participant0 = makeAddr("participant0");
        uint256 tokenId = 1; // First token ID for this test
        
        // Mock the bracket tournament mapping
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
            abi.encode(tournamentId)
        );
        
        // Mock the owner of the bracket
        vm.mockCall(
            address(nft),
            abi.encodeWithSignature("ownerOf(uint256)", tokenId),
            abi.encode(participant0)
        );
        
        vm.prank(participant0);
        vm.expectRevert(TournamentManager.TournamentHasEnoughParticipants.selector);
        manager.claimInsufficientParticipantsRefund(tokenId);
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
        (uint256 entryFee, address paymentToken,,,,,, ) = manager.getTournament(tournamentId);
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
    
    // Tests for the deadline feature
    function testCannotSetDeadlineIfTournamentNotOver() public {
        // Create a tournament
        createTournamentHelper(1 ether, address(0));
        
        // Mock that tournament is NOT over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(false)
        );
        
        // Try to set deadline - should fail
        vm.expectRevert(TournamentManager.TournamentNotEnded.selector);
        manager.setDeadlineToSubmitBrackets();
    }
    
    function testCanSetDeadlineIfTournamentOver() public {
        // Create a tournament
        createTournamentHelper(1 ether, address(0));
        
        // Mock that tournament is over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Set deadline - should succeed
        manager.setDeadlineToSubmitBrackets();
        
        // Verify deadline is set to 24 hours in the future
        assertEq(manager.deadlineToSubmitBrackets(), block.timestamp + 24 hours);
    }
    
    function testCannotSetDeadlineTwice() public {
        // Create a tournament
        createTournamentHelper(1 ether, address(0));
        
        // Mock that tournament is over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Set deadline first time - should succeed
        manager.setDeadlineToSubmitBrackets();
        
        // Try to set deadline again - should fail
        vm.expectRevert(TournamentManager.DeadlineAlreadySet.selector);
        manager.setDeadlineToSubmitBrackets();
    }
    
    function testCannotDistributePrizesBeforeDeadline() public {
        // Create a tournament
        uint256 tournamentId = createTournamentHelper(1 ether, address(0));
        
        // Enter tournament with enough participants
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            
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
            
            enterTournamentHelper(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
        }
        
        // Fast forward to after tournament start time
        (,, uint256 startTime,,,,, ) = manager.getTournament(tournamentId);
        vm.warp(startTime + 1 hours);
        
        // Mock that tournament is over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Set deadline
        manager.setDeadlineToSubmitBrackets();
        
        // Fast forward to before deadline (23 hours)
        vm.warp(block.timestamp + 23 hours);
        
        // Try to distribute prizes - should fail
        vm.expectRevert(TournamentManager.TournamentDeadlineNotMet.selector);
        manager.distributePrizes(tournamentId);
    }
    
    function testCanDistributePrizesAfterDeadline() public {
        // Create a tournament
        uint256 tournamentId = createTournamentHelper(1 ether, address(0));
        
        // Enter tournament with enough participants
        for (uint256 i = 0; i < 10; i++) {
            address participant = makeAddr(string(abi.encodePacked("participant", i)));
            
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
            
            enterTournamentHelper(
                participant,
                tournamentId,
                bracketHash,
                0,
                "uri"
            );
        }
        
        // Fast forward to after tournament start time
        (,, uint256 startTime,,,,, ) = manager.getTournament(tournamentId);
        vm.warp(startTime + 1 hours);
        
        // Mock that tournament is over
        vm.mockCall(
            address(oracle),
            abi.encodeWithSignature("isTournamentOver()"),
            abi.encode(true)
        );
        
        // Set deadline
        manager.setDeadlineToSubmitBrackets();
        
        // Fast forward to after deadline (25 hours)
        vm.warp(block.timestamp + 25 hours);
        
        // Submit some brackets for scoring to have winners
        for (uint256 i = 0; i < 5; i++) {
            uint256 tokenId = i + 1; // Token IDs start from 1
            
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
            
            // Mock bracket tournament mapping
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketTournaments(uint256)", tokenId),
                abi.encode(tournamentId)
            );
            
            // Mock bracket hash
            bytes32 bracketHash = keccak256(abi.encode(teamIds, winCounts));
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("bracketHashes(uint256)", tokenId),
                abi.encode(bracketHash)
            );
            
            // Mock isScoreSubmitted
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("isScoreSubmitted(uint256)", tokenId),
                abi.encode(false)
            );
            
            // Mock setIsScoreSubmitted
            vm.mockCall(
                address(nft),
                abi.encodeWithSignature("setIsScoreSubmitted(uint256)", tokenId),
                abi.encode()
            );
            
            // Mock team wins for scoring
            for (uint256 j = 1; j <= 4; j++) {
                vm.mockCall(
                    address(oracle),
                    abi.encodeWithSignature("getTeamWins(uint256)", j),
                    abi.encode(uint8(j)) // Team 1 has 1 win, team 2 has 2 wins, etc.
                );
            }
            
            // Submit bracket for scoring
            manager.submitBracketForFinalScoring(tokenId, teamIds, winCounts);
        }
        
        // Distribute prizes - should succeed
        manager.distributePrizes(tournamentId);
        
        // Verify tournament is finalized
        (,,,,,,, bool isFinalized) = manager.getTournament(tournamentId);
        assertTrue(isFinalized, "Tournament should be finalized");
    }
} 