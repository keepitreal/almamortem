import { type Region } from "~/types/bracket";

enum RegionId {
  Unknown = 0,
  West = 1,
  East = 2,
  South = 3,
  Midwest = 4,
}

export function generateTeamId(region: Region, seed: number): number {
  const regionId = RegionId[region as keyof typeof RegionId] || RegionId.Unknown;
  // Combine region ID and seed to create a number like 11, 23, 42, etc.
  return regionId * 10 + seed;
}