import { type Region } from "~/types/bracket";

export function generateTeamId(region: Region, seed: number): number {
  // Assign each region a base value that provides enough space for seeds 1-16
  // This ensures no overlap between regions while staying under 256
  const regionBase: Record<string, number> = {
    "West": 0,     // West teams: 1-16
    "East": 50,    // East teams: 51-66
    "South": 100,  // South teams: 101-116
    "Midwest": 150 // Midwest teams: 151-166
  };
  
  // Get the base value for the region
  const base = regionBase[region] ?? 200;
  
  // Add the seed to the base (ensuring it's 1-based)
  return base + seed;
}