import {
  Address,
  Avatar,
  EthBalance,
  Identity,
  Name,
} from "@coinbase/onchainkit/identity";
import { color } from "@coinbase/onchainkit/theme";
import {
  ConnectWallet,
  ConnectWalletText,
  Wallet as WalletComponent,
  WalletDropdown,
  WalletDropdownBasename,
  WalletDropdownDisconnect,
  WalletDropdownFundLink,
} from "@coinbase/onchainkit/wallet";
import { ZERO_ADDRESS } from "thirdweb";
import { Blobbie } from "thirdweb/react";
import { useAccount } from "wagmi";

type Props = {
  btnLabel?: string;
};
export function Wallet({ btnLabel }: Props) {
  const { address } = useAccount();

  return (
    <div className="flex items-center gap-2">
      <WalletComponent>
        <ConnectWallet className="rounded-none bg-primary hover:bg-primary/90">
          <ConnectWalletText className="uppercase italic text-white">
            {btnLabel ?? "Connect Wallet"}
          </ConnectWalletText>
          <Avatar 
            className="h-6 w-6 rounded-full"
            /* fill in the avatar */
            defaultComponent={<Blobbie className="h-[120%] w-[120%] rounded-full overflow-hidden relative -top-0.5 -left-0.5" address={address ?? ZERO_ADDRESS} />}
          />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pb-2 pt-3" hasCopyAddressOnClick>
            <Avatar
              defaultComponent={<Blobbie className="h-full w-full rounded-full" address={address ?? ZERO_ADDRESS} />}
            />
            <Name />
            <Address className={color.foregroundMuted} />
            <EthBalance />
          </Identity>
          <WalletDropdownBasename />
          <WalletDropdownFundLink />
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </WalletComponent>
    </div>
  );
}
