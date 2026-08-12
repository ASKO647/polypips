"use client";

import { useCountdown } from "@/lib/hooks/use-countdown";
import { cn } from "@/lib/utils";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function Countdown({
  deadline,
  variant = "inline",
  className,
}: {
  deadline: Date;
  variant?: "inline" | "blocks" | "cells";
  className?: string;
}) {
  const { days, hours, minutes, seconds } = useCountdown(deadline);
  const units = [
    { label: "j", value: days },
    { label: "h", value: hours },
    { label: "m", value: minutes },
    { label: "s", value: seconds },
  ];

  if (variant === "cells") {
    return (
      <div className={cn("flex items-center gap-1.5", className)} role="timer">
        {units.map((unit) => (
          <span
            key={unit.label}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-brand-500 text-[14px] font-bold tabular-nums text-white"
          >
            {pad(unit.value)}
          </span>
        ))}
      </div>
    );
  }

  if (variant === "blocks") {
    return (
      <div className={cn("flex items-center gap-1.5", className)} role="timer">
        {units.map((unit) => (
          <span key={unit.label} className="flex items-center gap-1.5">
            <span className="flex h-9 min-w-9 flex-col items-center justify-center rounded-lg bg-brand-500 px-1.5 text-sm font-bold tabular-nums text-white">
              {pad(unit.value)}
            </span>
            <span className="text-xs font-semibold text-body-soft">
              {unit.label}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-mono text-sm font-semibold tabular-nums text-brand-600",
        className
      )}
      role="timer"
    >
      {units.map((unit, i) => (
        <span key={unit.label} className="flex items-baseline gap-0.5">
          <span>{pad(unit.value)}</span>
          <span className="text-[11px] font-medium text-body-soft">
            {unit.label}
          </span>
          {i < units.length - 1 && (
            <span className="mx-0.5 text-body-soft">:</span>
          )}
        </span>
      ))}
    </div>
  );
}
