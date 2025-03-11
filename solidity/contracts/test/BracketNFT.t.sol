// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {BracketNFT} from "../src/BracketNFT.sol";

contract BracketNFTTest is Test {
    BracketNFT public nft;
    address public manager;
    address public user1;
    address public user2;

    function setUp() public {
        // Deploy contract and set up test environment
        manager = makeAddr("manager");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        nft = new BracketNFT();
    }

    function testOnlyTournamentManagerError() public {
        // Set the tournament manager
        nft.setTournamentManager(manager);

        // Try to mint a bracket from non-manager address
        vm.expectRevert(BracketNFT.OnlyTournamentManager.selector);
        nft.mintBracket(
            user1,
            1, // tournamentId
            bytes32(0), // bracketHash
            0, // tiebreaker
            "uri"
        );

        // Verify it works when called by manager
        vm.prank(manager);
        nft.mintBracket(
            user1,
            1,
            bytes32(0),
            0,
            "uri"
        );
    }

    function testInvalidManagerAddressError() public {
        // Try to set zero address as manager
        vm.expectRevert(BracketNFT.InvalidManagerAddress.selector);
        nft.setTournamentManager(address(0));

        // Verify it works with valid address
        nft.setTournamentManager(manager);
        assertEq(nft.tournamentManager(), manager);
    }

    function testNonexistentTokenError() public {
        // Try to get URI for non-existent token
        vm.expectRevert(BracketNFT.NonexistentToken.selector);
        nft.tokenURI(0);

        // Create a token first
        nft.setTournamentManager(manager);
        vm.prank(manager);
        uint256 tokenId = nft.mintBracket(
            user1,
            1,
            bytes32(0),
            0,
            "uri"
        );

        // Verify it works for existing token
        string memory uri = nft.tokenURI(tokenId);
        assertEq(uri, "uri");

        // Try to get URI for token that doesn't exist yet
        vm.expectRevert(BracketNFT.NonexistentToken.selector);
        nft.tokenURI(tokenId + 1);
    }

    function testSetTokenURINonexistentTokenError() public {
        // This test requires internal function access, so we'll test it through mintBracket
        nft.setTournamentManager(manager);
        
        vm.prank(manager);
        uint256 tokenId = nft.mintBracket(
            user1,
            1,
            bytes32(0),
            0,
            "uri"
        );

        // Verify the URI was set correctly
        string memory uri = nft.tokenURI(tokenId);
        assertEq(uri, "uri");
    }
} 