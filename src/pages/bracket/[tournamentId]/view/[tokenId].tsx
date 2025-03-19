import { type IncomingMessage } from "http";
import { type GetServerSideProps, type NextPage } from "next";
import { type FC } from "react";
import { defineChain } from "thirdweb";
import { getContract } from "thirdweb/contract";
import { tokenURI } from "thirdweb/extensions/erc721";
import { download } from "thirdweb/storage";

import { Desktop } from "~/components/Bracket/Desktop";
import {
  APP_NAME,
  APP_URL,
  CLIENT,
  DEFAULT_CHAIN,
  NFT_ADDRESS,
} from "~/constants";
import { useNFTBracket } from "~/context/NFTBracketContext";
import { NFTBracketProvider } from "~/context/NFTBracketContext";
import type { NFTMetadata } from "~/types/bracket";

type ExtendedRequest = IncomingMessage & {
  cookies: Record<string, string | undefined>;
  frameMetadata?: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { tournamentId, tokenId } = context.query;

  if (typeof tournamentId !== "string" || typeof tokenId !== "string") {
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
      tokenId: BigInt(tokenId),
    });

    if (!tokenUri) {
      throw new Error("Token URI not found");
    }

    // Fetch NFT metadata from IPFS
    const response = await download({
      client: CLIENT,
      uri: tokenUri,
    });

    const data = (await response.json()) as NFTMetadata;
    const metadata = data;

    // Generate the frame metadata
    const frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: `${APP_URL}/api/frame/image`,
      button: {
        title: APP_NAME,
        action: {
          type: "launch_frame",
          name: APP_NAME,
          url: `${APP_URL}/bracket/${tournamentId}/view/${tokenId}`,
          splashImageUrl: `${APP_URL}/images/icon.png`,
          splashBackgroundColor: "#fafafa",
        },
      },
    });

    // Attach the frame metadata to the request object
    if (context.req) {
      (context.req as ExtendedRequest).frameMetadata = frameMetadata;
    }

    return {
      props: {
        tournamentId,
        tokenId,
        metadata,
      },
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

const ViewTokenBracket: NextPage<PageProps> = ({ tournamentId, metadata }) => {
  return (
    <NFTBracketProvider metadata={metadata}>
      <NFTBracketContent tournamentId={tournamentId} metadata={metadata} />
    </NFTBracketProvider>
  );
};

// Separate component to use the hook inside the provider
const NFTBracketContent: FC<{
  tournamentId: string;
  metadata: NFTMetadata;
}> = ({ tournamentId }) => {
  const { userPicks } = useNFTBracket();
  console.log("userPicks", userPicks);
  return (
    <div className="flex flex-col">
      <Desktop tournamentId={tournamentId} nftUserPicks={userPicks} />
    </div>
  );
};

export default ViewTokenBracket;
