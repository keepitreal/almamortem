import { toTokens } from "thirdweb";

import { useBracket } from "~/context/BracketContext";
import { useEthPrice } from "~/hooks/useEthPrice";
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
  const ethAmount = Number(
    toTokens(BigInt(entryFee), paymentTokenMetadata?.decimals ?? 18),
  );
  const { usdPrice, isLoading } = useEthPrice(ethAmount);

  const progress =
    totalSelections > 0 ? (completedSelections / totalSelections) * 100 : 0;

  return (
    <div className="controls fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-primary-content/80 backdrop-blur-sm">
      <div className="mx-auto grid h-16 grid-cols-3 items-center px-8">
        {/* Bracket Owner - leftmost */}
        <div className="flex items-center justify-start">
          <BracketOwner />
        </div>

        {/* Progress text and bar */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-md font-medium uppercase">
            Picked{" "}
            <span className="font-bold">
              {completedSelections} of {totalSelections}
            </span>
          </div>
          <div className="relative h-4 w-24 rounded-full bg-base-300">
            <div
              className="absolute left-0 top-0 h-4 rounded-full bg-primary brightness-90"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Entry Fee */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center">
            <span className="text-md font-bold uppercase text-base-content/70">
              Entry Fee:
            </span>
            <span className="text-md ml-2 mr-4 rounded-md border-[3px] border-gray-300 bg-gray-200 px-2 py-1 font-bold text-gray-600">
              {ethAmount} {paymentTokenMetadata?.symbol}{" "}
              {!isLoading && usdPrice && `(~$${usdPrice.toFixed(2)})`}
            </span>
          </div>
          <div className="text-right uppercase italic">
            <SubmitModal modalId="submit-bracket" tournamentId={tournamentId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
