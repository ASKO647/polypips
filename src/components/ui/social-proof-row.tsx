import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_PROOF } from "@/lib/data/social-proof";

const AVATAR_GRADIENTS = [
  "from-brand-300 to-brand-500",
  "from-orange-300 to-brand-400",
  "from-rose-300 to-brand-500",
  "from-brand-400 to-brand-700",
];

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
      <div className="flex -space-x-2.5">
        {AVATAR_GRADIENTS.map((gradient, i) => (
          <span
            key={i}
            className={cn(
              "h-8 w-8 rounded-full border-2 border-surface bg-gradient-to-br",
              gradient
            )}
          />
        ))}
      </div>
      <div className="flex flex-col gap-0.5 text-left">
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
                className="h-3.5 w-3.5 fill-brand-500 text-brand-500"
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
