import { CheckmarkCircle } from "~/components/icons/CheckmarkCircle";
import type { RoundName, Team, UserMatchup } from "~/types/bracket";
import { ROUND_TO_ROUND_ABBREVIATION } from "~/types/bracket";

interface TeamRowProps {
  team: Team | null;
  isSelected: boolean;
  onSelect: () => void;
  isTopTeam?: boolean;
  height?: number;
  round: RoundName;
  hasWinner: boolean;
}

const MATCHUP_HEIGHT = 170;

const TeamColumn: React.FC<TeamRowProps> = ({
  team,
  isSelected,
  onSelect,
  isTopTeam = false,
  height,
  round,
  hasWinner,
}) => {
  const roundAbbreviation = ROUND_TO_ROUND_ABBREVIATION[round].toLowerCase();
  const id = team?.isFirstFour ? "ff" : team?.espnId;
  const teamImage = team
    ? `url(/images/teams/${roundAbbreviation}/${id}.png)`
    : "";

  return (
    <button
      className={`relative flex w-1/2 items-center justify-between px-4 py-3 transition-all ${
        team ? "hover:bg-base-200" : ""
      } ${isTopTeam ? "rounded-t-md" : "border-l-2"} border-primary`}
      onClick={onSelect}
      disabled={!team}
      style={
        team
          ? {
              height: height + "px",
              backgroundImage: teamImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              height: height + "px",
            }
      }
    >
      {team && !isSelected && hasWinner && (
        <div className="absolute inset-0 bg-primary opacity-60" />
      )}
      {team && isSelected && (
        <div className="absolute right-2 top-2">
          <CheckmarkCircle />
        </div>
      )}
      <div
        className="matchup-team-bg flex w-full justify-between px-2 py-1"
        style={{
          borderBottomLeftRadius: isTopTeam ? "4px" : "0px",
          borderBottomRightRadius: isTopTeam ? "0px" : "4px",
        }}
      >
        {team ? (
          <div className="flex w-full justify-between">
            <div className="flex flex-col items-start bg-primary-content">
              <span className="text-xs font-bold">{`${team.location}${team.isFirstFour ? " /" : ""}`}</span>
              <div className="flex flex-row gap-1">
                <span className="text-xs">{team.mascot}</span>
                <span className="text-xs text-base-content/60">
                  {team.seed}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-5 w-full bg-base-300/50" />
        )}
      </div>
    </button>
  );
};

interface MatchupProps {
  matchup: UserMatchup;
  onTeamSelect: (team: Team) => void;
  width?: number;
  height?: number;
}

export const Matchup: React.FC<MatchupProps> = ({
  matchup,
  onTeamSelect,
  width = 220,
  height = MATCHUP_HEIGHT,
}) => {
  return (
    <div
      className="group card relative box-content flex flex-row overflow-hidden overflow-visible rounded-md border border-2 border-secondary bg-primary-content transition-all"
      style={{
        width: `${width}px`,
        zIndex: 2,
        // @ts-expect-error-line
        anchorName: `--matchup-${matchup.id}`,
        height: `${height}px`,
      }}
    >
      <TeamColumn
        team={matchup.topTeam}
        isSelected={matchup.winner === matchup.topTeam?.id}
        onSelect={() => matchup.topTeam && onTeamSelect(matchup.topTeam)}
        height={height}
        isTopTeam
        round={matchup.round}
        hasWinner={!!matchup.winner}
      />
      <TeamColumn
        team={matchup.bottomTeam}
        isSelected={matchup.winner === matchup.bottomTeam?.id}
        onSelect={() => matchup.bottomTeam && onTeamSelect(matchup.bottomTeam)}
        height={height}
        round={matchup.round}
        hasWinner={!!matchup.winner}
      />
    </div>
  );
};
