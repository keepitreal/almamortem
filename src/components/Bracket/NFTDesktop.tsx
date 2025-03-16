import { type FC } from "react";
import { useState } from "react";

import { LoadingOverlay } from "~/components/LoadingOverlay";
import { Overview } from "~/components/Overview";
import { ROUND_NAMES } from "~/constants";
import { useNFTBracket } from "~/context/NFTBracketContext";
import type { Team } from "~/types/bracket";

import { FinalRounds } from "./FinalRounds";
import { RegionalBracket } from "./RegionalBracket";

// Layout Constants
const MATCHUP_WIDTH = 350; // pixels
const COLUMN_GAP = 30; // pixels
const BASE_MATCHUP_GAP = 8; // pixels for vertical spacing
const FINAL_ROUNDS_WIDTH = 1600; // pixels - matches FinalRounds component width
const ROUND_GAPS = {
  "Round of 64": BASE_MATCHUP_GAP,
  "Round of 32": BASE_MATCHUP_GAP * 2.5,
  "Sweet 16": BASE_MATCHUP_GAP * 4,
  "Elite 8": BASE_MATCHUP_GAP * 6,
  "Final 4": BASE_MATCHUP_GAP * 8,
  Championship: BASE_MATCHUP_GAP * 10,
} as const;

const MATCHUP_HEIGHT = {
  "Round of 64": 170,
  "Round of 32": 260,
  "Sweet 16": 300,
  "Elite 8": 360,
  "Final 4": 420,
  Championship: 480,
} as const;

interface NFTDesktopProps {
  tournamentId: string;
}

export const NFTDesktop: FC<NFTDesktopProps> = ({ tournamentId }) => {
  const { userPicks, setWinner, regionPairs, isLoading } = useNFTBracket();
  console.log("NFTDesktop: userPicks", userPicks);
  console.log("NFTDesktop: regionPairs", regionPairs);
  const [isSaving, setIsSaving] = useState(false);

  const handleTeamSelect = (matchupId: number, team: Team) => {
    // No-op in read-only mode
  };

  // Get all Final Four matchups
  const finalFourMatchups = userPicks.filter(
    (matchup) => matchup.round === "Final 4",
  );

  // Find which Final Four matchup corresponds to each side of the bracket
  const leftSideFinalFour = finalFourMatchups.find((matchup) => {
    return matchup.previousMatchupIds.some((prevId) => {
      const prevMatchup = userPicks.find((m) => m.id === prevId);
      return prevMatchup && regionPairs[0].includes(prevMatchup.region);
    });
  });

  const rightSideFinalFour = finalFourMatchups.find((matchup) => {
    return matchup.previousMatchupIds.some((prevId) => {
      const prevMatchup = userPicks.find((m) => m.id === prevId);
      return prevMatchup && regionPairs[1].includes(prevMatchup.region);
    });
  });

  // Get championship matchup
  const championshipMatchup = userPicks.find(
    (matchup) => matchup.round === "Championship",
  );

  // Check if regionPairs are empty
  const hasEmptyRegionPairs = regionPairs[0].length === 0 || regionPairs[1].length === 0;
  if (hasEmptyRegionPairs) {
    console.error("Empty region pairs detected:", regionPairs);
  }

  if (!leftSideFinalFour || !rightSideFinalFour || !championshipMatchup || hasEmptyRegionPairs) {
    return <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-4">Loading bracket data...</h2>
      <p>If this message persists, there might be an issue with the bracket data.</p>
      <p className="mt-4">Debug info:</p>
      <p>User Picks: {userPicks.length}</p>
      <p>Final Four Matchups: {finalFourMatchups.length}</p>
      <p>Region Pairs: {JSON.stringify(regionPairs)}</p>
      <p>Left Side Final Four: {leftSideFinalFour ? "Found" : "Missing"}</p>
      <p>Right Side Final Four: {rightSideFinalFour ? "Found" : "Missing"}</p>
      <p>Championship: {championshipMatchup ? "Found" : "Missing"}</p>
    </div>;
  }

  return (
    <div className="bg-base-200">
      {isLoading && <LoadingOverlay />}
      <div className="bg-base-200 py-24 pl-8 pr-16">
        <div
          className="mx-auto mb-8 rounded-lg px-6"
          style={{
            width: `${FINAL_ROUNDS_WIDTH + MATCHUP_WIDTH * 4 + COLUMN_GAP * 6}px`,
          }}
        >
          <div className="relative flex justify-between">
            {/* Left Side Regions */}
            <div className="flex flex-col gap-48">
              {regionPairs[0].map((region) => (
                <RegionalBracket
                  key={region}
                  region={region}
                  userPicks={userPicks}
                  onTeamSelect={handleTeamSelect}
                  roundGaps={ROUND_GAPS}
                  matchupHeightByRound={MATCHUP_HEIGHT}
                  columnGap={COLUMN_GAP}
                  matchupWidth={MATCHUP_WIDTH}
                  roundNames={ROUND_NAMES.slice(0, 4)}
                />
              ))}
            </div>

            <div className="flex w-[280px] flex-col">
              <div className="absolute left-1/2 z-50 -translate-x-1/2">
                <Overview />
              </div>
            </div>
            {/* Final Rounds */}
            <FinalRounds
              leftFinalFour={leftSideFinalFour}
              rightFinalFour={rightSideFinalFour}
              championship={championshipMatchup}
              onTeamSelect={handleTeamSelect}
            />

            {/* Right Side Regions */}
            <div className="flex flex-col gap-48">
              {regionPairs[1].map((region) => (
                <RegionalBracket
                  key={region}
                  region={region}
                  userPicks={userPicks}
                  onTeamSelect={handleTeamSelect}
                  roundGaps={ROUND_GAPS}
                  matchupHeightByRound={MATCHUP_HEIGHT}
                  columnGap={COLUMN_GAP}
                  matchupWidth={MATCHUP_WIDTH}
                  isRightSide
                  roundNames={ROUND_NAMES.slice(0, 4)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 