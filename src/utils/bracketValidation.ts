import type { UserMatchup } from "~/types/bracket";

export const hasAllWinners = (userPicks: UserMatchup[]): boolean => {
  return userPicks.every(
    (pick) => pick.winner !== null && pick.winner !== undefined,
  );
};
