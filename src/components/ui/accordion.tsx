"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface transition-colors data-[state=open]:border-brand-200 data-[state=open]:bg-brand-50/40",
        className
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 px-5 py-4.5 text-left text-[15px] font-semibold text-ink transition-colors sm:px-6 sm:py-5",
          className
        )}
        {...props}
      >
        {children}
        <Plus
          className="h-4.5 w-4.5 shrink-0 text-brand-500 transition-transform duration-300 group-data-[state=open]:rotate-45"
          strokeWidth={2.5}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-sm leading-relaxed text-body data-[state=closed]:animate-[accordion-up_0.25s_ease] data-[state=open]:animate-[accordion-down_0.25s_ease]",
        className
      )}
      {...props}
    >
      <div className="px-5 pb-5 sm:px-6">{children}</div>
    </AccordionPrimitive.Content>
  );
}
