export const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "À propos", href: "#a-propos" },
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
      { label: "Fonctionnalités", href: "#fonctionnalites" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Comment ça marche", href: "#comment-ca-marche" },
      { label: "Mises à jour", href: "#" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Guides", href: "#" },
      { label: "API", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "Mentions légales", href: "#" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Partenaires", href: "#" },
    ],
  },
];

export const SOCIAL_LINKS = [
  { label: "X", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Discord", href: "#" },
  { label: "Telegram", href: "#" },
];
