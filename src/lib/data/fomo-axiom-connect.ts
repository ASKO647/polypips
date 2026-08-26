/**
 * Content for "Comment connecter PolyPips à Fomo & Axiom". Every claim here
 * was checked against real, current information before being written —
 * see the research summary handed to the user alongside this feature:
 *
 * - Axiom Trade (https://axiom.trade) is a real, YC-backed, non-custodial
 *   Solana trading terminal. It publishes end-user product docs at
 *   docs.axiom.trade (how to use ITS OWN wallet-tracking UI), but no
 *   public/official API or OAuth mechanism for third-party apps like
 *   PolyPips to request access on a user's behalf. The Python/Rust
 *   "AxiomTradeAPI" packages floating around are unofficial, reverse-
 *   engineered wrappers around Axiom's private session (email/password →
 *   JWT) — using them would mean PolyPips handling a user's Axiom
 *   password, which this feature will never do, and bypassing Axiom's own
 *   access controls, which the brief explicitly forbids.
 * - Fomo (https://fomo.family) is a real, social-first Solana memecoin
 *   trading app (Privy-based embedded wallets). No public third-party
 *   API or "connect your app" flow is published either.
 *
 * Conclusion: neither platform can be genuinely connected today. Steps 3
 * ("Autoriser PolyPips") on both tracks are therefore NOT rendered as an
 * action a user can take — see PlatformConnectSection, which shows an
 * honest "pas encore disponible" state instead of a button that would
 * lie about what it does.
 */

export type ConnectPlatformId = "axiom" | "fomo";

export type ConnectPlatformInfo = {
  id: ConnectPlatformId;
  label: string;
  officialUrl: string;
  subtitle: string;
  openStepDescription: string;
  loginStepDescription: string;
};

export const CONNECT_PLATFORMS: Record<ConnectPlatformId, ConnectPlatformInfo> = {
  axiom: {
    id: "axiom",
    label: "Axiom",
    officialUrl: "https://axiom.trade",
    subtitle:
      "Connectez Axiom à PolyPips pour permettre à PolyPips d'utiliser les données nécessaires au suivi de vos Smart Wallets et au Copy Trading.",
    openStepDescription:
      "Axiom est le terminal de trading Solana sur lequel vous suivez vos wallets et vos memecoins. Ouvrez axiom.trade pour accéder à votre compte.",
    loginStepDescription:
      "Connectez-vous à votre compte Axiom directement sur axiom.trade, avec la méthode proposée par Axiom. Cette étape se déroule entièrement sur leur site — PolyPips ne vous demande jamais votre mot de passe Axiom.",
  },
  fomo: {
    id: "fomo",
    label: "Fomo",
    officialUrl: "https://fomo.family",
    subtitle:
      "Connectez Fomo à PolyPips pour utiliser les données nécessaires au suivi des Smart Wallets et au Copy Trading.",
    openStepDescription:
      "Fomo est l'application de trading social pour memecoins Solana. Ouvrez fomo.family pour accéder à votre compte.",
    loginStepDescription:
      "Connectez-vous à votre compte Fomo directement sur fomo.family, avec la méthode proposée par Fomo (Google, Apple, etc.). Cette étape se déroule entièrement sur leur site — PolyPips ne vous demande jamais vos identifiants Fomo.",
  },
};

/** Shared across both platform tracks — neither exposes a public API or
 * OAuth mechanism today, so this text is identical by necessity, not by
 * laziness. */
export function authorizeStepDescription(platform: ConnectPlatformInfo): string {
  return `${platform.label} ne propose aujourd'hui aucune API publique ni aucun mécanisme officiel permettant à une application externe comme PolyPips de demander une autorisation directe sur votre compte. Cette étape n'est donc pas encore disponible — dès qu'une intégration officielle existera, elle sera ajoutée ici.`;
}

