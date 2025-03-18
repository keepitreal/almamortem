import Link from "next/link";
import { useEffect, useState } from "react";
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
  readOnly?: boolean;
}

export const Controls = ({
  tournamentId = 0,
  isSaving = false,
  readOnly = false,
}: ControlsProps) => {
  const { completedSelections, totalSelections } = useBracket();
  const { paymentTokenMetadata, entryFee } = useTournament(tournamentId);
  const [hasPicks, setHasPicks] = useState(false);

  const ethAmount = Number(
    toTokens(BigInt(entryFee), paymentTokenMetadata?.decimals ?? 18),
  );
  const { usdPrice, isLoading, error } = useEthPrice(ethAmount);

  useEffect(() => {
    setHasPicks(!!localStorage.getItem("bracketUserPicks"));
  }, []);

  const progress =
    totalSelections > 0 ? (completedSelections / totalSelections) * 100 : 0;

  const handleClearPicks = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all picks? This cannot be undone.",
      )
    ) {
      localStorage.removeItem("bracketUserPicks");
      window.location.reload();
    }
  };

  const shouldEnableClear = hasPicks || completedSelections > 0;

  return (
    <div className="controls fixed bottom-0 left-0 right-0 z-50 border-t-2 border-primary bg-primary-content/80 backdrop-blur-sm">
      <div className="mx-auto grid h-16 grid-cols-3 items-center px-8">
        {/* Bracket Owner - leftmost */}
        <div className="flex items-center justify-start">
          <BracketOwner />
        </div>

        {/* Progress text and bar - only show if not readOnly */}
        {!readOnly && (
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
            <button
              onClick={handleClearPicks}
              disabled={!shouldEnableClear}
              className="btn btn-error btn-xs border-red-600 bg-red-600 text-xs font-medium text-white disabled:border-gray-400 disabled:bg-gray-400"
            >
              Clear all
            </button>
          </div>
        )}
        {readOnly && (
          <div className="flex items-center justify-center gap-4">
            <span className="text-md font-medium uppercase">Score:</span>
          </div>
        )}

        {/* Entry Fee or Create Bracket Button */}
        <div className="flex items-center justify-end gap-4">
          {readOnly ? (
            <Link
              href="/bracket/0/build?readOnly=false"
              className="btn btn-primary"
            >
              Create Another Bracket
            </Link>
          ) : (
            <>
              <div className="flex items-center">
                <span className="text-md font-bold uppercase text-base-content/70">
                  Entry Fee:
                </span>
                <span className="text-md ml-2 mr-4 rounded-md border-[3px] border-gray-300 bg-gray-200 px-2 py-1 font-bold text-gray-600">
                  {ethAmount} {paymentTokenMetadata?.symbol}{" "}
                  {!error && !isLoading && usdPrice !== null && (
                    <span className="text-gray-500">
                      (~${usdPrice.toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
              <div className="text-right uppercase italic">
                <SubmitModal
                  modalId="submit-bracket"
                  tournamentId={tournamentId}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
