import type { Matchup } from "~/types/bracket";

type MainRegion = "East" | "West" | "South" | "Midwest";

const REGIONS: MainRegion[] = ["East", "West", "South", "Midwest"];

export interface RegionAssignmentTracker {
  "Round of 64": Record<MainRegion, number>;
  "Round of 32": Record<MainRegion, number>;
  "Sweet 16": Record<MainRegion, number>;
  "Elite 8": Record<MainRegion, number>;
  "Final 4": Record<MainRegion, number>;
  Championship: Record<MainRegion, number>;
}

const MAX_ASSIGNMENTS_PER_ROUND: Record<Matchup["round"], number> = {
  "Round of 64": 8, // 32 total games, 8 per region
  "Round of 32": 4, // 16 total games, 4 per region
  "Sweet 16": 2, // 8 total games, 2 per region
  "Elite 8": 1, // 4 total games, 1 per region
  "Final 4": 1, // 2 total games, regions don't matter as much
  Championship: 1, // 1 game
};

// Initialize a tracker with all counts at 0
const createEmptyTracker = (): RegionAssignmentTracker => ({
  "Round of 64": { East: 0, West: 0, South: 0, Midwest: 0 },
  "Round of 32": { East: 0, West: 0, South: 0, Midwest: 0 },
  "Sweet 16": { East: 0, West: 0, South: 0, Midwest: 0 },
  "Elite 8": { East: 0, West: 0, South: 0, Midwest: 0 },
  "Final 4": { East: 0, West: 0, South: 0, Midwest: 0 },
  Championship: { East: 0, West: 0, South: 0, Midwest: 0 },
});

export const assignRegion = (
  round: Matchup["round"],
  tracker: RegionAssignmentTracker,
): MainRegion => {
  // Get available regions (those that haven't hit their max for this round)
  const availableRegions = REGIONS.filter((region) => {
    const currentCount = tracker[round][region];
    const maxCount = MAX_ASSIGNMENTS_PER_ROUND[round];
    return currentCount < maxCount;
  });

  console.log(tracker);

  if (availableRegions.length === 0) {
    throw new Error(`No available regions for round ${round}`);
  }

  // Randomly select from available regions
  const randomIndex = Math.floor(Math.random() * availableRegions.length);
  const selectedRegion = availableRegions[randomIndex]!;

  // Update the tracker
  tracker[round][selectedRegion]++;

  return selectedRegion;
};

export { createEmptyTracker };
