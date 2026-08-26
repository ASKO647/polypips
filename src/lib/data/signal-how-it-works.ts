/**
 * Content for "Comment ça marche" (Fomo X Axiom Copy Trading) — replaces
 * the earlier connection-tutorial page. There is no connection/
 * authorization step anymore: PolyPips watches followed Smart Wallets'
 * public on-chain activity and notifies you, exactly like Polymarket's
 * own Copy Trading. See sync-signal-wallets/index.ts for the real
 * pipeline this describes.
 */

export const HOW_IT_WORKS_STEPS: { title: string; description: string }[] = [
  {
    title: "Vous suivez un Smart Wallet",
    description:
      "Depuis \"Smart Wallet\", choisissez un wallet Fomo ou Axiom qui vous intéresse et cliquez sur \"Suivre\".",
  },
  {
    title: "PolyPips surveille ce wallet",
    description:
      "Dès qu'il ouvre une nouvelle position, PolyPips l'analyse (score IA) et applique vos filtres de risque pour décider si ça mérite une notification.",
  },
  {
    title: "Vous recevez une notification",
    description:
      "Si le trade passe vos filtres, une notification PolyPips arrive avec un lien direct vers la plateforme concernée (Fomo ou Axiom).",
  },
  {
    title: "Vous décidez — PolyPips ne trade jamais à votre place",
    description:
      "En cliquant sur la notification, vous êtes redirigé vers Fomo ou Axiom pour consulter et éventuellement répliquer vous-même le trade. PolyPips ne détient jamais vos fonds ni vos clés.",
  },
];

export const PIPELINE_STAGES: string[] = [
  "SMART WALLET SUIVI",
  "NOUVELLE POSITION DÉTECTÉE",
  "ANALYSE IA",
  "FILTRES DE RISQUE",
  "NOTIFICATION",
  "VOUS DÉCIDEZ (SUR FOMO/AXIOM)",
];

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
    title: "Configurer vos filtres de notification",
    description:
      "Montant maximum par trade, % de la position, montant maximum par jour, nombre maximum de positions simultanées, slippage maximum, tokens à exclure. Exemple : 500 $ par trade, 2 %, 5 positions maximum. Ces filtres déterminent quels trades détectés génèrent une notification — ils ne déclenchent jamais un ordre.",
  },
  {
    title: "Activer le Copy Trading",
    description:
      'Cliquez sur "Activer le Copy Trading" pour valider — dès qu\'un trade détecté passe vos filtres, vous recevez une notification avec un lien direct vers Fomo ou Axiom.',
  },
];

export const HOW_IT_WORKS_FAQ: { question: string; answer: string }[] = [
  {
    question: "Comment PolyPips détecte-t-il un nouveau trade ?",
    answer:
      "En synchronisant régulièrement les Smart Wallets que vous suivez sur Fomo et Axiom, à partir de données publiques (activité on-chain) — sans jamais se connecter à votre compte.",
  },
  {
    question: "Est-ce que PolyPips trade à ma place ?",
    answer:
      "Non, jamais. PolyPips détecte, analyse et vous notifie. C'est toujours vous qui décidez et agissez, directement sur Fomo ou Axiom.",
  },
  {
    question: "Mes clés privées ou mon wallet sont-ils connectés à PolyPips ?",
    answer:
      "Non. PolyPips ne demande jamais votre seed phrase, votre clé privée, ni vos identifiants Fomo ou Axiom, et ne détient jamais vos fonds.",
  },
  {
    question: "Comment désactiver les notifications pour un wallet ?",
    answer:
      'Depuis "Mes Smart Wallets", ouvrez les paramètres du wallet suivi et cliquez sur "Désactiver le Copy Trading".',
  },
  {
    question: "Comment savoir si j'ai déjà vu ou cliqué une notification ?",
    answer:
      'Consultez "Trades copiés" : chaque suggestion y apparaît avec son statut (nouvelle, vue, ou lien cliqué).',
  },
];
