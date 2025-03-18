import { useQuery } from "@tanstack/react-query";
import { defineChain } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { getNFTs } from "thirdweb/extensions/erc721";

import { CLIENT, DEFAULT_CHAIN, NFT_ADDRESS } from "~/constants";

export const useNFTCount = () => {
  return useQuery({
    queryKey: ["nft-count"],
    queryFn: async () => {
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

      return nfts.length;
    },
  });
};
