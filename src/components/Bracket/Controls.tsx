import { toTokens } from "thirdweb";

import { useBracket } from "~/context/BracketContext";
import { useTournament } from "~/hooks/useTournament";

import BracketOwner from "./BracketOwner";
import BracketScore from "./Score";
import SubmitModal from "./SubmitModal";

interface ControlsProps {
  isSaving?: boolean;
  tournamentId?: number;
}

export const Controls = ({
  tournamentId = 0,
  isSaving = false,
}: ControlsProps) => {
  const { completedSelections, totalSelections } = useBracket();
  const { paymentTokenMetadata, entryFee } = useTournament(tournamentId);
  const progress =
    totalSelections > 0 ? (completedSelections / totalSelections) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-primary-content/80 backdrop-blur-sm">
      <div className="py-18 mx-auto flex h-16 items-center justify-between px-8">
        {/* Bracket Owner - leftmost */}
        <div className="flex items-center">
          <BracketOwner />
        </div>

        {/* Progress text and bar */}
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium uppercase">
            Picked{" "}
            <span className="font-bold">
              {completedSelections} of {totalSelections}
            </span>
          </div>
          <div className="relative h-3 w-24 rounded-full bg-base-300">
            <div
              className="absolute left-0 top-0 h-3 rounded-full bg-primary brightness-90"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Score - center */}
        <div className="flex items-center">
          <div className="text-sm text-base-content/70">
            <BracketScore />
          </div>
        </div>

        {/* Entry Fee */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase text-base-content/70">
              Entry Fee:
            </span>
            <span className="rounded-md border-[3px] border-amber-200 bg-amber-50 px-2 py-1 text-sm font-bold">
              {toTokens(BigInt(entryFee), paymentTokenMetadata?.decimals ?? 18)}{" "}
              {paymentTokenMetadata?.symbol}
            </span>
          </div>
        </div>
        <div className="text-right">
          <SubmitModal modalId="submit-bracket" tournamentId={tournamentId} />
        </div>
      </div>
    </div>
  );
};

export default Controls;
