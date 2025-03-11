import { Avatar, Name } from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";

export const BracketOwner = () => {
  const { address } = useAccount();

  if (!address) return null;

  return (
    <div className="flex items-center gap-3">
      <Avatar address={address} className="h-8 w-8 rounded-full" />
      <div className="flex flex-col">
        <Name
          address={address}
          className="font-['AnimeAce'] text-base font-normal"
        />
      </div>
    </div>
  );
};

export default BracketOwner;
