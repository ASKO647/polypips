import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("flex items-center gap-2.5 text-sm", className)}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15">
        <Check className="h-3 w-3 text-brand-600" strokeWidth={3} />
      </span>
      <span className="text-body">{children}</span>
    </li>
  );
}
