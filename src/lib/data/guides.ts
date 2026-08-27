export type GuideStep = {
  title: string;
  description: string;
};

export type Guide = {
  slug: string;
  title: string;
  excerpt: string;
  intro: string;
  steps: GuideStep[];
};

export const GUIDES: Guide[] = [
  {
    slug: "bien-demarrer-avec-polypips",
    title: "Bien démarrer avec Polypips",
    excerpt: "Créer votre compte, choisir votre offre et lancer votre première analyse IA.",
    intro:
      "Ce guide vous accompagne pas à pas depuis la création de votre compte jusqu'à votre première analyse — comptez moins de cinq minutes.",
    steps: [
      {
        title: "Créez votre compte",
        description:
          "Depuis la page d'inscription, créez votre compte avec votre adresse email ou votre compte Google. Aucune carte bancaire n'est requise pour créer le compte lui-même.",
      },
      {
        title: "Choisissez votre offre",
        description:
          "Sélectionnez l'offre découverte (0,99 € pendant 3 jours) pour tester la plateforme, ou passez directement à l'abonnement Pro. Vous pouvez changer d'avis à tout moment depuis Paramètres.",
      },
      {
        title: "Explorez les marchés sélectionnés",
        description:
          "Rendez-vous dans l'onglet Marchés du tableau de bord pour découvrir la sélection quotidienne de marchés Polymarket établie par l'IA, avec le raisonnement associé à chacun.",
      },
      {
        title: "Lancez votre première analyse",
        description:
          "Depuis l'onglet Analyse IA, déposez une capture d'écran d'un marché Polymarket ou collez son lien pour obtenir votre première décision argumentée, avec probabilité estimée et explication détaillée.",
      },
    ],
  },
  {
    slug: "suivre-un-wallet-en-copy-trading",
    title: "Comment suivre un wallet en Copy Trading",
    excerpt:
      "Repérer un portefeuille Smart Money, consulter son historique, et configurer une stratégie en simulation.",
    intro:
      "Ce guide explique comment suivre un portefeuille on-chain et configurer une stratégie de copy trading en mode simulation, sans jamais engager de fonds réels.",
    steps: [
      {
        title: "Ouvrez la section Smart Money",
        description:
          "Depuis le tableau de bord, accédez à la section Smart Money de l'univers Polymarket ou Fomo/Axiom, selon les marchés que vous souhaitez suivre.",
      },
      {
        title: "Recherchez ou repérez un portefeuille",
        description:
          "Utilisez la recherche par adresse de portefeuille, ou parcourez les portefeuilles déjà identifiés par Polypips pour repérer une activité qui vous intéresse.",
      },
      {
        title: "Consultez son historique et ses métriques",
        description:
          "Avant de suivre un portefeuille, examinez son historique de décisions, sa taille moyenne de position et les métriques de qualité affichées — ces données sont publiques et vérifiables on-chain.",
      },
      {
        title: "Suivez le portefeuille",
        description:
          "Cliquez sur « Suivre » pour ajouter le portefeuille à votre liste. Vous serez notifié de son activité selon vos préférences de notification.",
      },
      {
        title: "Configurez une stratégie en simulation",
        description:
          "Depuis Copy Trading, créez une stratégie basée sur ce portefeuille : définissez votre budget maximum, votre niveau de risque et vos limites d'exposition. La stratégie s'exécute uniquement en simulation — aucun ordre réel n'est jamais transmis.",
      },
    ],
  },
  {
    slug: "utiliser-le-coach-ia-efficacement",
    title: "Utiliser le Coach IA efficacement",
    excerpt: "Poser les bonnes questions et tirer le meilleur de l'assistant conversationnel.",
    intro:
      "Le Coach IA répond d'autant mieux que la question posée est précise. Ce guide donne quelques repères pour en tirer le meilleur.",
    steps: [
      {
        title: "Ouvrez le Coach IA",
        description:
          "Accédez à l'onglet Coach IA depuis le tableau de bord, ou cliquez sur « Demander au Coach » directement depuis le résultat d'une analyse pour garder le contexte du marché.",
      },
      {
        title: "Posez une question précise",
        description:
          "Plutôt qu'une question générale, précisez le marché, l'analyse ou la stratégie concernée : « Pourquoi cette analyse donne-t-elle un edge positif ? » donne une réponse plus utile que « Est-ce un bon pari ? ».",
      },
      {
        title: "Utilisez les questions rapides suggérées",
        description:
          "Des questions rapides sont proposées pour démarrer une conversation ou explorer un sujet sans avoir à formuler vous-même la première question.",
      },
      {
        title: "Consultez l'historique de vos conversations",
        description:
          "Toutes vos conversations sont conservées et accessibles depuis la barre latérale du Coach IA (ou le menu dédié sur mobile), pour reprendre un échange précédent à tout moment.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
