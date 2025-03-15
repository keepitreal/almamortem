import { type IncomingMessage } from "http";
import { type GetServerSideProps, type NextPage } from "next";
import { useEffect, useState } from "react";
import { defineChain } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { tokenURI } from "thirdweb/extensions/erc721";
import { download } from "thirdweb/storage";

import { Desktop } from "~/components/Bracket/Desktop";
import { Mobile } from "~/components/Bracket/Mobile";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { APP_NAME, APP_URL, CLIENT, DEFAULT_CHAIN,NFT_ADDRESS } from "~/constants";

const DESKTOP_MIN_WIDTH = 1024; // Minimum width in pixels to show desktop view

type ExtendedRequest = IncomingMessage & {
  cookies: Record<string, string | undefined>;
  frameMetadata?: string;
};

interface NFTMetadata {
  name: string;
  data: {
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
    picks: Array<{
      id: number;
      round: string;
      topTeam: {
        id: string;
      };
      bottomTeam: {
        id: string;
      };
      winner: string;
    }>;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tournamentId, id } = context.query;
  
  if (typeof tournamentId !== 'string' || typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    // Get the NFT contract
    const contract = getContract({
      client: CLIENT,
      address: NFT_ADDRESS[DEFAULT_CHAIN.id]!,
      chain: defineChain(DEFAULT_CHAIN.id),
    });

    // Get the token URI from the contract
    const tokenUri = await tokenURI({
      contract,
      tokenId: BigInt(id),
     });

    if (!tokenUri) {
      throw new Error("Token URI not found");
    }

    // Fetch NFT metadata from IPFS
    const response = await download({
      client: CLIENT,
      uri: tokenUri,
    });

    const data = await response.json() as NFTMetadata;
    const metadata = data;

    // Generate the frame metadata
    const frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/api/frame/image`,
      button: {
        title: APP_NAME,
        action: {
          type: 'launch_frame',
          name: APP_NAME,
          url: `${APP_URL}/bracket/${tournamentId}/token/${id}`,
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
        tokenId: id,
        metadata,
      }
    };
  } catch (error) {
    console.error("Error fetching NFT metadata:", error);
    return { notFound: true };
  }
};

interface PageProps {
  tournamentId: string;
  tokenId: string;
  metadata: NFTMetadata;
}

const ViewTokenBracket: NextPage<PageProps> = ({ tournamentId, tokenId, metadata }) => {
  const [isDesktop, setIsDesktop] = useState(true);

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

  if (!tournamentId || !tokenId || !metadata) {
    return <LoadingOverlay />;
  }

  // Pass the picks data to the bracket components
  const bracketProps = {
    tournamentId,
    tokenId,
    picks: metadata.data.picks,
    readOnly: true, // This ensures the bracket is view-only
  };

  return isDesktop ? (
    <Desktop {...bracketProps} />
  ) : (
    <Mobile {...bracketProps} />
  );
};

export default ViewTokenBracket; 