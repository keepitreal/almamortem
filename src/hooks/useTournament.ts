import { useCallback, useEffect, useState } from "react";
import { defineChain, getContract, ZERO_ADDRESS } from "thirdweb";
import { getCurrencyMetadata, type GetCurrencyMetadataResult } from "thirdweb/extensions/erc20";
import { isAddressEqual } from "viem";

import { CLIENT, DEFAULT_CHAIN, TOURNAMENT_ADDRESS } from "~/constants";
import { tournaments } from "~/thirdweb/84532/0x851df8753a0ad16ec4f5a05ae9838fc6f6aa95fa";

export const useTournament = (tournamentId: number) => {
  const [entryFee, setEntryFee] = useState<number>(0);
  const [paymentTokenAddress, setPaymentTokenAddress] = useState<string>("");
  const [paymentTokenMetadata, setPaymentTokenMetadata] = useState<GetCurrencyMetadataResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [prizePool, setPrizePool] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const tournamentContract = getContract({
    client: CLIENT,
    address: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id]!,
    chain: defineChain(DEFAULT_CHAIN.id),
  });

  const fetchTournament = useCallback(async () => {
    if (!tournamentContract) return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const [
        entryFee,
        paymentTokenAddress,
        startTime,
        prizePool,
        totalEntries,
      ] = await tournaments({
        contract: tournamentContract,
        arg_0: BigInt(tournamentId),
      });

      setEntryFee(Number(entryFee));
      setPaymentTokenAddress(paymentTokenAddress);
      setStartTime(Number(startTime));
      setPrizePool(Number(prizePool));
      setTotalEntries(Number(totalEntries));

      const definedChain = defineChain(DEFAULT_CHAIN.id);
      
      if (isAddressEqual(paymentTokenAddress, ZERO_ADDRESS)) {
        setPaymentTokenMetadata({
          name: definedChain.nativeCurrency?.name ?? "Ether",
          symbol: definedChain.nativeCurrency?.symbol ?? "ETH",
          decimals: definedChain.nativeCurrency?.decimals ?? 18,
        });
        return;
      }

      const paymentTokenContract = getContract({
        client: CLIENT,
        address: paymentTokenAddress,
        chain: definedChain,
      });

      const paymentTokenMetadata = await getCurrencyMetadata({
        contract: paymentTokenContract,
      });

      setPaymentTokenMetadata(paymentTokenMetadata);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentContract, tournamentId, isLoading]);

  useEffect(() => {
    void fetchTournament();
  }, [fetchTournament]);

  return {
    isLoading,
    error,
    fetchTournament,
    entryFee,
    paymentTokenAddress,
    paymentTokenMetadata,
    startTime,
    prizePool,
    totalEntries,
  };
};
