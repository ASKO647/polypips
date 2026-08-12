/**
 * Coach IA runs on scripted/mocked answers for now - no real model call.
 * Shapes anticipate a real chat backend: messages carry a role and plain
 * text content, conversations are just ordered message lists.
 */

export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export type QuickQuestion = {
  id: string;
  label: string;
  response: string;
};

export const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Bonjour ! Je suis votre coach IA Polypips. Posez-moi une question sur vos analyses.",
};

export const GENERIC_FALLBACK_RESPONSE =
  "Je suis actuellement en version de démonstration. Cette fonctionnalité sera bientôt connectée à l'analyse complète de vos marchés.";

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "why-yes",
    label: "Pourquoi l'IA a choisi YES ?",
    response:
      "Sur ce marché, notre modèle attribue 68% de probabilité de victoire au Real Madrid, contre 51% actuellement pricé par le marché — soit un edge de +17 points. Cette décision s'appuie surtout sur 4 facteurs : 4 victoires sur les 5 derniers matchs toutes compétitions confondues, le retour de plusieurs titulaires clés après blessure, l'avantage du terrain au Bernabéu, et un FC Barcelone actuellement diminué en défense. Le score d'opportunité de 87/100 reflète l'ampleur de cet écart entre notre estimation et le prix du marché.",
  },
  {
    id: "main-risks",
    label: "Quels sont les principaux risques ?",
    response:
      "Deux éléments à garder en tête avant de suivre cette analyse : l'historique récent en clasico reste équilibré (3 victoires partout sur les 6 dernières confrontations), ce qui montre que l'écart de forme actuel ne garantit rien sur un match à enjeu spécifique. Et l'enjeu émotionnel très élevé de ce type de rencontre peut favoriser un scénario plus imprévisible qu'un match de championnat classique.",
  },
  {
    id: "what-could-invalidate",
    label: "Qu'est-ce qui pourrait invalider cette analyse ?",
    response:
      "Le facteur le plus susceptible de faire bouger cette probabilité serait une nouvelle blessure d'un titulaire offensif du Real Madrid dans les prochains jours. Le modèle recalculerait alors immédiatement la probabilité à la baisse, puisqu'une bonne partie de l'edge actuel repose justement sur le retour au complet de l'effectif offensif.",
  },
  {
    id: "compare-markets",
    label: "Compare ces deux marchés.",
    response:
      "En comparant ces deux marchés : sur le clasico Real Madrid vs FC Barcelone, notre IA est à 68% (marché à 51%, edge +17%, confiance Élevée). Sur \"Le Bitcoin dépassera-t-il 100 000 $ ce mois-ci ?\", l'IA est à 34% pour un marché à 44% (edge -10%, confiance Moyenne) — ici l'IA est plus prudente que le marché, à l'inverse du clasico. Le clasico présente à la fois un edge plus large et un niveau de confiance plus élevée, ce qui explique son score d'opportunité nettement supérieur (87/100 contre 61/100).",
  },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-clasico-yes",
    title: "Pourquoi YES sur le clasico ?",
    messages: [
      WELCOME_MESSAGE,
      {
        id: "conv-clasico-yes-u1",
        role: "user",
        content: "Pourquoi YES sur le clasico ?",
      },
      {
        id: "conv-clasico-yes-a1",
        role: "assistant",
        content: QUICK_QUESTIONS[0].response,
      },
    ],
  },
  {
    id: "conv-bitcoin-risks",
    title: "Risques sur le marché Bitcoin",
    messages: [
      WELCOME_MESSAGE,
      {
        id: "conv-bitcoin-risks-u1",
        role: "user",
        content: "Quels sont les risques sur le marché Bitcoin > 100 000 $ ?",
      },
      {
        id: "conv-bitcoin-risks-a1",
        role: "assistant",
        content:
          "Sur ce marché, notre IA est plus prudente que le marché (34% contre 44%, edge -10%). Les principaux risques identifiés : un ralentissement net du volume sur les dernières 72h, une résistance technique forte juste au-dessus du cours actuel, et une sensibilité élevée aux annonces macroéconomiques américaines cette semaine. Le niveau de confiance sur cette analyse reste Moyen.",
      },
    ],
  },
  {
    id: "conv-fed-taux",
    title: "Avis sur la Fed en mars",
    messages: [
      WELCOME_MESSAGE,
      {
        id: "conv-fed-taux-u1",
        role: "user",
        content:
          "Qu'est-ce que l'IA pense d'une baisse des taux de la Fed en mars ?",
      },
      {
        id: "conv-fed-taux-a1",
        role: "assistant",
        content:
          "Notre IA estime la probabilité d'une baisse des taux en mars à 22%, contre 31% actuellement pricé par le marché. Le marché nous semble un peu trop optimiste : le discours des membres du FOMC reste globalement prudent, et l'inflation sous-jacente se maintient encore au-dessus de l'objectif. Une publication d'inflation nettement sous les attentes dans les prochaines semaines pourrait changer significativement cette estimation.",
      },
    ],
  },
  {
    id: "conv-compare-marches",
    title: "Comparer clasico et Bitcoin",
    messages: [
      WELCOME_MESSAGE,
      {
        id: "conv-compare-marches-u1",
        role: "user",
        content: "Peux-tu comparer le marché du clasico et celui du Bitcoin ?",
      },
      {
        id: "conv-compare-marches-a1",
        role: "assistant",
        content: QUICK_QUESTIONS[3].response,
      },
    ],
  },
];
