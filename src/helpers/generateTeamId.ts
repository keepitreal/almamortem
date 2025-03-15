import { type Region } from "~/types/bracket";

export function generateTeamId(region: Region, seed: number): string {
  return `${region.toLowerCase()}${seed}`;
}