import dynamic from "next/dynamic";
import { type FC, type ReactNode } from "react";

const Navbar = dynamic(() => import("~/components/Navbar/Navbar"), { ssr: false });

type Props = {
  children: ReactNode;
};

export const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="mx-auto">
      <Navbar />
      <div className="max-w-full">{children}</div>
    </div>
  );
};

export default Layout;
