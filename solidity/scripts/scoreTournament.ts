import hre from "hardhat";
import { TournamentManager, BracketNFT, GameScoreOracle } from "../typechain-types";

// Colour codes for terminal prints
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";

// Hardcoded contract addresses - REPLACE THESE WITH YOUR ACTUAL CONTRACT ADDRESSES
const TOURNAMENT_MANAGER_ADDRESS = "0xe438c0B1285C2fD4Ad07551A60f50a74fA239491"; // Replace with actual address
const BRACKET_NFT_ADDRESS = "0xE88ea046421FdEFc2A71a729fb176FBeE4b88fc9"; // Replace with actual address
const GAME_SCORE_ORACLE_ADDRESS = "0xbd016E208BCe80A7EB16722d012f370322E6AEd9"; // Replace with actual address

// HARDCODED TOURNAMENT ID - CHANGE THIS VALUE TO SCORE A DIFFERENT TOURNAMENT
const TOURNAMENT_ID = "0";

// Define the metadata structure
interface MetadataAttribute {
  trait_type: string;
  value: string | number;
}

interface MatchupPick {
  id: number;
  round: string;
  topTeam: { id: string };
  bottomTeam: { id: string };
  winner: string;
}

interface BracketMetadata {
  name: string;
  data: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: MetadataAttribute[];
    picks: MatchupPick[];
  }
}