export const COPY_TRADING_ACTIVATION_STEPS: { title: string; description: string }[] = [
  {
    title: "Aller dans Fomo X Axiom → Smart Wallet",
    description:
      "Depuis la sidebar, ouvrez la section \"Fomo X Axiom\" puis la page \"Smart Wallet\" pour parcourir les wallets repérés.",
  },
  {
    title: "Choisir un Smart Wallet",
    description:
      "Filtrez par source (Fomo/Axiom) ou par Win Rate, puis ouvrez le wallet qui vous intéresse pour consulter son détail.",
  },
  {
    title: 'Cliquer sur "Suivre"',
    description:
      'Depuis la fiche du wallet ou sa carte dans la liste, cliquez sur "Suivre" — il apparaît alors dans "Mes Smart Wallets".',
  },
  {
    title: 'Dans "Mes Smart Wallets", cliquer sur "Activer le Copy Trading"',
    description:
      'Ouvrez "Mes Smart Wallets", repérez le wallet suivi, et cliquez sur "Activer le Copy Trading" pour déplier son formulaire de paramètres.',
  },
  {
    title: "Configurer les paramètres disponibles",
    description:
      "Montant maximum par trade, % de la position à copier, montant maximum par jour, nombre maximum de positions simultanées, slippage maximum, tokens à exclure, perte maximale journalière. Exemple : 500 $ par trade, 2 % copié, 5 positions maximum. Ces champs sont réellement appliqués par le Risk Engine à chaque trade détecté.",
  },
  {
    title: 'Activer le Copy Trading',
    description:
      'Cliquez sur "Activer le Copy Trading" pour valider — le pipeline (détection → analyse IA → Risk Engine → décision) tourne ensuite automatiquement en mode démo à chaque synchronisation.',
  },
];

export const PIPELINE_STAGES: string[] = [
  "SMART WALLET",
  "TRADE DÉTECTÉ",
  "ANALYSE POLYPIPS",
  "SCORE IA",
  "RISK ENGINE",
  "COPY / IGNORE",
  "EXÉCUTION",
  "SUIVI DE LA POSITION",
];

export const FOMO_AXIOM_FAQ: { question: string; answer: string }[] = [
  {
    question: "Pourquoi dois-je connecter Axiom ?",
    answer:
      "Axiom est l'une des deux sources de Smart Wallets memecoins que PolyPips veut suivre. Aujourd'hui, Axiom ne propose aucune API publique permettant une connexion réelle — les wallets affichés dans PolyPips sont donc des données de démonstration clairement indiquées, en attendant qu'une intégration officielle existe.",
  },
  {
    question: "Pourquoi dois-je connecter Fomo ?",
    answer:
      "Même logique que pour Axiom : Fomo est la deuxième source de Smart Wallets visée par PolyPips, mais ne propose pas non plus d'API publique aujourd'hui. Aucune donnée réelle n'est donc encore récupérée depuis Fomo.",
  },
  {
    question: "Mes clés privées sont-elles stockées par PolyPips ?",
    answer:
      "Non. PolyPips ne demande jamais votre seed phrase, votre clé privée, ni le mot de passe de vos comptes Axiom ou Fomo. Aucune clé privée n'est stockée, en clair ou chiffrée, par PolyPips.",
  },
  {
    question: "Comment désactiver le Copy Trading ?",
    answer:
      'Depuis "Mes Smart Wallets", ouvrez les paramètres du wallet concerné et cliquez sur "Désactiver le Copy Trading". Il s\'arrête immédiatement pour ce wallet.',
  },
  {
    question: "Que se passe-t-il si une connexion est interrompue ?",
    answer:
      "Aujourd'hui, aucune connexion réelle à Axiom ou Fomo n'existe encore : il n'y a donc rien à interrompre de ce côté. Le pipeline de Copy Trading tourne sur des données de démonstration clairement indiquées. Une fois une source réelle connectée, une interruption sera signalée par le statut 🔴 sur cette page et par une notification.",
  },
  {
    question: "Comment savoir si un trade a été copié ?",
    answer:
      'Consultez la page "Trades copiés" : chaque trade détecté y apparaît avec son score IA, sa décision (copié ou ignoré) et son statut. Vous recevez aussi une notification "🟢 Trade copié" ou "🔴 Trade ignoré" au moment de la décision.',
  },
];
