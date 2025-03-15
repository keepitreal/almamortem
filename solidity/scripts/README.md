# Tournament Scoring Script

This script allows you to score brackets for a tournament by processing NFTs and submitting their scores to the smart contract.

## Prerequisites

- Make sure you have compiled the contracts: `pnpm compile`
- Update the contract addresses in the `scoreTournament.ts` script:
  ```typescript
  // Replace these with your actual contract addresses
  const TOURNAMENT_MANAGER_ADDRESS = "0x..."; 
  const BRACKET_NFT_ADDRESS = "0x...";
  const GAME_SCORE_ORACLE_ADDRESS = "0x...";
  ```
- Set the tournament ID you want to score:
  ```typescript
  // HARDCODED TOURNAMENT ID - CHANGE THIS VALUE TO SCORE A DIFFERENT TOURNAMENT
  const TOURNAMENT_ID = "0";
  ```

## Usage

Simply run one of the following commands depending on which network you want to use:

```bash
# For Base Sepolia testnet
pnpm score:basesepolia

# For Base mainnet
pnpm score:basemain

# For local development
pnpm score:localhost

# For Hardhat network
pnpm score:hardhat
```

## How It Works

The script performs the following steps:

1. Connects to the TournamentManager, BracketNFT, and GameScoreOracle contracts
2. Verifies that the tournament exists and has ended
3. Fetches all NFTs from the BracketNFT contract
4. For each NFT that belongs to the specified tournament:
   - Retrieves the metadata from IPFS
   - Processes the picks to calculate team IDs and win counts
   - Submits the bracket for final scoring
5. Displays a summary of processed NFTs and the tournament winners

## Troubleshooting

- If you encounter errors about missing contract addresses, make sure to update the hardcoded addresses in the script.
- If the script fails to fetch metadata from IPFS, check your internet connection or try using a different IPFS gateway.
- If the tournament is not marked as over, you'll need to wait until the tournament has ended before scoring brackets. 