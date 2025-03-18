import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { defineChain } from "thirdweb";
import { viemAdapter } from "thirdweb/adapters/viem";
import { useSetActiveWallet } from "thirdweb/react";
import { createWalletAdapter } from "thirdweb/wallets";
import { useDisconnect, useSwitchChain, useWalletClient } from "wagmi";

import { Wallet } from "~/components/Wallet";
import { APP_NAME, CLIENT } from "~/constants";

export const Navbar = () => {
  const { data: walletClient } = useWalletClient();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const setActiveWallet = useSetActiveWallet();

  useEffect(() => {
    const setActive = async () => {
      if (walletClient) {
        // adapt the walletClient to a thirdweb account
        const adaptedAccount = viemAdapter.walletClient.fromViem({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          walletClient: walletClient as any, // accounts for wagmi/viem version mismatches
        });
        // create the thirdweb wallet with the adapted account
        const thirdwebWallet = createWalletAdapter({
          client: CLIENT,
          adaptedAccount,
          chain: defineChain(await walletClient.getChainId()),
          onDisconnect: async () => {
            await disconnectAsync();
          },
          switchChain: async (chain) => {
            await switchChainAsync({ chainId: chain.id });
          },
        });
        void setActiveWallet(thirdwebWallet);
      }
    };
    void setActive();
  }, [disconnectAsync, setActiveWallet, switchChainAsync, walletClient]);

  return (
    <div className="navbar-styles navbar fixed left-0 right-0 top-0 z-50 w-full bg-secondary">
      <div className="navbar-start">
        <Logo />
      </div>
      <div className="navbar-center hidden lg:flex">
        <NavbarItems
          items={[
            { href: "/my-brackets", children: "My Brackets" },
            { href: "/leaderboard", children: "Leaderboard" },
            { href: "/contract", children: "Contract" },
          ]}
        />
      </div>
      <div className="navbar-end">
        <Wallet />
      </div>
    </div>
  );
};

const NavbarItems = ({
  items,
}: {
  items: { href: string; children: React.ReactNode }[];
}) => {
  return (
    <ul className="color-primary-content menu menu-horizontal px-1 font-bold uppercase">
      {items.map((item) => (
        <li
          key={item.href}
          className="text-md text-primary-content hover:bg-primary/90"
        >
          <Link href={item.href}>{item.children}</Link>
        </li>
      ))}
    </ul>
  );
};

const Logo = () => (
  <Link href="/">
    <div className="flex items-center gap-2">
      <Image
        src="/assets/logo.svg"
        alt={APP_NAME}
        width={340}
        height={90}
        priority
      />
    </div>
  </Link>
);

export default Navbar;
