import Head from "next/head";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";

import { Wallet } from "~/components/Wallet";
import { APP_DESCRIPTION, APP_NAME } from "~/constants";

export default function Home() {
  const { address } = useAccount();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{APP_NAME}</title>
        <meta name="description" content={APP_DESCRIPTION} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col justify-center bg-base-200">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-center text-5xl font-extrabold tracking-tight">
            {APP_NAME}
          </h1>
          {!address && <Wallet btnLabel="Connect Wallet To Play" />}
          {address && (
            <div>
              <button
                className="btn btn-primary"
                onClick={() => void router.push("/bracket/0/build")}
              >
                Build Your Bracket
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
