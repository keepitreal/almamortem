import { TOP_TEAM_BY_SEED_AND_ROUND } from "~/constants";
import type { Matchup, RoundName } from "~/types/bracket";

// Type predicate to check if a round has seed rules
function hasRoundSeedRules(
  round: RoundName,
): round is "Round of 32" | "Sweet 16" | "Elite 8" {
  return round === "Round of 32" || round === "Sweet 16" || round === "Elite 8";
}

export const Connector = ({
  toMatchup,
  fromMatchup,
  isRightSide,
}: {
  toMatchup: Matchup;
  fromMatchup?: Matchup;
  isRightSide: boolean;
}) => {
  if (!fromMatchup || !toMatchup) {
    return null;
  }

  // Determine if fromMatchup should be on top based on potential seeds
  let shouldFromMatchupBeOnTop = false;

  // Check which type of round we're dealing with and apply the appropriate logic
  if (hasRoundSeedRules(toMatchup.round)) {
    // Get the top seeds for this round from the constants
    const topSeedsForRound = TOP_TEAM_BY_SEED_AND_ROUND[toMatchup.round]?.TOP;

    if (topSeedsForRound && fromMatchup.potentialSeeds) {
      // Check if any of the from matchup's potential seeds are in the top seeds for this round
      shouldFromMatchupBeOnTop = fromMatchup.potentialSeeds.some((seed) =>
        topSeedsForRound.includes(seed),
      );
    }
  } else if (
    toMatchup.round === "Final 4" ||
    toMatchup.round === "Championship"
  ) {
    // For Final Four and Championship, use position
    shouldFromMatchupBeOnTop = fromMatchup.position === "top";
  }

  // Set the top and bottom anchor IDs based on the seed rules
  const topAnchorID = shouldFromMatchupBeOnTop ? fromMatchup.id : toMatchup.id;
  const bottomAnchorID = shouldFromMatchupBeOnTop
    ? toMatchup.id
    : fromMatchup.id;

  // Keep existing left/right anchor ID logic
  const leftAnchorID = isRightSide ? toMatchup.id : fromMatchup.id;
  const rightAnchorID = isRightSide ? fromMatchup.id : toMatchup.id;
  const leftConnectorClassname = !shouldFromMatchupBeOnTop
    ? "matchup-connector-left matchup-connector-left-bottom"
    : "matchup-connector-left";

  const rightConnector = !shouldFromMatchupBeOnTop ? null : (
    <div
      className={`matchup-connector-right ${
        isRightSide ? "matchup-connector-right-rightside" : ""
      }`}
    ></div>
  );

  return (
    <div
      className="matchup-connector"
      style={{
        top: `anchor(--matchup-${topAnchorID} center)`,
        left: `anchor(--matchup-${leftAnchorID} center)`,
        bottom: `anchor(--matchup-${bottomAnchorID} center)`,
        right: `anchor(--matchup-${rightAnchorID} center)`,
        position: "absolute",
        zIndex: 1,
      }}
    >
      <div
        className={`${leftConnectorClassname} ${isRightSide ? "matchup-connector-left-rightside" : ""}`}
      ></div>
      {rightConnector}
    </div>
  );
};
