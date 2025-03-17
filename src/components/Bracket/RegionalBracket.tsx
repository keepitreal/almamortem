import { Connector } from "~/components/Bracket/Connector";
import { Matchup as MatchupComponent } from "~/components/Bracket/Matchup";
import type {
  RoundName,
  Team,
  UserMatchup,
  Matchup,
  Region,
} from "~/types/bracket";
import { INITIAL_SEED_PAIRS } from "~/constants";

interface RegionalBracketProps {
  region: string;
  userPicks: UserMatchup[];
  onTeamSelect: (matchupId: number, team: Team) => void;
  roundGaps: Record<RoundName, number>;
  matchupHeightByRound: Record<RoundName, number>;
  columnGap: number;
  matchupWidth: number;
  isRightSide?: boolean;
  roundNames: RoundName[];
}

// Helper function to find matchup by ID
const findMatchupById = (
  matchupId: number | undefined,
  userPicks: UserMatchup[],
) => {
  if (!matchupId) return undefined;
  return userPicks.find((m) => m.id === matchupId);
};

export const RegionalBracket: React.FC<RegionalBracketProps> = ({
  region,
  userPicks,
  onTeamSelect,
  roundGaps,
  matchupHeightByRound,
  columnGap,
  matchupWidth,
  isRightSide = false,
  roundNames,
}) => {
  // Ensure we have all round names before rendering
  if (roundNames.length < 4) {
    console.error("Not enough round names provided");
    return null;
  }

  // Since we've checked length, we can safely assert these indices exist
  const [round64, round32, sweet16, elite8] = roundNames as [
    RoundName,
    RoundName,
    RoundName,
    RoundName,
  ];

  return (
    <div>
      <div
        className="relative flex items-center"
        style={{ gap: `${columnGap}px` }}
      >
        {/* Region Label */}
        <div
          className={`absolute top-1/2 ${
            isRightSide
              ? "right-0 translate-x-[calc(100%+1rem)]"
              : "left-0 -translate-x-[calc(100%+1rem)]"
          } text-md -translate-y-1/2 font-bold uppercase tracking-widest`}
          style={{
            writingMode: isRightSide ? "vertical-lr" : "sideways-lr",
          }}
        >
          {region}
        </div>

        <div
          className={`flex ${isRightSide ? "flex-row-reverse" : ""}`}
          style={{ gap: `${columnGap}px` }}
        >
          {/* Round of 64 */}
          <div
            className="flex flex-col justify-around"
            style={{ gap: `${roundGaps["Round of 64"]}px` }}
          >
            <RenderRound
              round="Round of 64"
              region={region}
              userPicks={userPicks}
              onTeamSelect={onTeamSelect}
              roundGaps={roundGaps}
              isRightSide={isRightSide}
              matchupWidth={matchupWidth}
              matchupHeightByRound={matchupHeightByRound}
              roundName={round64}
            />
          </div>

          {/* Round of 32 */}
          <div
            className="flex flex-col justify-around"
            style={{ gap: `${roundGaps["Round of 32"]}px` }}
          >
            <RenderRound
              round="Round of 32"
              region={region}
              userPicks={userPicks}
              onTeamSelect={onTeamSelect}
              roundGaps={roundGaps}
              isRightSide={isRightSide}
              matchupWidth={matchupWidth}
              matchupHeightByRound={matchupHeightByRound}
              roundName={round32}
            />
          </div>

          {/* Sweet 16 */}
          <div
            className="flex flex-col justify-around"
            style={{ gap: `${roundGaps["Sweet 16"]}px` }}
          >
            <RenderRound
              round="Sweet 16"
              region={region}
              userPicks={userPicks}
              onTeamSelect={onTeamSelect}
              roundGaps={roundGaps}
              matchupWidth={matchupWidth}
              matchupHeightByRound={matchupHeightByRound}
              isRightSide={isRightSide}
              roundName={sweet16}
            />
          </div>

          {/* Elite 8 */}
          <div
            className="flex flex-col justify-around"
            style={{ gap: `${roundGaps["Elite 8"]}px` }}
          >
            <RenderRound
              round="Elite 8"
              region={region}
              userPicks={userPicks}
              onTeamSelect={onTeamSelect}
              roundGaps={roundGaps}
              matchupWidth={matchupWidth}
              matchupHeightByRound={matchupHeightByRound}
              isRightSide={isRightSide}
              roundName={elite8}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface RoundProps {
  round: RoundName;
  region: string;
  userPicks: UserMatchup[];
  onTeamSelect: (matchupId: number, team: Team) => void;
  roundGaps: Record<RoundName, number>;
  matchupWidth: number;
  isRightSide: boolean;
  matchupHeightByRound: Record<RoundName, number>;
  roundName: RoundName;
}

const RenderRound: React.FC<RoundProps> = ({
  round,
  region,
  userPicks,
  onTeamSelect,
  roundGaps,
  matchupWidth,
  isRightSide,
  matchupHeightByRound,
  roundName,
}) => {
  const shouldRenderConnector = ["Round of 32", "Sweet 16", "Elite 8"].includes(
    round,
  );

  const matchupHeight = matchupHeightByRound[round];

  const sortedMatchups = filterAndSortMatchups(userPicks, round, region);

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="mb-4 flex h-14 items-center justify-center">
        <div className="text-md rounded-md border-[3px] border-amber-200 bg-amber-50 px-4 py-1 text-center font-black uppercase tracking-wider text-stone-800 shadow-md">
          {roundName}
        </div>
      </div>

      {/* Matchups */}
      <div className="flex flex-col" style={{ gap: `${roundGaps[round]}px` }}>
        {sortedMatchups.map((matchup) => (
          <div key={matchup.id}>
            {shouldRenderConnector && (
              <Connector
                toMatchup={matchup}
                fromMatchup={findMatchupById(
                  matchup.previousMatchupIds?.[0],
                  userPicks,
                )}
                isRightSide={isRightSide}
              />
            )}
            <MatchupComponent
              matchup={matchup}
              onTeamSelect={(team) => onTeamSelect(matchup.id, team)}
              width={matchupWidth}
              height={matchupHeight}
            />
            {shouldRenderConnector && (
              <Connector
                toMatchup={matchup}
                fromMatchup={findMatchupById(
                  matchup.previousMatchupIds?.[1],
                  userPicks,
                )}
                isRightSide={isRightSide}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function filterAndSortMatchups(
  matchups: Matchup[],
  round: RoundName,
  region: string,
) {
  const filteredMatchups = matchups.filter(
    (matchup) => matchup.round === round && matchup.region === region,
  );

  if (round === "Round of 64") {
    // Create a map of seed pair index for sorting
    const seedPairIndexMap = new Map(
      INITIAL_SEED_PAIRS.map((pair, index) => [
        JSON.stringify(pair.sort()),
        index,
      ]),
    );

    return filteredMatchups.sort((a, b) => {
      const aPair = [a.topTeamSeed, a.bottomTeamSeed].sort();
      const bPair = [b.topTeamSeed, b.bottomTeamSeed].sort();

      const aIndex = seedPairIndexMap.get(JSON.stringify(aPair)) ?? 0;
      const bIndex = seedPairIndexMap.get(JSON.stringify(bPair)) ?? 0;

      return aIndex - bIndex;
    });
  }

  return filteredMatchups;
}
