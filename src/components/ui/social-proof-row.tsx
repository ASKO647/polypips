import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_PROOF } from "@/lib/data/social-proof";

export function SocialProofRow({
  userCount = SOCIAL_PROOF.userCount,
  rating = SOCIAL_PROOF.rating,
  ratingSource = SOCIAL_PROOF.ratingSource,
  align = "start",
  className,
}: {
  userCount?: string;
  rating?: string;
  ratingSource?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-0.5",
          align === "center" ? "items-center text-center" : "items-start text-left"
        )}
      >
        <p className="text-sm font-semibold text-ink">
          +{userCount}{" "}
          <span className="font-normal text-body">
            utilisateurs nous font déjà confiance
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-[#00b67a] text-[#00b67a]"
              />
            ))}
          </div>
          <span className="text-xs font-medium text-body-soft">
            {rating} sur {ratingSource}
          </span>
        </div>
      </div>
    </div>
  );
}
