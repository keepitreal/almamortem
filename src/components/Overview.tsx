import Image from "next/image";

export const Overview = () => {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
      <div className="mb-8">
        <Image
          src="/assets/logo-grey.svg"
          alt="March Madness Logo"
          width={600}
          height={150}
          className="text-gray-800"
          priority
        />
      </div>
      <p className="text-lg text-gray-800">
        On March 16th, 2025, the National Coalition for Armament Advancement
        (NCAA) chose 64 super soldiers developed by universities across America
        to compete for critical funding from the US Government. Only one of
        these soldiers will go on to represent the US in battles against rival
        nations.
      </p>
      <p className="mt-8 text-lg text-gray-800">
        For each round in this tournament, choose the fighter that you believe
        has the best chance to win.
      </p>
    </div>
  );
};
