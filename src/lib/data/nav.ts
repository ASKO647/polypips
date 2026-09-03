import {
  DiscordIcon,
  TelegramIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import type { ComponentType } from "react";

/** Structural data only — labels live in the `Nav` / `Footer` translation
 * namespaces, keyed by `id`. */
export const NAV_LINKS = [
  { id: "features", href: "#fonctionnalites" },
  { id: "pricing", href: "#tarifs" },
  { id: "about", href: "/about" },
  { id: "faq", href: "#faq" },
] as const;

export type FooterColumn = {
  id: "product" | "resources" | "legal" | "company";
  links: { id: string; href: string }[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: "product",
    links: [
      { id: "features", href: "/features" },
      { id: "pricing", href: "/pricing" },
      { id: "howItWorks", href: "/how-it-works" },
      { id: "changelog", href: "/changelog" },
    ],
  },
  {
    id: "resources",
    links: [
      { id: "blog", href: "/blog" },
      { id: "guides", href: "/guides" },
      { id: "api", href: "/developers" },
      { id: "support", href: "/support" },
    ],
  },
  {
    id: "legal",
    links: [
      { id: "terms", href: "/terms" },
      { id: "privacy", href: "/privacy" },
      { id: "legal", href: "/legal" },
      { id: "cookies", href: "/cookies" },
    ],
  },
  {
    id: "company",
    links: [
      { id: "about", href: "/about" },
      { id: "contact", href: "/contact" },
      { id: "partners", href: "/partners" },
    ],
  },
];

// Platform names are proper nouns — identical in every locale, so they stay
// as plain data rather than translation keys.
export const SOCIAL_LINKS: {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { label: "X", href: "#", icon: XIcon },
  { label: "YouTube", href: "#", icon: YoutubeIcon },
  { label: "Discord", href: "#", icon: DiscordIcon },
  { label: "Telegram", href: "#", icon: TelegramIcon },
];
