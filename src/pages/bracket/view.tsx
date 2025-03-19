import { type NextPage } from "next";
import Head from "next/head";

import TraditionalBracket from "~/components/Bracket/TraditionalBracket";
import { APP_NAME } from "~/constants";
import { useBracket } from "~/context/BracketContext";
import type { Team } from "~/types/bracket";

const ViewBracket: NextPage = () => {
  const { userPicks, currentMatchupId, setCurrentMatchupId, setWinner } =
    useBracket();

  const handleMatchupClick = (matchupId: number) => {
    setCurrentMatchupId(matchupId);
  };

  const handleTeamSelect = (matchupId: number, team: Team) => {
    setWinner(matchupId, team.id);
  };

  return (
    <>
      <Head>
        <title>View Bracket | {APP_NAME}</title>
      </Head>

      <TraditionalBracket
        userPicks={userPicks}
        currentMatchupId={currentMatchupId}
        onMatchupClick={handleMatchupClick}
        onTeamSelect={handleTeamSelect}
      />
    </>
  );
};

export default ViewBracket;
