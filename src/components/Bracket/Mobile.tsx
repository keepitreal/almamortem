import Image from "next/image";
import { type FC } from "react";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { CheckmarkCircle } from "~/components/icons/CheckmarkCircle";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { useBracket } from "~/context/BracketContext";
import type { RoundName, Team } from "~/types/bracket";
import { ROUND_TO_ROUND_ABBREVIATION } from "~/types/bracket";
import { getBracketHash } from "~/utils/bracketHash";

import { Controls } from "./Controls";

interface MobileProps {
  tournamentId: string;
}

interface BracketFooterProps {
  completedSelections: number;
  totalSelections: number;
  onSubmit: () => void;
  isSaving: boolean;
  currentRound: string;
  region?: string;
}

const BracketFooter: FC<BracketFooterProps> = ({
  completedSelections,
  totalSelections,
  onSubmit,
  isSaving,
  currentRound,
  region,
}) => {
  return (
    <div className="sticky bottom-0 z-10 bg-base-300 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          {region && (
            <span className="text-sm font-semibold text-primary">
              {region} Region
            </span>
          )}
          <span className="text-base">{currentRound}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {completedSelections}/{totalSelections}
          </span>
          {completedSelections === totalSelections && (
            <button
              onClick={onSubmit}
              className="btn btn-primary"
              disabled={isSaving}
            >
              Submit Bracket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Mobile: FC<MobileProps> = ({ tournamentId }) => {
  const {
    userPicks,
    setWinner,
    isLoading,
    currentMatchup,
    currentRound,
    completedSelections,
    totalSelections,
  } = useBracket();
  const account = useActiveAccount();
  const [isSaving, setIsSaving] = useState(false);

  const handleTeamSelect = (team: Team) => {
    if (!currentMatchup) return;

    setIsSaving(true);
    setWinner(currentMatchup.id, team.id);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleSubmitBracket = async () => {
    if (!account?.address) {
      alert("Please connect your wallet to submit your bracket!");
      return;
    }

    try {
      const bracketHash = getBracketHash(userPicks);
      console.log("Generated Merkle Root:", bracketHash);
      console.log("Submitting bracket with merkle root:", bracketHash);
      alert("Bracket submitted successfully!");
    } catch (error) {
      console.error("Error generating merkle root:", error);
      alert("Error submitting bracket. Please try again.");
    }
  };

  if (!currentMatchup) {
    return <div></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-200 pt-16">
      {isLoading && <LoadingOverlay />}
      {/* Matchup Display */}
      <div className="flex flex-1 flex-col">
        {/* Top Team */}
        <MatchupTeam
          team={currentMatchup.topTeam}
          handleTeamSelect={handleTeamSelect}
          isSaving={isSaving}
          imageName="baylor"
          isRight={false}
          round={currentMatchup.round}
        />

        {/* VS Divider */}
        <VersusDivider
          team1={currentMatchup.topTeam}
          team2={currentMatchup.bottomTeam}
          handleTeamSelect={handleTeamSelect}
          isSaving={isSaving}
        />

        {/* Bottom Team */}
        <MatchupTeam
          team={currentMatchup.bottomTeam}
          handleTeamSelect={handleTeamSelect}
          isSaving={isSaving}
          imageName="coleman"
          isRight={true}
          round={currentMatchup.round}
        />
      </div>

      <Controls
        isSaving={isSaving}
        tournamentId={Number(tournamentId)}
        isMobile
      />
    </div>
  );
};

const MatchupTeam: FC<{
  team: Team | null;
  handleTeamSelect: (team: Team) => void;
  isSaving: boolean;
  imageName: string;
  isRight: boolean;
  round: RoundName;
}> = ({ team, handleTeamSelect, isSaving, imageName, isRight, round }) => {
  const { currentMatchup } = useBracket();
  const isSelected = currentMatchup?.winner === team?.id;

  if (!team) return null;

  const roundAbbreviation = ROUND_TO_ROUND_ABBREVIATION[round].toLowerCase();
  const id = team?.isFirstFour ? "ff" : team?.espnId;
  const teamImage = team
    ? `url(/images/teams/${roundAbbreviation}/${id}.png)`
    : "";

  return (
    <button
      onClick={() => team && handleTeamSelect(team)}
      className={`matchup-team relative flex flex-1 flex-col items-center justify-start overflow-hidden p-8 ${
        isRight ? "matchup-team-right" : "matchup-team-left"
      }`}
      disabled={isSaving}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: teamImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Checkmark Icon */}
      {isSelected && (
        <div
          className={`absolute right-4 ${
            isRight ? "bottom-4" : "top-4"
          } z-10 text-red-600`}
        >
          <CheckmarkCircle />
        </div>
      )}
    </button>
  );
};

const VersusDivider: FC<{
  team1: Team | null;
  team2: Team | null;
  handleTeamSelect: (team: Team) => void;
  isSaving: boolean;
}> = ({ team1, team2, handleTeamSelect, isSaving }) => {
  if (!team1 || !team2) return null;

  const renderTeam = (team: Team, isRight: boolean) => {
    return (
      <button
        onClick={() => !isSaving && handleTeamSelect(team)}
        disabled={isSaving}
        className={`versus relative flex w-2/5 cursor-pointer bg-primary-content px-1 text-center text-lg font-bold text-primary focus:outline-none ${
          isRight ? "versus-right" : "versus-left"
        }`}
      >
        <div className="flex flex-col items-start justify-center px-2">
          <div className="text-xs italic">{team.location}</div>
          <div className="flex items-center gap-2">
            <span className="bold text-sm italic">{team.mascot}</span>
            <span className="text-base text-xs text-gray-500">{team.seed}</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="z-10 flex items-stretch justify-around overflow-visible bg-base-300">
      {renderTeam(team1, false)}
      <span className="versus-symbol relative w-1/5 bg-primary py-4 text-center font-bold italic text-primary-content">
        VS
      </span>
      {renderTeam(team2, true)}
    </div>
  );
};
