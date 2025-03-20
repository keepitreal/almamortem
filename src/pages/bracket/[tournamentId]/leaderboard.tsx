import { type GetServerSideProps, type NextPage } from "next";
import { useMemo } from "react";
import { defineChain, type NFT } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { getNFTs } from "thirdweb/extensions/erc721";

import { LeaderboardEntry } from "~/components/Leaderboard/Entry";
import { CLIENT, DEFAULT_CHAIN, NFT_ADDRESS } from "~/constants";
import { useMatchups } from "~/hooks/useMatchups";
import { type NFTPick, type Team } from "~/types/bracket";
import type { Leader, Leaderboard as LeaderboardType } from "~/types/leader";
import { api } from "~/utils/api";

// make get server side props
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { tournamentId } = params as { tournamentId: string };

  const nftContract = getContract({
    address: NFT_ADDRESS[DEFAULT_CHAIN.id]!,
    client: CLIENT,
    chain: defineChain(DEFAULT_CHAIN.id),
  });

  const nfts = await getNFTs({
    contract: nftContract,
    includeOwners: true,
    start: 0,
  });

  const serlializedNfts = nfts.map((nft) => ({
    ...nft,
    id: nft.id.toString(),
  }));

  return {
    props: { tournamentId, nfts: serlializedNfts },
  };
};

interface NFTMetadata {
  data: {
    picks: NFTPick[];
  };
}

function decorateNFT(nft: NFT, teamsById: Record<number, Team>, leaderboard: LeaderboardType[]): Leader {
  const metadata = nft.metadata as unknown as NFTMetadata;
  const championshipPick = metadata.data?.picks?.find(
    (pick: NFTPick) => pick.round === "Championship",
  );
  const championTeam = championshipPick?.winner
    ? teamsById[Number(championshipPick.winner)]
    : null;

  return {
    champion: championTeam
      ? {
          imageUrl: `/images/teams/champ/${championTeam.isFirstFour ? "ff" : championTeam.espnId}.png`,
          location: championTeam.location,
          mascot: championTeam.mascot,
        }
      : null,
    accuracy: 0,
    maxAccuracy: 100,
    score: leaderboard.find((l) => l.id === Number(nft.id))?.score ?? 0,
    owner: typeof nft.owner === "string" ? nft.owner : undefined,
    nftId: nft.id.toString(),
  };
}

export const Leaderboard: NextPage<{
  tournamentId: string;
  nfts: NFT[];
}> = ({ tournamentId, nfts }) => {
  const { data: matchups, isLoading: isLoadingMatchups } = useMatchups();
  const { data: leaderboard } = api.leaderboard.getByTournamentId.useQuery({
    tournamentId: Number(tournamentId),
  });

  const teamsById = useMemo(() => {
    if (!matchups) return {};

    const teams: Record<number, Team> = {};
    matchups
      .filter((m) => m.round === "Round of 64")
      .forEach((matchup) => {
        if (matchup.topTeam) {
          teams[matchup.topTeam.id] = matchup.topTeam;
        }
        if (matchup.bottomTeam) {
          teams[matchup.bottomTeam.id] = matchup.bottomTeam;
        }
      });
    return teams;
  }, [matchups]);

  const decoratedNfts = useMemo(
    () => nfts.map((nft) => decorateNFT(nft, teamsById, leaderboard ?? [])),
    [nfts, teamsById, leaderboard],
  );

  if (isLoadingMatchups || !matchups) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto mt-20 flex max-w-4xl flex-col gap-4">
      {/* Headers */}
      <div className="flex w-full items-center justify-between rounded-lg bg-base-200 px-8 pt-4 font-sans font-bold">
        <div className="w-1/3">Player</div>
        <div className="w-1/6 text-center">Score</div>
        <div className="w-1/3 text-right">Overall Champion</div>
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {decoratedNfts.sort((a, b) => b.score - a.score).map((leader, index) => (
          <LeaderboardEntry
            key={nfts[index]?.id}
            leader={leader}
            tournamentId={tournamentId}
          />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
