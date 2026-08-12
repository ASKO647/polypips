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
        "overflow-hidden rounded-[20px] border border-border bg-surface transition-colors duration-200 ease-out hover:bg-surface-muted data-[state=open]:border-brand-200 data-[state=open]:bg-surface-muted",
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
          "group flex min-h-[76px] flex-1 items-center justify-between gap-4 px-7 text-left text-[15px] font-semibold text-ink transition-colors",
          className
        )}
        {...props}
      >
        {children}
        <Plus
          className="h-5 w-5 shrink-0 text-brand-500 transition-transform duration-200 ease-out group-hover:scale-110 group-data-[state=open]:rotate-45"
          strokeWidth={3}
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
      <div className="px-7 pb-6">{children}</div>
    </AccordionPrimitive.Content>
  );
}
