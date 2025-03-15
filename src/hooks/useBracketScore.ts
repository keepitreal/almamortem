import { useCallback, useEffect, useState } from 'react';
import { defineChain, getContract } from 'thirdweb';

import { CLIENT, DEFAULT_CHAIN, TOURNAMENT_ADDRESS } from '~/constants';
import { useBracket } from '~/context/BracketContext';
import { scoreBracket } from '~/thirdweb/84532/0x136548e2e4a9be1efb2e3e72e14afbbe829029b0';
import { type UserMatchup } from '~/types/bracket';
import { getBracketVerificationArrays } from '~/utils/bracketHash';

export const useBracketScore = (tokenId: number) => {
  const { userPicks } = useBracket();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [score, setScore] = useState<number | null>(null);

  const verifyBracket = useCallback(async (userPicks: UserMatchup[]) => {
    if (!userPicks.length) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Get the arrays of team IDs and their win counts
      const [teamIds, winCounts] = getBracketVerificationArrays(userPicks);

      try {
        const scoreBracketCall = await scoreBracket({
          contract: getContract({
            client: CLIENT,
            address: TOURNAMENT_ADDRESS[DEFAULT_CHAIN.id]!,
            chain: defineChain(DEFAULT_CHAIN.id)
          }),
          tokenId: BigInt(tokenId),
          teamIds: teamIds.map(BigInt),
          winCounts: winCounts.map(BigInt),
        });
    
        // TODO: Get actual score from contract response
        setScore(Number(scoreBracketCall));
      } catch (err) {
        console.error('Error scoring bracket', err);
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to score bracket'));
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    void verifyBracket(userPicks);
  }, [verifyBracket, userPicks]);

  return {
    isLoading,
    error,
    score,
  };
}