import { type FC } from "react";

import { useBracketScore } from "~/hooks/useBracketScore";
import { useOwnedBracketIds } from "~/hooks/useOwnedBracketIds";
export const BracketScore: FC = () => {
  const { ownedTokenIds } = useOwnedBracketIds();
  // TODO: let the user select which bracket to view
  const { score } = useBracketScore(ownedTokenIds[0] ?? 0);

  return (
    <div className="flex items-center gap-2">
      <span>Score</span>
      <span>{score}</span>
    </div>
  )
};

export default BracketScore;