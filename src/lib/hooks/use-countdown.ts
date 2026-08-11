"use client";

import { useEffect, useState } from "react";

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const INITIAL: TimeLeft = { days: 20, hours: 14, minutes: 37, seconds: 22 };

function diffToTimeLeft(diffMs: number): TimeLeft {
  const clamped = Math.max(diffMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Counts down to a fixed deadline. Renders a stable placeholder until the
 * component mounts, then ticks client-side — avoids SSR/client mismatches.
 */
export function useCountdown(deadline: Date) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(INITIAL);

  useEffect(() => {
    const tick = () =>
      setTimeLeft(diffToTimeLeft(deadline.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}
