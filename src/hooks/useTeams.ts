import { api } from "~/utils/api";

export const useTeams = () => {
  return api.team.getAll.useQuery();
};
