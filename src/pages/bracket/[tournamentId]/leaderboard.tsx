import { type GetServerSideProps, type NextPage } from "next";
import { defineChain, type NFT } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { getNFTs } from "thirdweb/extensions/erc721";

import { LeaderboardEntry } from "~/components/Leaderboard/Entry";
import { CLIENT, DEFAULT_CHAIN, NFT_ADDRESS } from "~/constants";

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

export const Leaderboard: NextPage<{
  tournamentId: string;
  nfts: NFT[];
}> = ({ tournamentId, nfts }) => {
  return (
    <div className="flex flex-col mt-20 mx-auto max-w-md gap-2">
      <h1>Leaderboard</h1>
      <div className="flex flex-col gap-2">
        {nfts.map((nft) => (
          <LeaderboardEntry tournamentId={tournamentId} key={nft.id} nft={nft} />
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;