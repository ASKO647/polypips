import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckItem({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted";
}) {
  return (
    <li className={cn("flex items-center gap-2.5 text-sm", className)}>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          tone === "muted" ? "bg-ink/10" : "bg-brand-500/15"
        )}
      >
        <Check
          className={cn(
            "h-3 w-3",
            tone === "muted" ? "text-ink" : "text-brand-600"
          )}
          strokeWidth={3}
        />
      </span>
      <span className={tone === "muted" ? "text-white/90" : "text-body"}>
        {children}
      </span>
    </li>
  );
}
