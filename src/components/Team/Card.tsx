import Image from "next/image";
import { useState } from "react";

import { CheckmarkCircle } from "~/components/ui/CheckmarkCircle";
import type { Team } from "~/types/bracket";

// Base64 placeholder for team logos
const PLACEHOLDER_LOGO =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNEMUQ1REIiLz48cGF0aCBkPSJNNzUgNTBDNjEuMTkgNTAgNTAgNjEuMTkgNTAgNzVDNTAgODguODEgNjEuMTkgMTAwIDc1IDEwMEM4OC44MSAxMDAgMTAwIDg4LjgxIDEwMCA3NUMxMDAgNjEuMTkgODguODEgNTAgNzUgNTBaTTc1IDkwQzY2Ljc0IDkwIDYwIDgzLjI2IDYwIDc1QzYwIDY2Ljc0IDY2Ljc0IDYwIDc1IDYwQzgzLjI2IDYwIDkwIDY2Ljc0IDkwIDc1QzkwIDgzLjI2IDgzLjI2IDkwIDc1IDkwWiIgZmlsbD0iIzZCNzI4MCIvPjwvc3ZnPg==";

interface TeamCardProps {
  team: Team;
  onSelect: () => void;
  isSelected?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onSelect,
  isSelected = false,
}) => {
  const [imgSrc, setImgSrc] = useState(team.logoUrl);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="card w-[40rem] bg-base-100 shadow-xl">
      <div className="card-body flex min-h-[12rem] flex-col p-6">
        <div className="flex items-center gap-2">
          <figure className="flex-shrink-0">
            <Image
              src={team.logoUrl}
              alt={`${team.name} ${team.mascot} logo`}
              width={56}
              height={56}
              className="rounded-xl"
              unoptimized
            />
          </figure>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="card-title mb-0.5">{team.name}</h2>
              <span className="text-sm text-base-content/40">{team.seed}</span>
            </div>
            <p className="text-sm text-base-content/70">{team.mascot}</p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-base-content/70">Record</div>
            <div className="font-semibold">{team.record}</div>
          </div>
          <div>
            <div className="text-xs text-base-content/70">PPG</div>
            <div className="font-semibold">{team.ppg}</div>
          </div>
          <div>
            <div className="text-xs text-base-content/70">Opp PPG</div>
            <div className="font-semibold">{team.oppg}</div>
          </div>
        </div>
      </div>

      <button
        className={`btn h-12 w-full rounded-t-none border-x-0 border-b-0 border-t border-base-300 ${
          isSelected
            ? "!hover:bg-base-200 !bg-base-100"
            : "!hover:bg-base-200 !bg-base-100"
        }`}
        onClick={onSelect}
      >
        <div className="flex w-full justify-end">
          <CheckmarkCircle
            className={`h-6 w-6 ${
              isSelected ? "text-green-600" : "text-base-content/30"
            }`}
          />
        </div>
      </button>
    </div>
  );
};
