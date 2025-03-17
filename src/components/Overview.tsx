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
      <p className="mt-8 text-lg text-gray-800">
        For each matchup in this tournament, choose the fighter that you believe
        has the best chance to win. Monitor your bracket's position in the
        leaderboard and compete for the Palmer Prize!
      </p>
      <p className="mt-8 text-xs text-gray-800">
        Alma Mortem is an AI art experiment and is not affiliated with any
        universities or collegiate organizations.
      </p>
    </div>
  );
};
