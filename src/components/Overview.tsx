import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const DEADLINE = new Date("2025-03-20T12:00:00-04:00"); // EDT/EST time

const useCountdown = (deadline: Date) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = deadline.getTime() - new Date().getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }, [deadline]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
};

export const Overview = ({ readOnly }: { readOnly: boolean }) => {
  const timeLeft = useCountdown(DEADLINE);

  return (
    <div className="overview mx-auto flex max-w-4xl flex-col items-center px-4 py-8">
      <div className="mb-4">
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
        has the best chance to win. Monitor your bracket&apos;s position in the
        leaderboard and compete for the Palmer Prize! Outcomes of each matchup
        are determined by the 2025 men&apos;s college basketball tournament.
        This is an experimental AI art project and is not affiliated with any
        universities or collegiate organizations.
      </p>

      {!readOnly && (
        <div className="countdown-timer mt-8 flex flex-col items-center gap-2 text-primary">
          <span className="text-lg font-medium">Submit entries by</span>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase">DAYS</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase">HRS</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase">MINS</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase">SEC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
