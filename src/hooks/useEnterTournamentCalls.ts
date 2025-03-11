import { type Call } from "node_modules/@coinbase/onchainkit/src/transaction/types"
import { useEffect,useState } from "react";
import { defineChain, encode, getContract, ZERO_ADDRESS } from "thirdweb";
import { approve } from "thirdweb/extensions/erc20";
import { isAddressEqual } from "viem";

import { CLIENT, DEFAULT_CHAIN, TOURNAMENT_ADDRESS } from "~/constants";
import { useBracket } from "~/context/BracketContext";
import { enterTournament, getTournament } from "~/thirdweb/84532/0xc86fe09b4c9ef65b0180f60610d29a9f096310f1";
import { getBracketHash } from "~/utils/bracketHash";

export const useEnterTournamentCalls = ({
  address,
  tournamentId,
  bracketURI,
}: {
  address: `0x${string}`;
  tournamentId: number;
  bracketURI: string | null;
}) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const { userPicks } = useBracket();

  useEffect(() => {
    const generateCalls = async () => {
      if (!bracketURI) {
        console.error("No bracket URI provided");
        setCalls([]);
        return;
      }
      try {
        const newCalls: Call[] = [];
        
        // Generate the bracket hash and verification arrays
        const bracketHash = getBracketHash(userPicks);
        
        const contract = getContract({
          client: CLIENT,
          address: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id]!,
          chain: defineChain(DEFAULT_CHAIN.id),
        });

        // get the tournament info
        const tournamentInfo = await getTournament({
          contract,
          tournamentId: BigInt(tournamentId),
        });
        const [entryFee, paymentToken] = tournamentInfo;
        const isPaymentNative = isAddressEqual(paymentToken, ZERO_ADDRESS);

        // approve the payment token (if necessary)
        if (!isPaymentNative) {
          const tokenContract = getContract({
            client: CLIENT,
            address: paymentToken as `0x${string}`,
            chain: defineChain(DEFAULT_CHAIN.id),
          });
          const approveTx = approve({
            contract: tokenContract,
            amount: entryFee.toString(),
            spender: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id]!,
          });
          const encodedTxData = await encode(approveTx);
          newCalls.push({
            to: approveTx.to as `0x${string}`,
            data: encodedTxData,
          });
        }

        // enter the tournament with the bracket hash and verification data
        const entryTx = enterTournament({
          contract,
          participant: address,
          bracketHash: bracketHash as `0x${string}`,
          tournamentId: BigInt(tournamentId),
          tiebreaker: 0n,
          bracketURI,
        });

        const encodedTxData = await encode(entryTx);
        newCalls.push({
          to: entryTx.to as `0x${string}`,
          data: encodedTxData,
          value: isPaymentNative ? BigInt(entryFee.toString()) : undefined,
        });

        setCalls(newCalls);
      } catch (error) {
        console.error("Error generating tournament calls:", error);
      }
    };

    void generateCalls();
  }, [address, bracketURI, tournamentId, userPicks]);

  return {
    calls
  };
};
