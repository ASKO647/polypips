import type { ConfidenceLevel } from "@/lib/data/analysis";
import { cn } from "@/lib/utils";

const CONFIDENCE_LEVEL_INDEX: Record<ConfidenceLevel, number> = {
  Faible: 1,
  Moyenne: 2,
  Élevée: 3,
};

export function ConfidenceMeter({
  level,
  className,
}: {
  level: ConfidenceLevel;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2 flex-1 rounded-full",
            i < CONFIDENCE_LEVEL_INDEX[level] ? "bg-brand-500" : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}
