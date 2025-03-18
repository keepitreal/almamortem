export type Leader = {
  champion: {
    imageUrl: string;
    location: string;
    mascot: string;
  } | null;
  accuracy: number;
  maxAccuracy: number;
  owner: string | undefined;
  nftId: string;
};
