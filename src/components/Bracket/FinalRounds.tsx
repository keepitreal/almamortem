import { type FC } from "react";

import type { Team, UserMatchup } from "~/types/bracket";
import { regionToUniversityNamesDemo } from "~/types/bracket";

type MainRegion = "west" | "east" | "south" | "midwest";

interface FinalFourTeamProps {
  team: Team | null;
  isSelected: boolean;
  onSelect: () => void;
  isTopTeam?: boolean;
  matchup: UserMatchup;
}

const FINAL_ROUNDS_WIDTH = 1550;
const CHAMPIONSHIP_HEIGHT = 750;
const FINAL_FOUR_HEIGHT = 690;

const FinalFourTeam: FC<FinalFourTeamProps> = ({
  team,
  isSelected,
  onSelect,
  isTopTeam = false,
  matchup,
}) => {
  const imagePath = team?.isFirstFour
    ? `/images/teams/f4/ff.png`
    : `/images/teams/f4/${team?.espnId}.png`;
  return (
    <button
      className={`relative flex h-[50%] w-full items-center justify-between transition-all ${
        team ? "hover:bg-base-200" : ""
      } ${isTopTeam ? "border-b-2 border-black" : ""}`}
      onClick={onSelect}
      disabled={!team}
      style={
        team
          ? {
              backgroundImage: `url(${imagePath})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {team && !isSelected && matchup?.winner && (
        <div className="absolute inset-0 z-10 bg-black opacity-60" />
      )}
      <div
        className={`final-four-team-namecard relative z-20 flex w-full flex-col justify-between p-2 ${
          isTopTeam
            ? "final-four-team-namecard-top"
            : "final-four-team-namecard-bottom"
        }`}
      >
        {team ? (
          <div className="flex">
            <div className="flex flex-col">
              <span className="text-sm font-bold">{`${team.location}${team.isFirstFour ? " /" : ""}`}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{team.mascot}</span>
                <span className="text-xs text-base-content/70">
                  {team.seed}
                </span>
              </div>
            </div>
            {isSelected && (
              <div className="self-end">
                <span className="text-md text-red-500">✔</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-8 w-full bg-base-300/50" />
        )}
      </div>
    </button>
  );
};

interface FinalFourMatchupProps {
  matchup: UserMatchup;
  onTeamSelect: (team: Team) => void;
  isLeft?: boolean;
}

const FinalFourMatchup: FC<FinalFourMatchupProps> = ({
  matchup,
  onTeamSelect,
  isLeft = false,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        height: `${FINAL_FOUR_HEIGHT}px`,
      }}
    >
      <div
        className="final-four-heading text-md w-[100%] bg-black text-center font-bold text-white"
        style={{
          borderTopRightRadius: isLeft ? "0" : "10px",
          borderTopLeftRadius: isLeft ? "10px" : "0",
        }}
      >
        Final Four
      </div>
      <div
        className="card flex w-1/5 w-[340px] flex-col overflow-hidden border-2 border-black"
        style={{
          height: "100%",
          borderRight: isLeft ? "none" : "2px solid black",
          borderLeft: isLeft ? "2px solid black" : "none",
          borderTop: "none",
          borderBottomRightRadius: isLeft ? "0" : "10px",
          borderBottomLeftRadius: isLeft ? "10px" : "0",
          borderTopRightRadius: "none",
          borderTopLeftRadius: "none",
        }}
      >
        <FinalFourTeam
          team={matchup.topTeam}
          isSelected={matchup.winner === matchup.topTeam?.id}
          onSelect={() => matchup.topTeam && onTeamSelect(matchup.topTeam)}
          isTopTeam
          matchup={matchup}
        />
        <FinalFourTeam
          team={matchup.bottomTeam}
          isSelected={matchup.winner === matchup.bottomTeam?.id}
          onSelect={() =>
            matchup.bottomTeam && onTeamSelect(matchup.bottomTeam)
          }
          matchup={matchup}
        />
      </div>
    </div>
  );
};

interface ChampionshipTeamProps {
  team: Team | null;
  isSelected: boolean;
  onSelect: () => void;
  isLeft?: boolean;
  matchup: UserMatchup;
}

const ChampionshipTeam: FC<ChampionshipTeamProps> = ({
  team,
  isSelected,
  onSelect,
  isLeft = false,
  matchup,
}) => (
  <button
    className={`relative flex h-[100%] w-1/2 items-center justify-between transition-all ${
      team ? "hover:bg-base-200" : ""
    } ${isLeft ? "rounded-l-lg" : "rounded-r-lg"}`}
    onClick={onSelect}
    disabled={!team}
    style={
      team
        ? {
            backgroundImage: `url('/images/teams/champ/${team.isFirstFour ? "ff" : team.espnId}.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderLeft: isLeft ? "none" : "2px solid black",
          }
        : {}
    }
  >
    {team && !isSelected && matchup?.winner && (
      <div className="absolute inset-0 z-10 bg-black opacity-60" />
    )}
    <div className="championship-team-namecard relative z-20 flex w-full justify-between p-4">
      {team ? (
        <div className="flex h-full w-full justify-between bg-primary-content">
          <div className="flex flex-col items-start bg-primary-content">
            <span className="text-sm font-bold">{`${team.location}${team.isFirstFour ? " /" : ""}`}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{team.mascot}</span>
              <span className="text-sm text-base-content/70">{team.seed}</span>
            </div>
          </div>
          {isSelected && (
            <div className="self-end">
              <span className="text-xl text-red-500">✔</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-10 w-full bg-base-300/50" />
      )}
    </div>
  </button>
);

interface ChampionshipMatchupProps {
  matchup: UserMatchup;
  onTeamSelect: (team: Team) => void;
}

const ChampionshipMatchup: FC<ChampionshipMatchupProps> = ({
  matchup,
  onTeamSelect,
}) => (
  <div
    className="card flex h-[100%] w-[100%] flex-col overflow-hidden overflow-visible rounded-lg border-2 border-black"
    style={{
      height: `${CHAMPIONSHIP_HEIGHT}px`,
    }}
  >
    <div className="championship-heading text-md w-[100%] bg-black text-center font-bold text-white">
      Championship
    </div>
    <div className="flex h-full w-full">
      <ChampionshipTeam
        team={matchup.topTeam}
        isSelected={matchup.winner === matchup.topTeam?.id}
        onSelect={() => matchup.topTeam && onTeamSelect(matchup.topTeam)}
        isLeft
        matchup={matchup}
      />
      <ChampionshipTeam
        team={matchup.bottomTeam}
        isSelected={matchup.winner === matchup.bottomTeam?.id}
        onSelect={() => matchup.bottomTeam && onTeamSelect(matchup.bottomTeam)}
        matchup={matchup}
      />
    </div>
  </div>
);

interface FinalRoundsProps {
  leftFinalFour: UserMatchup;
  rightFinalFour: UserMatchup;
  championship: UserMatchup;
  onTeamSelect: (matchupId: number, team: Team) => void;
}

export const FinalRounds: FC<FinalRoundsProps> = ({
  leftFinalFour,
  rightFinalFour,
  championship,
  onTeamSelect,
}) => {
  return (
    <div
      className="absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4 rounded-lg"
      style={{ width: `${FINAL_ROUNDS_WIDTH}px` }}
    >
      {/* Final Rounds Header */}
      <div className="mb-4 flex h-14 items-center justify-center">
        <div className="text-md rounded-md border-[3px] border-amber-200 bg-amber-50 px-4 py-1 text-center font-black uppercase tracking-wider text-stone-800 shadow-md">
          Final Rounds
        </div>
      </div>

      <div className="flex w-full items-center justify-between">
        {/* Left Final Four */}
        <FinalFourMatchup
          matchup={leftFinalFour}
          onTeamSelect={(team) => onTeamSelect(leftFinalFour.id, team)}
          isLeft
        />

        {/* Championship - Absolutely positioned in center */}
        <div
          className="flex w-[60%] flex-col items-center"
          style={{ height: `${CHAMPIONSHIP_HEIGHT}px` }}
        >
          <ChampionshipMatchup
            matchup={championship}
            onTeamSelect={(team) => onTeamSelect(championship.id, team)}
          />
        </div>

        {/* Right Final Four */}
        <FinalFourMatchup
          matchup={rightFinalFour}
          onTeamSelect={(team) => onTeamSelect(rightFinalFour.id, team)}
        />
      </div>
    </div>
  );
};
