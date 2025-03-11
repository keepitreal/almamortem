import { useEffect } from "react";
import { useState } from "react";
import { defineChain } from "thirdweb"
import { getContract } from "thirdweb";
import { getOwnedTokenIds } from "thirdweb/extensions/erc721";
import { useActiveAccount } from "thirdweb/react";

import { CLIENT, DEFAULT_CHAIN, NFT_ADDRESS } from '~/constants';

export const useOwnedBracketIds = () => {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchOwnedTokenIds = async () => {
      if (!account) return;

      setIsLoading(true);
      setError(null);

      try {
        const tokenIds = await getOwnedTokenIds({
          contract: getContract({
            client: CLIENT,
            address: NFT_ADDRESS[DEFAULT_CHAIN.id]!,
            chain: defineChain(DEFAULT_CHAIN.id)
        }),
        owner: account.address
      });
      setOwnedTokenIds(tokenIds.map(Number));
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOwnedTokenIds();
  }, [account]);

  return { ownedTokenIds, isLoading, error };
};
