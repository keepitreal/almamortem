import { OnchainKitProvider } from '@coinbase/onchainkit';
import { frameConnector } from "~/utils/farcasterConnector";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type FC } from 'react';
import { ThirdwebProvider } from 'thirdweb/react';
import { 
  createConfig, 
  http, 
  type Transport, 
  WagmiProvider,
} from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

import { APP_DESCRIPTION, APP_NAME, APP_URL, DEFAULT_CHAIN, SUPPORTED_CHAINS } from '~/constants';
import { env } from '~/env';
import farcasterFrameSdk from "@farcaster/frame-sdk";

import '@coinbase/onchainkit/styles.css';

type Props = {
  children: React.ReactNode;
}

const transports = SUPPORTED_CHAINS.reduce((acc, chain) => {
  acc[chain.id] = http(
    `http://${chain.id}.rpc.thirdweb.com/${env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}`
  )
  return acc;
}, {} as Record<number, Transport>);

// Create wagmi config
const config = createConfig({
  chains: SUPPORTED_CHAINS,
  transports,
  connectors: [
    frameConnector(),
    injected(),
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: `${APP_URL}/images/icon.png`,
    }),
    walletConnect({
      projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: APP_NAME,
        description: APP_DESCRIPTION,
        url: APP_URL,
        icons: [`${APP_URL}/images/icon.png`]
      }
    }),
  ]
});

// Create a client
const queryClient = new QueryClient();

const OnchainProviders: FC<Props> = ({ children }) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    if (farcasterFrameSdk && !isSDKLoaded) {
      const load = async () => {
        farcasterFrameSdk.actions.ready();
      };
      setIsSDKLoaded(true);
      load();
    }
  }, [farcasterFrameSdk, isSDKLoaded]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThirdwebProvider>
          <OnchainKitProvider
            apiKey={env.NEXT_PUBLIC_CDP_API_KEY}
            chain={DEFAULT_CHAIN}
            config={{
              appearance: {
                name: APP_NAME,
                logo: `${APP_URL}/images/icon.png`,
              },
              wallet: {
                display: 'modal',
              },
            }}
          >
            {children}
          </OnchainKitProvider>
        </ThirdwebProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 
 
export default OnchainProviders;