import Link from "next/link";
import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      className={cn("h-7 w-[1.3rem] text-brand-500", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 2h11a8 8 0 0 1 0 16H7v12H2V2Zm5 5v6h6a3 3 0 0 0 0-6H7Z"
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
        "inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-ink",
        className
      )}
      aria-label="Polypips — accueil"
    >
      <LogoMark />
      {!markOnly && <span>POLYPIPS</span>}
    </Link>
  );
}
