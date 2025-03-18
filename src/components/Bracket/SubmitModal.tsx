import {
  Transaction,
  TransactionButton,
} from "@coinbase/onchainkit/transaction";
import { type LifecycleStatus } from "@coinbase/onchainkit/transaction";
import { type FC, useCallback, useState } from "react";
import { toast } from "react-toastify";
import { upload } from "thirdweb/storage";
import { useAccount } from "wagmi";

import { APP_NAME, APP_URL, CLIENT, DEFAULT_CHAIN } from "~/constants";
import { useBracket } from "~/context/BracketContext";
import { useEnterTournamentCalls } from "~/hooks/useEnterTournamentCalls";
import { useTeams } from "~/hooks/useTeams";

import { Portal } from "../utils/Portal";

interface SubmitModalProps {
  modalId: string;
  tournamentId: number;
}

const SubmitModal: FC<SubmitModalProps> = ({ modalId, tournamentId }) => {
  const { address, isConnected } = useAccount();
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsUri, setIpfsUri] = useState<string | null>(null);

  // calls will not generate without an ipfsUri
  const { calls } = useEnterTournamentCalls({
    address: address as `0x${string}`,
    tournamentId,
    bracketURI: ipfsUri,
  });
  const { userPicks } = useBracket();
  const teams = useTeams();

  const onStatusChange = (status: LifecycleStatus) => {
    // if (status.statusName === "success") {
    //   if (!toastShown) {
    //     toast.success("Bracket submitted successfully");
    //     setToastShown(true);
    //   }
    //   // close the modal
    //   document.getElementById(modalId)?.click();
    //   // reset the toastShown state
    //   setToastShown(false);
    // }
  };

  // handle modal open will upload NFT data to IPFS.
  // Having a IPFS uri will kick off the generation of tx calls.
  // once there are tx calls, the submit button will be enabled.
  const handleModalOpen = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to submit your bracket");
      return;
    }
    // find the team id with the most wins picked by the user
    const teamId = userPicks.reduce(
      (counts, pick) => {
        const winnerId = pick.winner;
        if (winnerId) {
          counts[winnerId] = (counts[winnerId] ?? 0) + 1;
        }
        return counts;
      },
      {} as Record<number, number>,
    );

    // Get the team with the highest count
    const mostPickedTeamId = Object.entries(teamId).reduce(
      (mostPicked, [id, count]) =>
        count > mostPicked.count ? { id: parseInt(id), count } : mostPicked,
      { id: -1, count: 0 },
    ).id;

    const mostPickedTeam = teams.data?.find(
      (team) => team.id === mostPickedTeamId,
    );

    if (!mostPickedTeam) {
      toast.error("No winning team found in bracket");
      return;
    }

    try {
      setIsUploading(true);
      const uri = await upload({
        client: CLIENT,
        files: [
          {
            name: `${APP_NAME} Bracket`,
            data: {
              name: `${APP_NAME} Bracket`,
              description:
                "A detailed description of my NFT artwork or collectible.",
              image: mostPickedTeam.logoUrl,
              external_url: `${APP_URL}`,
              attributes: [
                {
                  trait_type: "Winning Team",
                  value: mostPickedTeam.name,
                },
                {
                  trait_type: "Tournament ID",
                  value: tournamentId,
                },
              ],
              // map to the minimum amount of data needed to reconstruct the bracket
              picks: userPicks.map((pick) => ({
                id: pick.id,
                round: pick.round,
                topTeam: {
                  id: pick.topTeam?.id,
                },
                bottomTeam: {
                  id: pick.bottomTeam?.id,
                },
                winner: pick.winner,
              })),
            },
          },
        ],
      });
      console.log({ uri });
      setIpfsUri(uri);
    } catch (error) {
      toast.error("Error uploading bracket to IPFS");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }, [userPicks, teams.data, tournamentId, isConnected]);

  return (
    <>
      <label htmlFor={modalId} className="btn btn-primary">
        Submit Bracket
      </label>

      <Portal>
        <input
          type="checkbox"
          onClick={() => handleModalOpen()}
          id={modalId}
          className="modal-toggle"
        />
        <div className="submit-modal modal" role="dialog">
          <div className="modal-box">
            <h3 className="text-center text-lg font-bold">Submit Bracket</h3>
            <div className="py-4 text-start">
              <p>This will submit your bracket and cannot be undone.</p>
            </div>
            <div className="modal-action">
              <label
                htmlFor={modalId}
                className="btn btn-ghost"
                onClick={() => setIpfsUri(null)}
              >
                Cancel
              </label>
              <Transaction
                chainId={DEFAULT_CHAIN.id}
                calls={calls}
                className="flex justify-end"
                onStatus={onStatusChange}
              >
                <TransactionButton
                  className="btn btn-primary rounded-none uppercase italic"
                  text="Submit Bracket"
                  disabled={calls.length === 0 || isUploading}
                />
              </Transaction>
            </div>
          </div>
          <label
            className="modal-backdrop"
            htmlFor={modalId}
            onClick={() => setIpfsUri(null)}
          >
            Close
          </label>
        </div>
      </Portal>
    </>
  );
};

export default SubmitModal;
