import { IdentityCard } from "@coinbase/onchainkit/identity";
import { type FC } from "react";
import { type NFT } from "thirdweb";

import { DEFAULT_CHAIN } from "~/constants";

export const LeaderboardEntry: FC<{
  nft: NFT;
  tournamentId: string;
}> = ({ nft, tournamentId }) => {
  console.log({nft, tournamentId})
  return (
    <div>
      {nft.owner && (
        <IdentityCard
          address={nft.owner}
          chain={DEFAULT_CHAIN} 
          schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
        /> 
      )}
    </div>
  );
};

export default LeaderboardEntry;