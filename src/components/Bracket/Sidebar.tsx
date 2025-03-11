import Image from "next/image";
import { useEffect, useRef } from "react";

import { CheckmarkCircle } from "~/components/ui/CheckmarkCircle";
import type { Team, UserMatchup } from "~/types/bracket";
import type { RoundName } from "~/types/bracket";

interface TeamRowProps {
  team: Team | null;
  isSelected: boolean;
}

const TeamRow: React.FC<TeamRowProps> = ({ team, isSelected }) => {
  if (!team) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image
          src={team.logoUrl}
          alt={`${team.name} ${team.mascot} logo`}
          width={24}
          height={24}
          className="rounded-full"
          unoptimized
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold">{team.name}</span>
            <span className="text-xs text-base-content/50">{team.seed}</span>
          </div>
          <div className="text-xs text-base-content/70">{team.mascot}</div>
        </div>
      </div>
      {isSelected && <CheckmarkCircle className="h-4 w-4 text-green-600" />}
    </div>
  );
};

interface SidebarProps {
  currentRound: RoundName;
  matchups: UserMatchup[];
  currentMatchupIndex: number;
  matchupResults: Record<number, { winner: Team; matchup: UserMatchup }>;
  onMatchupSelect: (matchupId: number) => void;
  gamesCompleted: number;
  totalGames: number;
  onRoundChange: (round: RoundName) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRound,
  matchups,
  currentMatchupIndex,
  matchupResults,
  onMatchupSelect,
  gamesCompleted,
  totalGames,
  onRoundChange,
}) => {
  const currentMatchupRef = useRef<HTMLButtonElement>(null);

  // Filter matchups for current round
  const currentRoundMatchups = matchups.filter(
    (matchup) => matchup.round === currentRound,
  );

  // Get available rounds (rounds that have matchups with teams)
  const availableRounds = Array.from(
    new Set(
      matchups
        .filter((matchup) => matchup.topTeam && matchup.bottomTeam)
        .map((matchup) => matchup.round),
    ),
  );

  // Sort rounds in tournament order
  const roundOrder: RoundName[] = [
    "Round of 64",
    "Round of 32",
    "Sweet 16",
    "Elite 8",
    "Final 4",
    "Championship",
  ];
  availableRounds.sort((a, b) => roundOrder.indexOf(a) - roundOrder.indexOf(b));

  // Scroll to center the current matchup when it changes
  useEffect(() => {
    if (currentMatchupRef.current) {
      currentMatchupRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMatchupIndex]);

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-base-200 shadow-lg">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-base-300 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <select
              className="select select-sm flex-1"
              value={currentRound}
              onChange={(e) => onRoundChange(e.target.value as RoundName)}
            >
              {availableRounds.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
            <div className="text-sm text-base-content/70">
              {gamesCompleted}/{totalGames}
            </div>
          </div>
        </div>

        {/* Matchup List */}
        <div className="flex-1 overflow-y-auto">
          {currentRoundMatchups.map((matchup) => {
            const isCurrentMatchup =
              matchup.id === matchups[currentMatchupIndex]?.id;

            return (
              <button
                key={matchup.id}
                ref={isCurrentMatchup ? currentMatchupRef : null}
                className={`w-full border-b border-gray-200 p-3 text-left transition-all hover:bg-base-300 ${
                  isCurrentMatchup ? "bg-base-200" : ""
                }`}
                onClick={() => onMatchupSelect(matchup.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <TeamRow
                      team={matchup.topTeam}
                      isSelected={matchup.winner === matchup.topTeam?.id}
                    />
                    <div className="mt-2">
                      <TeamRow
                        team={matchup.bottomTeam}
                        isSelected={matchup.winner === matchup.bottomTeam?.id}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
