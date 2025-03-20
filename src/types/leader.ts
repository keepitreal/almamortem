export type Leader = {
  champion: {
    imageUrl: string;
    location: string;
    mascot: string;
  } | null;
  accuracy: number;
  maxAccuracy: number;
  score: number;
  owner: string | undefined;
  nftId: string;
};

export type Leaderboard = {
  id: number;
  score: number;
};