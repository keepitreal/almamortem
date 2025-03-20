import { createThirdwebClient, defineChain, getContract } from "thirdweb";
import { getNFTs } from "thirdweb/extensions/erc721";
import { z } from "zod";

import { DEFAULT_CHAIN, NFT_ADDRESS, TOURNAMENT_ADDRESS } from "~/constants";
import { env } from "~/env";
import { redis } from "~/lib/redis";
import { scoreBracket } from "~/thirdweb/8453/0xf8a7d44d5cc6f3124d1432a790e613b77865e83e";
import { type UserMatchup } from "~/types/bracket";
import { type Leaderboard } from "~/types/leader";
import { getBracketVerificationArrays } from "~/utils/bracketHash";

import { publicProcedure } from "../trpc";
import { createTRPCRouter } from "../trpc";

type Pick = {
  id: number;
  round: string;
  topTeam: {
    id: number;
  };
  bottomTeam: {
    id: number;
  };
  winner: number;
};

export const leaderboardRouter = createTRPCRouter({
  getByTournamentId: publicProcedure
    .input(z.object({
      tournamentId: z.number(),
    }))
    .query(async ({ input }) => {
      const CACHE_KEY = `leaderboard:${input.tournamentId}`;
      const cachedLeaderboard = await redis.get<Leaderboard[]>(CACHE_KEY);
      if (cachedLeaderboard) {
        console.log("returning cached leaderboard");
        return cachedLeaderboard;
      }
      const leaderboard = await getLeaderboard(input.tournamentId);
      await redis.set(CACHE_KEY, leaderboard, { ex: 3600 }); // Cache for 5 minutes
      return leaderboard;
    }),
});

export async function getLeaderboard(tournamentId: number): Promise<Leaderboard[]> {
  // TODO: right now, all nfts are part of the same tournament but in the future, we will need to filter nfts by tournament id
  console.log("getLeaderboard", tournamentId);
  
  const client = createThirdwebClient({
    clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
  });
  const nftContract = getContract({
    client,
    chain: defineChain(DEFAULT_CHAIN.id),
    address: NFT_ADDRESS[DEFAULT_CHAIN.id]!,
  });
  const nfts = await getNFTs({
    contract: nftContract,
    start: 0,
  });

  const tournamentContract = getContract({
    client,
    chain: defineChain(DEFAULT_CHAIN.id),
    address: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id]!,
  });
    
  // a map of the nft id to the score
  const scores = new Map<bigint, number>();
  let successCount = 0;
  let failureCount = 0;
  const failedNftIds: bigint[] = [];
  for (const nft of nfts) {
    try {
      const { picks } = nft.metadata.data as { picks: Pick[] };
      const [teamIds, winsCounts] = getBracketVerificationArrays(picks as UserMatchup[]);

      // calculate the score
      let score = BigInt(0);
      score = await scoreBracket({
        tokenId: nft.id,
        contract: tournamentContract,
        teamIds: teamIds.map(BigInt),
        winCounts: winsCounts.map(BigInt),
      });
      scores.set(nft.id, Number(score));
      successCount++;
    } catch (error) {
      console.error("Error processing NFT:", nft.id, error);
      failedNftIds.push(nft.id);
      failureCount++;
    }
  }
  console.log(`Processed ${successCount} NFTs successfully, ${failureCount} failed. ${failureCount > 0 ? `Failed NFTs: ${failedNftIds.join(", ")}` : ""}`);

  const leaderboard = Array.from(scores.entries()).map(([id, score]) => ({
    id: Number(id),
    score,
  }));
  return leaderboard;
}
