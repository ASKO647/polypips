import {
  DiscordIcon,
  TelegramIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import type { ComponentType } from "react";

export const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "À propos", href: "/about" },
  { label: "FAQ", href: "#faq" },
];

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/features" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Comment ça marche", href: "/how-it-works" },
      { label: "Mises à jour", href: "/changelog" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/guides" },
      { label: "API", href: "/developers" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", href: "/terms" },
      { label: "Politique de confidentialité", href: "/privacy" },
      { label: "Mentions légales", href: "/legal" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Partenaires", href: "/partners" },
    ],
  },
];

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
