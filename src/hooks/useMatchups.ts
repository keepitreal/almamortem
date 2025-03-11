import { api } from "~/utils/api";

export const useMatchups = () => {
  return api.matchup.getAll.useQuery();
};
