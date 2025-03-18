import { IdentityCard } from "@coinbase/onchainkit/identity";
import Image from "next/image";
import { useRouter } from "next/router";
import { type FC } from "react";

import { DEFAULT_CHAIN } from "~/constants";
import type { Leader } from "~/types/leader";

interface LeaderboardEntryProps {
  leader: Leader;
  tournamentId: string;
}

export const LeaderboardEntry: FC<LeaderboardEntryProps> = ({
  leader,
  tournamentId,
}) => {
  const router = useRouter();

  const handleClick = () => {
    void router.push({
      pathname: `/bracket/${tournamentId}/view/${leader.nftId}`,
      query: { readOnly: true },
    });
  };

  return (
    <div
      onClick={handleClick}
      className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-base-100 px-2 shadow-sm transition-all"
    >
      {/* Player Column */}
      <div className="w-1/3">
        {leader.owner && (
          <IdentityCard
            address={leader.owner}
            chain={DEFAULT_CHAIN}
            schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
            className="border-none bg-primary-content [&_*]:!border-none [&_*]:!text-primary [&_div]:!border-none [&_div]:!text-primary [&_p]:!text-primary [&_span]:!text-primary"
          />
        )}
      </div>

      {/* Accuracy Column */}
      <div className="w-1/6 text-center">
        <span className="font-mono text-lg">{leader.accuracy}%</span>
      </div>

      {/* Max Accuracy Column */}
      <div className="w-1/6 text-center">
        <span className="font-mono text-lg">{leader.maxAccuracy}%</span>
      </div>

      {/* Champion Column */}
      <div className="flex w-1/3 items-center justify-end gap-2">
        {leader.champion ? (
          <>
            <div className="text-right">
              <div className="font-sans text-sm font-bold">
                {leader.champion.location}
              </div>
              <div className="font-sans text-sm">{leader.champion.mascot}</div>
            </div>
            <div className="relative h-16 w-16">
              <Image
                src={leader.champion.imageUrl}
                alt={`${leader.champion.location} ${leader.champion.mascot}`}
                fill
                className="object-cover"
              />
            </div>
          </>
        ) : (
          <div className="h-12 w-12 rounded-full bg-base-300" />
        )}
      </div>
    </div>
  );
};

export default LeaderboardEntry;
