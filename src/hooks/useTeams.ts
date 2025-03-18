import { useMemo } from "react";

import type { Team } from "~/types/bracket";
import { api } from "~/utils/api";

export const useTeams = () => {
  const { data: matchups, ...rest } = api.matchup.getAll.useQuery();

  const teams = useMemo(() => {
    if (!matchups) return undefined;

    // Get teams from Round of 64 matchups
    const roundOf64Matchups = matchups.filter((m) => m.round === "Round of 64");
    const teamsSet = new Set<Team>();

    roundOf64Matchups.forEach((matchup) => {
      if (matchup.topTeam) teamsSet.add(matchup.topTeam);
      if (matchup.bottomTeam) teamsSet.add(matchup.bottomTeam);
    });

    return Array.from(teamsSet);
  }, [matchups]);

  return {
    ...rest,
    data: teams,
  };
};
