import { type AppType } from "next/app";
import dynamic from "next/dynamic";
import Head from "next/head";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

import { StoryModal } from "~/components/StoryModal";
import Layout from "~/components/utils/Layout";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "~/constants";
import { BracketProvider } from "~/context/BracketContext";
import { api } from "~/utils/api";

import "react-toastify/dist/ReactToastify.css";
import "@coinbase/onchainkit/styles.css";
import "~/styles/globals.css";

const OnchainProviders = dynamic(() => import("~/providers/OnchainProviders"), {
  ssr: false,
});

const pageTitle = `${APP_NAME} on Base`;
const pageDescription = APP_DESCRIPTION;
const pageUrl = APP_URL;
const imageUrl = `${APP_URL}/images/preview.png`;

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  // Set retro theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "cupcake");
  }, []);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
      </Head>
      <SessionProvider session={session}>
        <OnchainProviders>
          <BracketProvider>
            <Layout>
              <Component {...pageProps} />
              <ToastContainer position="top-center" />
            </Layout>
            <StoryModal />
            <div id="portal" />
          </BracketProvider>
        </OnchainProviders>
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
