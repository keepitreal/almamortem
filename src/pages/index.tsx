import Head from "next/head";
import { useAccount } from "wagmi";

import { TournamentPreview } from "~/components/TournamentPreview";
import { Wallet } from "~/components/Wallet";
import { APP_DESCRIPTION, APP_NAME } from "~/constants";
import { useNFTCount } from "~/hooks/useNFTCount";

export default function Home() {
  const { address } = useAccount();
  const { data: entryCount = 0, isLoading } = useNFTCount();

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
      </Head>
      <main className="flex flex-col items-center justify-center bg-base-200">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-24">
          {!address && <Wallet btnLabel="Connect Wallet To Play" />}
          {address && (
            <TournamentPreview
              name="Big Base Bracket Brawl"
              entryCount={entryCount}
              imageUrl="/images/stories/3172025/3.png"
            />
          )}
        </div>
      </main>
    </>
  );
}
