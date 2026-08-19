import { Link } from "@/i18n/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

/**
 * Every CTA on the site shares one animation recipe: 220ms hover / 120ms
 * press, both on the same cubic-bezier(0.22,1,0.36,1) "premium" ease. Primary
 * buttons additionally get a 6s recurring light sheen. Never diverge a single
 * button from this — that consistency is the point.
 */
export const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-semibold tracking-tight transition-[scale,translate,background-color,border-color,box-shadow] duration-[220ms] ease-[var(--ease-premium)] active:duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "cta-sheen bg-cta text-white shadow-[0_12px_32px_rgba(229,35,35,0.22)] hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-cta-hover hover:shadow-[0_18px_40px_rgba(229,35,35,0.28)] active:translate-y-0 active:scale-[0.98] active:shadow-[0_8px_20px_rgba(229,35,35,0.18)]",
        outline:
          "border border-border-strong bg-surface text-ink hover:scale-[1.02] hover:border-[#F3C7C7] hover:bg-[#FFF8F8] hover:shadow-[0_10px_24px_rgba(0,0,0,0.06)] active:scale-[0.98]",
        ghost: "text-ink hover:bg-ink/[0.04] active:bg-ink/[0.06]",
        subtle:
          "bg-ink/[0.04] text-ink hover:bg-ink/[0.07] active:bg-ink/[0.09]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type CommonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.href) {
    const { className, variant, size, href, children, ...anchorRest } = props;
    return (
      <Link
        href={href}
        className={cn(buttonVariants({ variant, size }), className)}
        {...anchorRest}
      >
        {children}
      </Link>
    );
  }

  const { className, variant, size, href: _href, children, ...buttonRest } =
    props as ButtonAsButton;
  void _href;
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...buttonRest}
    >
      {children}
    </button>
  );
}

/**
 * Trailing icon (arrow, play, ...) for a Button. Nudges independently on
 * hover — 6px for primary CTAs, 4px for outline/secondary ones — using the
 * same 220ms premium ease as the button itself. Must be a direct child of a
 * Button so Tailwind's `group-hover` picks up the button's hover state.
 */
export function ButtonIcon({
  variant = "primary",
  className,
  children,
}: {
  variant?: "primary" | "outline";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 transition-[translate] duration-[220ms] ease-[var(--ease-premium)]",
        variant === "primary"
          ? "group-hover:translate-x-1.5"
          : "group-hover:translate-x-1",
        className
      )}
    >
      {children}
    </span>
  );
}
