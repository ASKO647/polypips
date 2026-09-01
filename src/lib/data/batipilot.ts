import {
  HardHat,
  PhoneCall,
  FileCheck2,
  TrendingUp,
  CalendarCheck,
  Globe,
  Megaphone,
  Plug,
  Settings2,
  Workflow,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Fonctionnalités", href: "#agents" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Contact", href: "#contact" },
] as const;

export type Agent = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const AGENTS: Agent[] = [
  {
    icon: HardHat,
    title: "Suivi de chantier",
    description:
      "Centralise l'avancement, les équipes et les documents de chaque chantier en temps réel.",
  },
  {
    icon: PhoneCall,
    title: "Standard téléphonique",
    description:
      "Répond, qualifie et redirige chaque appel entrant, 24h/24, sans file d'attente.",
  },
  {
    icon: FileCheck2,
    title: "Dossiers d'aides",
    description:
      "Monte et suit les dossiers MaPrimeRénov', CEE et aides locales sans paperasse.",
  },
  {
    icon: TrendingUp,
    title: "Relance commerciale",
    description:
      "Relance devis et prospects au bon moment, jusqu'à la signature du contrat.",
  },
  {
    icon: CalendarCheck,
    title: "Appels d'offres & RDV",
    description:
      "Détecte les appels d'offres pertinents et cale les rendez-vous automatiquement.",
  },
];

export type AutomationBlock = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
};

export const AUTOMATION_BLOCKS: AutomationBlock[] = [
  {
    icon: Globe,
    title: "Site internet auto-alimenté",
    description:
      "Votre vitrine se met à jour toute seule au rythme de votre activité, sans webmaster.",
    bullets: [
      "Chantiers et réalisations publiés automatiquement",
      "SEO local optimisé en continu par l'IA",
      "Avis clients synchronisés en temps réel",
    ],
  },
  {
    icon: Megaphone,
    title: "Marketing & pub IA",
    description:
      "L'IA crée, diffuse et optimise vos campagnes pour générer des demandes qualifiées.",
    bullets: [
      "Génération de visuels et textes publicitaires",
      "Diffusion multi-canal automatisée",
      "Optimisation continue du budget publicitaire",
    ],
  },
];

export type PlanValue = boolean | string;

export type PricingFeatureRow = {
  label: string;
  assist: PlanValue;
  autopilot: PlanValue;
  custom: PlanValue;
};

export const PRICING_FEATURES: PricingFeatureRow[] = [
  { label: "Agent BatiPilot central", assist: true, autopilot: true, custom: true },
  {
    label: "Gestion des chantiers",
    assist: "Basique",
    autopilot: "Avancée",
    custom: "Illimitée",
  },
  { label: "CRM / Clients", assist: true, autopilot: true, custom: true },
  {
    label: "Devis & relances",
    assist: "Assistées",
    autopilot: "Automatisées",
    custom: "Automatisées + IA prédictive",
  },
  { label: "Dossiers d'aides", assist: false, autopilot: true, custom: true },
  { label: "Standard téléphonique IA", assist: false, autopilot: true, custom: true },
  { label: "Rendez-vous IA", assist: false, autopilot: true, custom: true },
  { label: "Appels d'offres IA", assist: false, autopilot: false, custom: true },
  {
    label: "Marketing IA",
    assist: false,
    autopilot: "Basique",
    custom: "Avancé",
  },
  { label: "Création de pubs IA", assist: false, autopilot: false, custom: true },
  { label: "Distribution des pubs", assist: false, autopilot: false, custom: true },
  {
    label: "Workflows automatiques",
    assist: false,
    autopilot: true,
    custom: "Sur mesure",
  },
  {
    label: "Analytics",
    assist: "Basique",
    autopilot: "Avancé",
    custom: "Avancé + rapports sur mesure",
  },
  { label: "Support", assist: "Email", autopilot: "Prioritaire", custom: "Dédié" },
  {
    label: "Onboarding",
    assist: "Autonome (guides)",
    autopilot: "Accompagné",
    custom: "Sur mesure",
  },
];

export type PricingPlan = {
  id: "assist" | "autopilot" | "custom";
  name: string;
  audience: string;
  positioning: string;
  price: string;
  priceSuffix: string;
  highlighted?: boolean;
  cta: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "assist",
    name: "Assist",
    audience: "Petite entreprise",
    positioning: "IA assistée",
    price: "199 €",
    priceSuffix: "HT / mois",
    cta: "Choisir ce plan",
  },
  {
    id: "autopilot",
    name: "Autopilot",
    audience: "PME BTP",
    positioning: "IA automatisée",
    price: "499 €",
    priceSuffix: "HT / mois",
    highlighted: true,
    cta: "Choisir ce plan",
  },
  {
    id: "custom",
    name: "Custom",
    audience: "Entreprises structurées",
    positioning: "IA sur mesure",
    price: "À partir de 999 €",
    priceSuffix: "HT / mois",
    cta: "Choisir ce plan",
  },
];

export type HowItWorksStep = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: "01",
    icon: Plug,
    title: "Connexion",
    description:
      "Vous connectez vos outils existants : téléphonie, agenda, devis, site web.",
  },
  {
    number: "02",
    icon: Settings2,
    title: "Configuration",
    description:
      "Les agents IA sont paramétrés selon vos chantiers, vos process et vos équipes.",
  },
  {
    number: "03",
    icon: Workflow,
    title: "Automatisation",
    description:
      "Les agents prennent en main les tâches répétitives, 24h/24 et sans erreur.",
  },
  {
    number: "04",
    icon: Gauge,
    title: "Pilotage",
    description:
      "Vous suivez toute l'activité depuis un tableau de bord unique, en temps réel.",
  },
];
