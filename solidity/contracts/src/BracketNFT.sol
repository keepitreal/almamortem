// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
/**
 * @title BracketNFT
 * @notice ERC721 token representing tournament bracket entries
 */
contract BracketNFT is ERC721Enumerable {
    // Custom Errors
    error OnlyTournamentManager();
    error InvalidManagerAddress();
    error NonexistentToken();
    error InvalidIndex();
    error ManagerAlreadySet();
    // State variables
    address public tournamentManager;
    mapping(uint256 => bytes32) public bracketHashes;    // tokenId => bracketHash
    mapping(uint256 => uint256) public bracketTournaments;    // tokenId => tournamentId
    mapping(uint256 => uint256) public bracketTiebreakers;    // tokenId => tiebreaker
    mapping(uint256 => string) private _tokenURIs;            // tokenId => IPFS URI
    
    uint256 private _nextTokenId;

    // Events
    event BracketCreated(uint256 indexed tokenId, uint256 indexed tournamentId, bytes32 merkleRoot, uint256 tiebreaker);
    
    constructor() ERC721Enumerable() ERC721("Tournament Bracket", "BRACKET") {}
    
    // Modifiers
    modifier onlyManager() {
        if (msg.sender != tournamentManager) revert OnlyTournamentManager();
        _;
    }

    // Functions
    function setTournamentManager(address _manager) external {
        if (tournamentManager != address(0)) revert ManagerAlreadySet();
        if (_manager == address(0)) revert InvalidManagerAddress();
        tournamentManager = _manager;
    }

    function mintBracket(
        address to,
        uint256 tournamentId,
        bytes32 bracketHash,
        uint256 tiebreaker,
        string calldata bracketURI
    ) external onlyManager returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, bracketURI);
        
        bracketHashes[tokenId] = bracketHash;
        bracketTournaments[tokenId] = tournamentId;
        bracketTiebreakers[tokenId] = tiebreaker;
        
        emit BracketCreated(tokenId, tournamentId, bracketHash, tiebreaker);
        
        return tokenId;
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        if (tokenId >= _nextTokenId) revert NonexistentToken();
        _tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId >= _nextTokenId) revert NonexistentToken();
        return _tokenURIs[tokenId];
    }
} 