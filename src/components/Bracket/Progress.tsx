import type { RoundName } from "~/utils/bracketUtils";

interface BracketProgressProps {
  currentRound: RoundName;
  topTeamName: string;
  bottomTeamName: string;
  gamesCompleted: number;
  totalGames: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const BracketProgress: React.FC<BracketProgressProps> = ({
  currentRound,
  topTeamName,
  bottomTeamName,
  gamesCompleted,
  totalGames,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}) => {
  return (
    <div className="btm-nav btm-nav-lg border-t border-base-300 bg-base-200">
      <div className="flex h-full w-full items-center px-8">
        <div className="flex w-full items-center justify-between gap-8">
          <div className="flex flex-col">
            <div className="text-xl font-semibold">{currentRound}</div>
            <div className="text-sm text-base-content/70">
              {gamesCompleted}/{totalGames} Games
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-4">
            <button
              className="btn btn-circle btn-ghost"
              onClick={onPrevious}
              disabled={!hasPrevious}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-xl font-medium text-primary">
              {topTeamName}{" "}
              <span className="text-base-content opacity-50">vs</span>{" "}
              {bottomTeamName}
            </div>

            <button
              className="btn btn-circle btn-ghost"
              onClick={onNext}
              disabled={!hasNext}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <button className="btn btn-disabled btn-primary whitespace-nowrap">
            Review and Submit
          </button>
        </div>

        <progress
          className="progress progress-primary absolute bottom-2 left-0 w-full"
          value={gamesCompleted}
          max={totalGames}
        />
      </div>
    </div>
  );
};
