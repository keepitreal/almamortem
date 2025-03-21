import { type LifecycleStatus, Transaction,TransactionButton } from "@coinbase/onchainkit/transaction";
import { type FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { defineChain, encode } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { useAccount } from "wagmi";

import { CHAINLINK_GAS_LIMIT, CHAINLINK_JOB_ID, CHAINLINK_SUBSCRIPTION_ID, DEFAULT_CHAIN, ORACLE_ADDRESS } from "~/constants";
import { CLIENT } from "~/constants";
import { fetchTeamWins, lastUpdateTimestamp, timeUntilCooldownExpires } from "~/thirdweb/8453/0xdad0a4b5b845df3897489a4eaf638e680e427c58";
import { type Call } from "~/types/call";


export const RefreshScores: FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const { address } = useAccount();
  const [toastShown, setToastShown] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(0);
  const [timeUntilNextUpdateAllowed, setTimeUntilNextUpdateAllowed] = useState<number>(0);

  const onStatusChange = (status: LifecycleStatus) => {
    if (status.statusName === "success") {
      if (!toastShown) {
        toast.success("Scores refreshed successfully");
        setToastShown(true);
      }
    }
  };

  useEffect(() => {
    const fetchLastUpdatedAt = async () => {
      const contract = getContract({
        client: CLIENT,
        chain: defineChain(DEFAULT_CHAIN.id),
        address: ORACLE_ADDRESS[DEFAULT_CHAIN.id]!,
      });
      const [lastUpdatedTimestampValue, timeUntilNextUpdateAllowedValue] = await Promise.all([
        lastUpdateTimestamp({
          contract,
        }),
        timeUntilCooldownExpires({
          contract,
        }),
      ]);
      setLastUpdatedAt(Number(lastUpdatedTimestampValue));
      setTimeUntilNextUpdateAllowed(Number(timeUntilNextUpdateAllowedValue));
    };
    void fetchLastUpdatedAt();
  }, []);


  useEffect(() => {
    const fetchCalls = async () => {
      const contract = getContract({
        client: CLIENT,
        chain: defineChain(DEFAULT_CHAIN.id),
        address: ORACLE_ADDRESS[DEFAULT_CHAIN.id]!,
      });
      const tx = fetchTeamWins({
        contract,
        args: [],
        subscriptionId: CHAINLINK_SUBSCRIPTION_ID[DEFAULT_CHAIN.id]!,
        gasLimit: CHAINLINK_GAS_LIMIT,
        jobId: CHAINLINK_JOB_ID[DEFAULT_CHAIN.id]!,
      });
      const encodedTx = await encode(tx);
      setCalls([{
        to: contract.address,
        data: encodedTx,
      }]);
    };
    void fetchCalls();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!address) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Transaction
        chainId={DEFAULT_CHAIN.id}
        className="btn btn-primary"
        calls={calls}
        onStatus={onStatusChange}
      >
        <TransactionButton
          text="Refresh Onchain Scores"
          className={`btn btn-primary rounded-none uppercase italic ${timeUntilNextUpdateAllowed > 0 ? "btn-disabled" : ""}`}
          disabled={calls.length === 0 || timeUntilNextUpdateAllowed > 0}
        />
      </Transaction>
      <p className="text-xs text-end">
        Last updated: {new Date(lastUpdatedAt * 1000).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
      <p className="text-xs text-end">
        {timeUntilNextUpdateAllowed > 0 && `${timeUntilNextUpdateAllowed} seconds until scores can be refreshed`}
      </p>
    </div>
  );
};
