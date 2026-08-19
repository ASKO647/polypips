import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/**
 * Locale-aware drop-in replacements for next/link and next/navigation —
 * every component that needs to link or redirect within the app imports
 * these instead, so the current locale prefix is preserved automatically
 * instead of every call site having to prepend it by hand.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
