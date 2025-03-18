import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { APP_NAME } from "~/constants";
import { useOwnedBracketIds } from "~/hooks/useOwnedBracketIds";

const MyBrackets: NextPage = () => {
  const { ownedTokenIds, isLoading, error } = useOwnedBracketIds();
  const tournamentId = 0; // Hardcoded tournament ID as requested

  return (
    <>
      <Head>
        <title>My Brackets | {APP_NAME}</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">My Brackets</h1>

        {isLoading && (
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-error/10 p-4 text-error">
            <p>Error loading your brackets: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && ownedTokenIds.length === 0 && (
          <div className="rounded-md bg-warning/10 p-4 text-warning">
            <p>You don&apos;t have any brackets yet.</p>
          </div>
        )}

        {!isLoading && !error && ownedTokenIds.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ownedTokenIds.map((tokenId) => (
              <div
                key={tokenId}
                className="card overflow-hidden border shadow-md"
              >
                <div className="p-4">
                  <h2 className="mb-2 text-xl font-semibold">
                    Bracket #{tokenId}
                  </h2>
                  <Link
                    href={`/bracket/${tournamentId}/view/${tokenId}?readOnly=true`}
                    className="btn btn-primary mt-2"
                  >
                    View Bracket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyBrackets;