async function main() {
  console.log(`${GREEN}🏆 Starting scoring process for tournament ID: ${TOURNAMENT_ID}${RESET}`);
  
  // Check if contract addresses are properly set
  // @ts-expect-error Intentionally comparing address strings
  if (TOURNAMENT_MANAGER_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error(`${RED}❌ Tournament Manager address not set. Please update the TOURNAMENT_MANAGER_ADDRESS constant in the script.${RESET}`);
    process.exit(1);
  }
  
  // @ts-expect-error Intentionally comparing address strings
  if (BRACKET_NFT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error(`${RED}❌ Bracket NFT address not set. Please update the BRACKET_NFT_ADDRESS constant in the script.${RESET}`);
    process.exit(1);
  }
  
  // @ts-expect-error Intentionally comparing address strings
  if (GAME_SCORE_ORACLE_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error(`${RED}❌ Game Score Oracle address not set. Please update the GAME_SCORE_ORACLE_ADDRESS constant in the script.${RESET}`);
    process.exit(1);
  }
  
  // Get contract instances
  const tournamentManager = await hre.ethers.getContractAt("TournamentManager", TOURNAMENT_MANAGER_ADDRESS) as unknown as TournamentManager;
  console.log(`${GREEN}✅ Connected to Tournament Manager at ${tournamentManager.target}${RESET}`);
  
  const bracketNFT = await hre.ethers.getContractAt("BracketNFT", BRACKET_NFT_ADDRESS) as unknown as BracketNFT;
  console.log(`${GREEN}✅ Connected to Bracket NFT at ${bracketNFT.target}${RESET}`);
  
  const gameScoreOracle = await hre.ethers.getContractAt("GameScoreOracle", GAME_SCORE_ORACLE_ADDRESS) as unknown as GameScoreOracle;
  
  // Check if tournament exists
  try {
    const tournamentInfo = await tournamentManager.getTournament(TOURNAMENT_ID);
    console.log(`${GREEN}✅ Found tournament ${TOURNAMENT_ID}${RESET}`);
    console.log(`${YELLOW}📊 Tournament info:${RESET}`);
    console.log(`   Entry fee: ${hre.ethers.formatEther(tournamentInfo[0])} ETH`);
    console.log(`   Payment token: ${tournamentInfo[1]}`);
    console.log(`   Start time: ${new Date(Number(tournamentInfo[2]) * 1000).toLocaleString()}`);
    console.log(`   Prize pool: ${hre.ethers.formatEther(tournamentInfo[3])} ETH`);
    console.log(`   Total entries: ${tournamentInfo[4]}`);
  } catch (err) {
    console.error(`${RED}❌ Tournament ${TOURNAMENT_ID} not found or error fetching tournament info${RESET}`);
    console.error(err);
    process.exit(1);
  }
  
  // Check if tournament has ended
  const isTournamentOver = await gameScoreOracle.isTournamentOver();
  if (!isTournamentOver) {
    console.error(`${RED}❌ Tournament is not over yet. Cannot score brackets until the tournament is marked as over.${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}✅ Tournament is marked as over. Proceeding with scoring.${RESET}`);
  
  // Get all NFTs
  console.log(`${YELLOW}📋 Fetching all NFTs...${RESET}`);
  const totalSupply = await bracketNFT.totalSupply();
  console.log(`${GREEN}✅ Found ${totalSupply} total NFTs${RESET}`);
  
  // Track processed NFTs
  let processedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  
  // Process each NFT
  for (let i = 0; i < totalSupply; i++) {
    try {
      const tokenId = await bracketNFT.tokenByIndex(i);
      console.log(`${YELLOW}\n🔍 Processing NFT #${tokenId} (${i+1}/${totalSupply})${RESET}`);
      
      // Get the tournament ID for this NFT
      const nftTournamentId = await bracketNFT.bracketTournaments(tokenId);
      console.log(`${YELLOW}📊 NFT #${tokenId} belongs to tournament ID: ${nftTournamentId}${RESET}`);
      
      // Skip if not for our target tournament
      if (nftTournamentId.toString() !== TOURNAMENT_ID) {
        console.log(`${YELLOW}⏭️ Skipping NFT #${tokenId} - not part of tournament ${TOURNAMENT_ID}${RESET}`);
        skippedCount++;
        continue;
      }
      
      // Check if already scored
      const isScored = await bracketNFT.isScoreSubmitted(tokenId);
      if (isScored) {
        console.log(`${YELLOW}⏭️ Skipping NFT #${tokenId} - already scored${RESET}`);
        skippedCount++;
        continue;
      }
      
      // Get the token URI and fetch metadata
      console.log(`${YELLOW}🌐 Fetching metadata from token URI for NFT #${tokenId}...${RESET}`);
      const uri = await bracketNFT.tokenURI(tokenId);
      
      // Fetch the JSON data from IPFS
      console.log(`${YELLOW}📥 Fetching JSON data from ${uri}...${RESET}`);
      
      // Extract the IPFS hash from the URI (assuming it's in the format ipfs://HASH)
      const ipfsHash = uri.replace('ipfs://', '');
      
      // Fetch the metadata using the IPFS gateway
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      if (!response.ok) {
        console.error(`${RED}❌ Failed to fetch metadata for NFT #${tokenId}: ${response.statusText}${RESET}`);
        failedCount++;
        continue;
      }
      
      const metadata = await response.json() as BracketMetadata;
      console.log(`${GREEN}✅ Fetched metadata for NFT #${tokenId}${RESET}`);
      
      // Extract picks from the metadata
      if (!metadata.data || !metadata.data.picks) {
        console.error(`${RED}❌ No picks found in metadata for NFT #${tokenId}${RESET}`);
        failedCount++;
        continue;
      }
      
      // Process the picks to calculate team IDs and win counts
      const picks = metadata.data.picks;
      console.log(`${GREEN}✅ Found ${picks.length} picks in the bracket${RESET}`);
      
      // Create a map to count wins for each team
      const winCounts = new Map<number, number>();
      
      // Process each pick to count wins
      for (const pick of picks) {
        if (pick.winner) {
          const teamId = parseInt(pick.winner);
          winCounts.set(teamId, (winCounts.get(teamId) || 0) + 1);
        }
      }
      
      // Convert to arrays sorted by team ID
      const entries = Array.from(winCounts.entries()).sort(([a], [b]) => a - b);
      const teamIds = entries.map(([id]) => id);
      const wins = entries.map(([, count]) => count);
      
      console.log(`${GREEN}✅ Parsed team IDs: ${teamIds.join(", ")}${RESET}`);
      console.log(`${GREEN}✅ Parsed win counts: ${wins.join(", ")}${RESET}`);
      
      if (teamIds.length === 0) {
        console.error(`${RED}❌ No winners found in bracket for NFT #${tokenId}${RESET}`);
        failedCount++;
        continue;
      }
      
      // Submit the bracket for final scoring
      console.log(`${YELLOW}📝 Submitting bracket #${tokenId} for final scoring...${RESET}`);
      
      try {
        const tx = await tournamentManager.submitBracketForFinalScoring(
          tokenId,
          teamIds,
          wins
        );
        
        console.log(`${YELLOW}⏳ Transaction submitted. Waiting for confirmation...${RESET}`);
        console.log(`${YELLOW}Transaction hash: ${tx.hash}${RESET}`);
        
        const receipt = await tx.wait();
        console.log(`${GREEN}✅ Successfully submitted bracket #${tokenId} for scoring!${RESET}`);
        console.log(`${GREEN}📜 Transaction confirmed in block ${receipt?.blockNumber}${RESET}`);
        successCount++;
        
        // Get updated winners and scores
        const winners = await tournamentManager.getTournamentWinners(TOURNAMENT_ID);
        console.log(`${GREEN}🏆 Current tournament winners: ${winners.join(", ")}${RESET}`);
        
        // Get and display tournament scores
        try {
          const scores = await tournamentManager.getTournamentScores(TOURNAMENT_ID);
          console.log(`${GREEN}📊 Current top scores:${RESET}`);
          for (let i = 0; i < scores.length && i < 5; i++) {
            console.log(`${GREEN}   #${i+1}: ${scores[i].toString()}${RESET}`);
          }
        } catch (err) {
          console.error(`${YELLOW}⚠️ Could not fetch tournament scores:${RESET}`, err);
        }
      } catch (err) {
        console.error(`${RED}❌ Error submitting bracket #${tokenId} for scoring:${RESET}`, err);
        failedCount++;
        continue;
      }
      
      processedCount++;
    } catch (err) {
      console.error(`${RED}❌ Error processing NFT #${i}:${RESET}`, err);
      failedCount++;
    }
  }
  
  // Get final winners and scores
  try {
    const finalWinners = await tournamentManager.getTournamentWinners(TOURNAMENT_ID);
    console.log(`${GREEN}\n🏆 FINAL TOURNAMENT WINNERS: ${finalWinners.join(", ")}${RESET}`);
    
    // Get and display final tournament scores
    try {
      const finalScores = await tournamentManager.getTournamentScores(TOURNAMENT_ID);
      console.log(`${GREEN}📊 FINAL TOURNAMENT SCORES:${RESET}`);
      for (let i = 0; i < finalScores.length && i < 10; i++) {
        console.log(`${GREEN}   #${i+1}: ${finalScores[i].toString()}${RESET}`);
      }
    } catch (err) {
      console.error(`${YELLOW}⚠️ Could not fetch final tournament scores:${RESET}`, err);
    }
  } catch (err) {
    console.error(`${RED}\n❌ Error getting final tournament winners:${RESET}`, err);
  }
  
  // Print summary
  console.log(`${GREEN}\n📊 SUMMARY:${RESET}`);
  console.log(`${GREEN}✅ Total NFTs processed: ${processedCount}${RESET}`);
  console.log(`${GREEN}✅ Successfully scored: ${successCount}${RESET}`);
  console.log(`${YELLOW}⏭️ Skipped: ${skippedCount}${RESET}`);
  console.log(`${RED}❌ Failed to score: ${failedCount}${RESET}`);
}

// To run it, invoke `npx hardhat run scripts/scoreTournament.ts --network <network_name> <tournamentId>`
main().catch((err) => {
  console.error(`${RED}❌ Unhandled error:${RESET}`, err);
  process.exitCode = 1;
}); 