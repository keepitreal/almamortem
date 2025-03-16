import { generateValidBracket, getBracketHash } from "../utils/enterTournamentWithTesters";

async function main() {
  console.log("Testing tournament entry bracket generation...");
  
  // Generate 5 brackets and check their hashes
  const hashes = new Set<string>();
  
  for (let i = 0; i < 5; i++) {
    console.log(`\nGenerating bracket ${i + 1}/5...`);
    
    // Generate a valid bracket
    console.log("Generating valid bracket...");
    const bracket = await generateValidBracket();
    
    // Calculate bracket hash
    const bracketHash = getBracketHash(bracket);
    console.log(`Bracket hash: ${bracketHash}`);
    
    hashes.add(bracketHash);
  }
  
  console.log(`\nGenerated ${hashes.size} unique hashes out of 5 brackets`);
  
  if (hashes.size === 5) {
    console.log("SUCCESS: All brackets have unique hashes!");
  } else {
    console.log("WARNING: Some brackets have duplicate hashes.");
    console.log(`Duplicate rate: ${(5 - hashes.size) / 5 * 100}%`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 