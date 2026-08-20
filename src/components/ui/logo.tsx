import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
      <Image
        src="/polypips-mark.png"
        alt=""
        width={290}
        height={322}
        priority
        className="h-8 w-auto"
      />
      {!markOnly && <span>POLYPIPS</span>}
    </Link>
  );
}
