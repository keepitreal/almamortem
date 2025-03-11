import Image from "next/image";
import { type FC } from "react";

import type { Team, UserMatchup } from "~/types/bracket";

interface TraditionalBracketProps {
  userPicks: UserMatchup[];
  onMatchupClick: (matchupId: number) => void;
  currentMatchupId: number;
  onTeamSelect: (matchupId: number, team: Team) => void;
}

const ROUNDS = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final 4",
  "Championship",
] as const;

const TraditionalBracket: FC<TraditionalBracketProps> = ({
  userPicks,
  onMatchupClick,
  currentMatchupId,
  onTeamSelect,
}) => {
  // Group matchups by round and region
  const leftSideMatchups = userPicks.filter(
    (m) => m.region === "East" || m.region === "West",
  );
  const rightSideMatchups = userPicks.filter(
    (m) => m.region === "South" || m.region === "Midwest",
  );
  const finalFourMatchups = userPicks.filter(
    (m) => m.round === "Final 4" || m.round === "Championship",
  );

  const renderRound = (
    round: (typeof ROUNDS)[number],
    matchups: UserMatchup[],
    roundIndex: number,
    isLastRound: boolean,
    isRightSide = false,
  ) => {
    const roundMatchups = matchups.filter((m) => m.round === round);

    // For first round, sort by ID
    if (roundIndex === 0) {
      const sortedMatchups = [...roundMatchups].sort((a, b) => a.id - b.id);
      console.log(
        "First Round Matchups:",
        sortedMatchups.map((m) => ({
          id: m.id,
          nextId: m.nextMatchupId,
          position: m.position,
        })),
      );
      return renderRoundContent(
        round,
        sortedMatchups,
        roundIndex,
        isLastRound,
        isRightSide,
      );
    }

    // For subsequent rounds, find the previous round's matchups
    const prevRound = ROUNDS[roundIndex - 1];
    const prevRoundMatchups = matchups.filter((m) => m.round === prevRound);

    console.log(
      "Previous Round Matchups:",
      prevRoundMatchups.map((m) => ({
        id: m.id,
        nextId: m.nextMatchupId,
        position: m.position,
      })),
    );

    // Group previous round matchups by their nextMatchupId
    const prevRoundGroups = prevRoundMatchups.reduce(
      (groups, matchup) => {
        const nextId = matchup.nextMatchupId?.toString() ?? "final";
        if (!groups[nextId]) {
          groups[nextId] = [];
        }
        groups[nextId].push(matchup);
        return groups;
      },
      {} as Record<string, UserMatchup[]>,
    );

    // Sort each group internally by position (top first)
    Object.values(prevRoundGroups).forEach((group) => {
      group.sort((a, b) => (a.position === "top" ? -1 : 1));
    });

    // Get ordered list of nextMatchupIds
    const nextMatchupOrder = Object.entries(prevRoundGroups)
      .sort(([aNextId], [bNextId]) => {
        const aFirstMatchup = prevRoundGroups[aNextId]?.[0];
        const bFirstMatchup = prevRoundGroups[bNextId]?.[0];
        return (aFirstMatchup?.id ?? 0) - (bFirstMatchup?.id ?? 0);
      })
      .map(([nextId]) => parseInt(nextId));

    console.log("Next Matchup Order:", nextMatchupOrder);

    // Sort current round matchups based on the order they appear in nextMatchupIds
    const sortedMatchups = [...roundMatchups].sort((a, b) => {
      const aIndex = nextMatchupOrder.indexOf(a.id);
      const bIndex = nextMatchupOrder.indexOf(b.id);
      return aIndex - bIndex;
    });

    console.log(
      "Sorted Current Round Matchups:",
      sortedMatchups.map((m) => ({
        id: m.id,
        nextId: m.nextMatchupId,
        position: m.position,
      })),
    );

    return renderRoundContent(
      round,
      sortedMatchups,
      roundIndex,
      isLastRound,
      isRightSide,
    );
  };

  const renderRoundContent = (
    round: (typeof ROUNDS)[number],
    sortedMatchups: UserMatchup[],
    roundIndex: number,
    isLastRound: boolean,
    isRightSide: boolean,
  ) => {
    const totalRows = Math.pow(2, 5);

    return (
      <div key={round} className="flex min-w-[250px] flex-col">
        <div className="mb-4 text-center font-semibold">{round}</div>
        <div
          className="grid"
          style={{
            gridTemplateRows: `repeat(${totalRows}, minmax(2rem, 1fr))`,
            gap: "0.5rem",
          }}
        >
          {sortedMatchups.map((matchup, index) => {
            // Calculate the center position for this matchup
            const matchupsInRound = sortedMatchups.length;
            const totalSpacing = totalRows / matchupsInRound;
            const centerRow = Math.floor(
              index * totalSpacing + totalSpacing / 2,
            );

            return (
              <div
                key={matchup.id}
                className="relative"
                style={{
                  gridRow: `${centerRow + 1} / span 1`,
                }}
              >
                {/* Connector Lines */}
                {!isLastRound && (
                  <>
                    {/* Horizontal line */}
                    <div
                      className={`absolute top-1/2 h-px w-4 bg-base-content/20 ${isRightSide ? "left-0" : "right-0"}`}
                    />
                    {/* Vertical line */}
                    {matchup.position === "top" && (
                      <div
                        className={`absolute ${isRightSide ? "left-0" : "right-0"} top-1/2 h-[${totalSpacing}rem] w-px bg-base-content/20`}
                      />
                    )}
                  </>
                )}

                {/* Matchup Card */}
                <div
                  className={`relative flex w-[230px] flex-col gap-2 rounded-lg border p-3 transition-all ${currentMatchupId === matchup.id ? "border-primary bg-base-200" : "border-base-content/10 hover:border-base-content/20"} `}
                  onClick={() => onMatchupClick(matchup.id)}
                >
                  {/* Team 1 */}
                  {matchup.topTeam && (
                    <button
                      className={`flex w-full items-center justify-between gap-2 rounded p-2 transition-colors ${matchup.winner === matchup.topTeam.id ? "bg-success/10" : "hover:bg-base-content/5"} `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamSelect(matchup.id, matchup.topTeam!);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {matchup.topTeam.logoUrl && (
                          <Image
                            src={matchup.topTeam.logoUrl}
                            alt={matchup.topTeam.name}
                            className="h-6 w-6 object-contain"
                            width={24}
                            height={24}
                          />
                        )}
                        <span>{matchup.topTeam.name}</span>
                      </div>
                      <span className="text-sm opacity-50">
                        {matchup.topTeam.seed}
                      </span>
                    </button>
                  )}

                  {/* Team 2 */}
                  {matchup.bottomTeam && (
                    <button
                      className={`flex w-full items-center justify-between gap-2 rounded p-2 transition-colors ${matchup.winner === matchup.bottomTeam.id ? "bg-success/10" : "hover:bg-base-content/5"} `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeamSelect(matchup.id, matchup.bottomTeam!);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {matchup.bottomTeam.logoUrl && (
                          <Image
                            src={matchup.bottomTeam.logoUrl}
                            alt={matchup.bottomTeam.name}
                            className="h-6 w-6 object-contain"
                            width={24}
                            height={24}
                          />
                        )}
                        <span>{matchup.bottomTeam.name}</span>
                      </div>
                      <span className="text-sm opacity-50">
                        {matchup.bottomTeam.seed}
                      </span>
                    </button>
                  )}

                  {/* Placeholder slots for empty teams */}
                  {!matchup.topTeam && (
                    <div className="flex h-10 items-center justify-between rounded bg-base-content/5 p-2">
                      <span className="opacity-50">Waiting for winner...</span>
                    </div>
                  )}
                  {!matchup.bottomTeam && (
                    <div className="flex h-10 items-center justify-between rounded bg-base-content/5 p-2">
                      <span className="opacity-50">Waiting for winner...</span>
                    </div>
                  )}

                  {/* Game Info */}
                  <div className="absolute -bottom-6 left-0 text-xs opacity-50">
                    Game {matchup.id}{" "}
                    {matchup.nextMatchupId && `→ ${matchup.nextMatchupId}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const leftSideRounds = ROUNDS.slice(0, 4); // Round of 64 to Elite 8
  const rightSideRounds = ROUNDS.slice(0, 4); // Round of 64 to Elite 8, reversed
  const finalRounds = ROUNDS.slice(4); // Final 4 and Championship

  return (
    <div className="flex min-h-screen w-full flex-col overflow-auto p-8">
      <div className="grid min-w-max grid-cols-[1fr_auto_1fr] gap-8">
        {/* Left Side */}
        <div className="flex gap-4">
          {leftSideRounds.map((round, index) =>
            renderRound(
              round,
              leftSideMatchups,
              index,
              index === leftSideRounds.length - 1,
            ),
          )}
        </div>

        {/* Center (Final Four & Championship) */}
        <div className="flex gap-4">
          {finalRounds.map((round, index) =>
            renderRound(
              round,
              finalFourMatchups,
              index + 4,
              index === finalRounds.length - 1,
            ),
          )}
        </div>

        {/* Right Side */}
        <div className="flex flex-row-reverse gap-4">
          {rightSideRounds.map((round, index) =>
            renderRound(
              round,
              rightSideMatchups,
              rightSideRounds.length - index - 1,
              index === 0,
              true,
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default TraditionalBracket;
