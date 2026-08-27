export type SupportFaqItem = {
  question: string;
  answer: string;
};

export const SUPPORT_FAQ_ITEMS: SupportFaqItem[] = [
  {
    question: "Comment fonctionne l'offre découverte ?",
    answer:
      "L'offre découverte donne un accès complet à Polypips pendant 3 jours pour 0,99 €. Sauf résiliation avant la fin de cette période, elle se transforme automatiquement en abonnement Pro à 29,99 € par mois.",
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer:
      "Depuis Paramètres → Abonnement, cliquez sur « Annuler mon abonnement ». L'annulation prend effet à la fin de la période déjà payée — aucun engagement de durée n'est requis.",
  },
  {
    question: "Quels moyens de paiement sont acceptés ?",
    answer:
      "Les paiements sont traités par Stripe et acceptent les principales cartes bancaires. Polypips ne stocke jamais vos coordonnées de carte bancaire.",
  },
  {
    question: "Dois-je connecter mon propre portefeuille crypto à Polypips ?",
    answer:
      "Non. Polypips ne vous demande jamais votre clé privée ni un accès à un portefeuille réel. Le suivi de portefeuilles (« Smart Money ») se fait uniquement en consultant des adresses publiques et leur activité on-chain, déjà visibles par n'importe qui.",
  },
  {
    question: "Comment fonctionne l'analyse IA ?",
    answer:
      "Vous déposez une capture d'écran d'un marché Polymarket (ou décrivez un match sportif) : l'IA analyse la question, les règles de résolution, les données disponibles et vous propose une décision, une probabilité estimée et une explication. C'est une estimation informative, pas une garantie de résultat.",
  },
  {
    question: "Le Copy Trading exécute-t-il de vrais ordres pour moi ?",
    answer:
      "Non, jamais. Le module Copy Trading fonctionne exclusivement en simulation : il vous permet de configurer et d'observer une stratégie basée sur les portefeuilles que vous suivez, sans qu'aucun ordre réel ne soit transmis en votre nom.",
  },
  {
    question: "Les analyses de Polypips sont-elles un conseil financier ?",
    answer:
      "Non. Les analyses sont fournies à titre strictement informatif et éducatif. Elles ne constituent ni un conseil en investissement, ni une recommandation personnalisée. Vous restez seul responsable de vos décisions.",
  },
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer:
      "Depuis la page de connexion, cliquez sur « Mot de passe oublié » et suivez les instructions envoyées par email pour en définir un nouveau.",
  },
  {
    question: "Comment supprimer mon compte ?",
    answer:
      "Depuis Paramètres → Profil, la section « Zone danger » permet de demander la suppression de votre compte. Notre équipe vous contacte ensuite par email pour confirmer et finaliser la suppression.",
  },
  {
    question: "Comment contacter le support ?",
    answer:
      "Écrivez-nous à l'adresse indiquée en bas de cette page, ou utilisez la bulle de chat en bas à droite de l'écran. Nous répondons du lundi au vendredi.",
  },
];
