// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {BracketNFT} from "../contracts/src/BracketNFT.sol";

contract BracketNFTTest is Test {
    BracketNFT public bracketNFT;
    address public owner;
    address public tournamentManager;

    function setUp() public {
        owner = address(this);
        tournamentManager = makeAddr("tournamentManager");
        
        // Deploy the contract
        bracketNFT = new BracketNFT();
        
        // Set up the tournament manager
        bracketNFT.setTournamentManager(tournamentManager);
    }

    function test_InitialSetup() public {
        assertEq(bracketNFT.name(), "Tournament Bracket");
        assertEq(bracketNFT.symbol(), "BRACKET");
        assertEq(bracketNFT.tournamentManager(), tournamentManager);
    }

    function test_MintBracket() public {
        // Switch to tournament manager context
        vm.startPrank(tournamentManager);
        
        address recipient = makeAddr("recipient");
        uint256 tournamentId = 1;
        bytes32 bracketHash = keccak256("some bracket data");
        uint256 tiebreaker = 100;
        string memory bracketURI = "ipfs://some-uri";

        uint256 tokenId = bracketNFT.mintBracket(
            recipient,
            tournamentId,
            bracketHash,
            tiebreaker,
            bracketURI
        );

        assertEq(bracketNFT.ownerOf(tokenId), recipient);
        assertEq(bracketNFT.bracketHashes(tokenId), bracketHash);
        assertEq(bracketNFT.bracketTournaments(tokenId), tournamentId);
        assertEq(bracketNFT.bracketTiebreakers(tokenId), tiebreaker);
        assertEq(bracketNFT.tokenURI(tokenId), bracketURI);
        
        vm.stopPrank();
    }

    function test_TokenEnumeration() public {
        vm.startPrank(tournamentManager);
        
        // Create two recipients
        address recipient1 = makeAddr("recipient1");
        address recipient2 = makeAddr("recipient2");
        
        // Mint multiple brackets to different recipients
        uint256[] memory recipient1Tokens = new uint256[](2);
        uint256[] memory recipient2Tokens = new uint256[](2);
        
        // Mint 2 tokens to recipient1
        recipient1Tokens[0] = bracketNFT.mintBracket(
            recipient1,
            1,
            keccak256("bracket1"),
            100,
            "ipfs://uri1"
        );
        
        recipient1Tokens[1] = bracketNFT.mintBracket(
            recipient1,
            2,
            keccak256("bracket2"),
            200,
            "ipfs://uri2"
        );
        
        // Mint 2 tokens to recipient2
        recipient2Tokens[0] = bracketNFT.mintBracket(
            recipient2,
            3,
            keccak256("bracket3"),
            300,
            "ipfs://uri3"
        );
        
        recipient2Tokens[1] = bracketNFT.mintBracket(
            recipient2,
            4,
            keccak256("bracket4"),
            400,
            "ipfs://uri4"
        );
        
        vm.stopPrank();

        // Test totalSupply
        assertEq(bracketNFT.totalSupply(), 4, "Total supply should be 4");
        
        // Test tokenByIndex
        assertEq(bracketNFT.tokenByIndex(0), recipient1Tokens[0], "First token should be at index 0");
        assertEq(bracketNFT.tokenByIndex(1), recipient1Tokens[1], "Second token should be at index 1");
        assertEq(bracketNFT.tokenByIndex(2), recipient2Tokens[0], "Third token should be at index 2");
        assertEq(bracketNFT.tokenByIndex(3), recipient2Tokens[1], "Fourth token should be at index 3");
        
        // Test tokenOfOwnerByIndex for recipient1
        assertEq(bracketNFT.tokenOfOwnerByIndex(recipient1, 0), recipient1Tokens[0], "First token of recipient1");
        assertEq(bracketNFT.tokenOfOwnerByIndex(recipient1, 1), recipient1Tokens[1], "Second token of recipient1");
        
        // Test tokenOfOwnerByIndex for recipient2
        assertEq(bracketNFT.tokenOfOwnerByIndex(recipient2, 0), recipient2Tokens[0], "First token of recipient2");
        assertEq(bracketNFT.tokenOfOwnerByIndex(recipient2, 1), recipient2Tokens[1], "Second token of recipient2");
    }

    function testFail_TokenByIndexOutOfBounds() public {
        vm.startPrank(tournamentManager);
        
        // Mint one token
        bracketNFT.mintBracket(
            makeAddr("recipient"),
            1,
            keccak256("bracket"),
            100,
            "ipfs://uri"
        );
        
        vm.stopPrank();
        
        // This should revert
        bracketNFT.tokenByIndex(1);
    }

    function testFail_TokenOfOwnerByIndexOutOfBounds() public {
        vm.startPrank(tournamentManager);
        
        address recipient = makeAddr("recipient");
        // Mint one token
        bracketNFT.mintBracket(
            recipient,
            1,
            keccak256("bracket"),
            100,
            "ipfs://uri"
        );
        
        vm.stopPrank();
        
        // This should revert
        bracketNFT.tokenOfOwnerByIndex(recipient, 1);
    }
} 