import Image from "next/image";
import { type FC } from "react";
import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

import { LoadingOverlay } from "~/components/LoadingOverlay";
import { useBracket } from "~/context/BracketContext";
import type { RoundName, Team } from "~/types/bracket";
import { getBracketHash } from "~/utils/bracketHash";
import { ROUND_TO_ROUND_ABBREVIATION } from "~/types/bracket";

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base-200 p-4">
        <h1 className="text-2xl font-bold">No more matchups to complete!</h1>
        <p className="mt-4 text-center">
          You&apos;ve completed {completedSelections} out of {totalSelections}{" "}
          picks.
        </p>
        <div className="mt-8">
          <Controls isSaving={isSaving} tournamentId={Number(tournamentId)} />
        </div>
      </div>
    );
  }

  console.log({ currentMatchup });
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

      {/* Footer */}
      <BracketFooter
        completedSelections={completedSelections}
        totalSelections={totalSelections}
        onSubmit={handleSubmitBracket}
        isSaving={isSaving}
        currentRound={currentRound}
        region={currentMatchup.region}
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
  if (!team) return null;

  const roundAbbreviation = ROUND_TO_ROUND_ABBREVIATION[round].toLowerCase();
  const teamImage = team
    ? `url(/images/teams/${roundAbbreviation}/${team.espnId}.png)`
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
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: teamImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </button>
  );
};

const VersusDivider: FC<{
  team1: Team | null;
  team2: Team | null;
}> = ({ team1, team2 }) => {
  if (!team1 || !team2) return null;

  const renderTeam = (team: Team, isRight: boolean) => {
    return (
      <div
        className={`versus relative flex w-2/5 bg-primary-content px-1 text-center text-lg font-bold text-primary ${
          isRight ? "versus-right" : "versus-left"
        }`}
      >
        <div className="flex flex-col items-start justify-center px-2">
          <div className="text-xs italic">{team.name}</div>
          <div className="flex items-center gap-2">
            <span className="bold text-sm italic">{team.mascot}</span>
            <span className="text-base text-xs text-gray-500">{team.seed}</span>
          </div>
        </div>
      </div>
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
