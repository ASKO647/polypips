import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-600",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
      {children}
    </div>
  );
}
