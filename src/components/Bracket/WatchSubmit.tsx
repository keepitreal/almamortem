import { watchContractEvent } from '@wagmi/core'
import { type FC } from "react";
import { isAddress } from "thirdweb";
import { isAddressEqual, zeroAddress } from "viem";
import { useAccount } from "wagmi";

import { DEFAULT_CHAIN, TOURNAMENT_ADDRESS } from "~/constants";
import { config } from "~/providers/OnchainProviders";

type Prop = {
  onBracketSubmitted: (tokenId: string) => void;
}
export const WatchSubmit: FC<Prop> = ({ onBracketSubmitted }) => {
  const { address } = useAccount();
  const unwatch = watchContractEvent(config, {
    address: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id],
    abi: [
      {
        name: 'BracketEntered',
        inputs: [
          {
            name: 'tournamentId',
            type: 'uint256',
            indexed: true,
          },
          {
            name: 'participant',
            type: 'address',
            indexed: true,
          },
          {
            name: 'tokenId',
            type: 'uint256',
            indexed: true,
          }
        ],
        type: 'event',
      },
    ],
    eventName: 'BracketEntered',
    // if the pack is opened by the user, unwatch and call onClaim
    onLogs(logs) {
      console.log({logs});
      if (
        logs[0]?.args.participant && 
        isAddress(logs[0].args.participant) && 
        isAddress(address ?? '') &&
        isAddressEqual(logs[0].args.participant, address ?? zeroAddress)
      ) {
        unwatch?.();
        const tokenId = logs[0].args.tokenId?.toString();
        if (tokenId) {
          onBracketSubmitted(tokenId);
        }
      }
    },
    pollingInterval: 1_000, 
  });
  return null;
}
