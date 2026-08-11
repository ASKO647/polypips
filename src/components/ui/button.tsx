import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_10px_24px_-8px_var(--color-brand-500)] hover:scale-[1.02] hover:bg-brand-600 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_16px_32px_-8px_var(--color-brand-600)] active:scale-[0.98] active:bg-brand-700",
        outline:
          "border border-border-strong bg-surface text-ink hover:scale-[1.015] hover:border-brand-300 hover:bg-brand-50/60 active:scale-[0.985] active:bg-brand-100/60",
        ghost: "text-ink hover:bg-ink/[0.04] active:bg-ink/[0.06]",
        subtle:
          "bg-ink/[0.04] text-ink hover:bg-ink/[0.07] active:bg-ink/[0.09]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[15px]",
        lg: "h-[3.25rem] px-7 text-base",
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
