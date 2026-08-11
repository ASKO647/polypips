import Link from "next/link";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="4 6 107 130"
      className={cn("h-8 w-[1.65rem] text-brand-500", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 8 17 A 9 9 0 0 1 17 8 L 36 8 L 62.05 14.09 A 33 33 0 1 1 44.99 55.29 L 38 52 L 59.09 50.16 A 18 18 0 1 0 59.09 37.84 L 38 36 L 44.99 32.71 L 36 30 L 36 96 L 26 108 L 6 134 L 8 96 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-brand-500",
        className
      )}
      aria-label="Polypips — accueil"
    >
      <LogoMark />
      {!markOnly && <span>POLYPIPS</span>}
    </Link>
  );
}
