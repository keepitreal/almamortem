import { generateHardcodedBracket, getBracketHash } from "../utils/enterTournamentWithTesters";

async function main() {
  console.log("Testing bracket hash generation...");
  
  // Generate 5 brackets and check their hashes
  const hashes = new Set<string>();
  
  for (let i = 0; i < 5; i++) {
    const bracket = generateHardcodedBracket();
    const hash = getBracketHash(bracket);
    
    console.log(`Bracket ${i + 1} hash: ${hash}`);
    hashes.add(hash);
  }
  
  console.log(`\nGenerated ${hashes.size} unique hashes out of 5 brackets`);
  
  if (hashes.size === 5) {
    console.log("SUCCESS: All brackets have unique hashes!");
  } else {
    console.log("WARNING: Some brackets have duplicate hashes.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 