import { type IncomingMessage } from "http";
import { type GetServerSideProps, type NextPage } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

import { Desktop } from "~/components/Bracket/Desktop";
import { Mobile } from "~/components/Bracket/Mobile";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { APP_NAME, APP_URL } from "~/constants";

// Define the props interface matching the component
interface WatchSubmitProps {
  onBracketSubmitted: (tokenId: string) => void;
}

// Use type assertion for the dynamic import
const WatchSubmit = dynamic(
  () => import("~/components/Bracket/WatchSubmit").then(mod => mod.WatchSubmit),
  { ssr: false }
) as React.ComponentType<WatchSubmitProps>;

const DESKTOP_MIN_WIDTH = 1024; // Minimum width in pixels to show desktop view

type ExtendedRequest = IncomingMessage & {
  cookies: Record<string, string | undefined>;
  frameMetadata?: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tournamentId } = context.query;
  
  if (typeof tournamentId !== 'string') {
    return { notFound: true };
  }

  // Generate the frame metadata
  const frameMetadata = JSON.stringify({
    version: "next",
    imageUrl: `${APP_URL}/api/frame/image`,
    button: {
      title: APP_NAME,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: `${APP_URL}/bracket/${tournamentId}`,
        splashImageUrl: `${APP_URL}/images/icon.png`,
        splashBackgroundColor: '#fafafa',
      }
    }
  });

  // Attach the frame metadata to the request object
  if (context.req) {
    (context.req as ExtendedRequest).frameMetadata = frameMetadata;
  }

  return {
    props: {
      tournamentId,
    }
  }
}

interface PageProps {
  tournamentId: string;
}

const BuildBracket: NextPage<PageProps> = ({ tournamentId }) => {
  const [isDesktop, setIsDesktop] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check initial screen size
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_MIN_WIDTH);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleBracketSubmitted = (tokenId: string) => {
    console.log("Bracket submitted", tokenId);
    void router.push(`/bracket/${tournamentId}/view/${tokenId}`);
  }

  if (!tournamentId) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <WatchSubmit onBracketSubmitted={handleBracketSubmitted} />
      {isDesktop ? (
        <Desktop tournamentId={tournamentId} />
      ) : (
        <Mobile tournamentId={tournamentId} />
      )}
    </>
  )
};

export default BuildBracket;
