import type { ContentBlock } from "@/components/marketing/content-blocks";

export type BlogContentBlock = ContentBlock;

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMinutes: number;
  content: BlogContentBlock[];
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "comment-analyser-un-marche-polymarket",
    title: "Comment analyser un marché Polymarket",
    excerpt:
      "Une méthode simple pour lire un marché de prédiction avant de se faire un avis : la question, les règles, le prix, et les sources externes.",
    category: "Prediction markets",
    date: "15 août 2026",
    readMinutes: 6,
    content: [
      {
        type: "p",
        text: "Un marché de prédiction comme ceux de Polymarket pose une question à résolution binaire ou multiple (« Est-ce que X se produira avant telle date ? ») et laisse le prix des positions YES/NO refléter la probabilité collective que le marché lui attribue. Avant de se faire un avis, il vaut mieux commencer par une lecture méthodique plutôt que par une impression.",
      },
      {
        type: "h2",
        text: "1. Lire la question et les règles de résolution avant tout",
      },
      {
        type: "p",
        text: "La question affichée n'est qu'un résumé. Les règles de résolution détaillées définissent précisément ce qui compte comme YES, quelle source fait foi en cas de litige, et à quelle date le marché se règle. Une part non négligeable des surprises vient d'une lecture trop rapide de ces règles — un marché peut se résoudre différemment de ce que l'intuition suggère si la définition exacte diffère de l'usage courant du terme.",
      },
      {
        type: "h2",
        text: "2. Le prix est une probabilité implicite, pas une vérité",
      },
      {
        type: "p",
        text: "Un contrat YES à 0,70 $ signifie que le marché estime environ 70 % de chances de réalisation — pas que l'issue est acquise. Cette probabilité résulte de l'agrégation des positions de tous les participants, avec leurs biais, leur niveau d'information et parfois leur volume limité. Elle constitue un point de départ pour se faire un avis, pas une conclusion.",
      },
      {
        type: "h2",
        text: "3. Chercher ce que le marché ne reflète peut-être pas encore",
      },
      {
        type: "p",
        text: "Un marché récent, peu liquide ou peu suivi peut ne pas avoir encore intégré une information publique disponible ailleurs (actualité, données officielles, déclarations récentes). Comparer la probabilité affichée à ce que suggèrent des sources externes fiables est souvent plus instructif que de se fier uniquement au prix affiché.",
      },
      {
        type: "h2",
        text: "4. Regarder la liquidité et le volume, pas seulement le prix",
      },
      {
        type: "p",
        text: "Un prix affiché sur un marché à faible volume peut bouger fortement pour une mise modeste, et ne reflète donc pas nécessairement un consensus solide. Un marché avec davantage de volume et de participants tend à avoir un prix plus représentatif, même s'il n'est jamais infaillible pour autant.",
      },
      {
        type: "h2",
        text: "En résumé",
      },
      {
        type: "ul",
        items: [
          "Lisez toujours les règles de résolution en détail, pas seulement la question affichée",
          "Traitez le prix comme une probabilité estimée, jamais comme une certitude",
          "Croisez avec des sources externes quand c'est possible",
          "Tenez compte du volume et de la liquidité avant de juger un prix représentatif",
        ],
      },
      {
        type: "p",
        text: "Cette méthode ne garantit aucun résultat : elle sert à se faire un avis plus informé, pas à prédire l'avenir. C'est exactement ce que fait l'Analyse IA de Polypips de façon systématique sur chaque marché que vous lui soumettez.",
      },
    ],
  },
  {
    slug: "comprendre-le-copy-trading-sportif",
    title: "Comprendre le copy trading sportif",
    excerpt:
      "Copier les décisions d'un portefeuille suivi n'est pas une martingale : ce que ça veut vraiment dire, et pourquoi la simulation a du sens avant tout engagement réel.",
    category: "Copy trading",
    date: "18 août 2026",
    readMinutes: 5,
    content: [
      {
        type: "p",
        text: "Le « copy trading » désigne le fait de reproduire, automatiquement ou manuellement, les décisions prises par un autre participant — un portefeuille suivi, souvent qualifié de « Smart Money » quand son historique de décisions est jugé de bonne qualité. Appliqué au sport ou aux marchés de prédiction, le principe reste le même : s'appuyer sur l'activité d'un tiers plutôt que de partir de zéro à chaque décision.",
      },
      {
        type: "h2",
        text: "Copier un portefeuille, ce n'est pas suivre un tipster",
      },
      {
        type: "p",
        text: "Un tipster donne un avis ponctuel, sans qu'on sache toujours sur quoi il se base ni son historique réel. Suivre un portefeuille on-chain, en revanche, permet de vérifier objectivement son historique de décisions : combien de fois il a eu raison, avec quelle taille de position, sur quelle durée. Cette traçabilité ne garantit rien pour l'avenir, mais elle change la nature de l'information sur laquelle on s'appuie.",
      },
      {
        type: "h2",
        text: "Les limites à garder en tête",
      },
      {
        type: "p",
        text: "Un bon historique passé ne prédit pas un bon historique futur — c'est vrai pour n'importe quel style de décision répétée. Un échantillon de décisions, même solide, reste un échantillon : quelques résultats extrêmes peuvent avoir gonflé une performance qui ne se reproduira pas à l'identique. Copier une stratégie revient à parier que le style de décision observé continuera de fonctionner, pas à obtenir une garantie.",
      },
      {
        type: "h2",
        text: "Pourquoi tester en simulation d'abord",
      },
      {
        type: "p",
        text: "Avant d'engager de l'argent réel sur une stratégie copiée, la simuler permet de voir comment elle se serait comportée dans des conditions proches du réel, avec vos propres paramètres de budget et de risque, sans aucun engagement financier. C'est exactement le principe du module Copy Trading de Polypips : il ne transmet jamais d'ordre réel, il vous permet d'observer et de comprendre une stratégie construite autour des portefeuilles que vous suivez.",
      },
      {
        type: "h2",
        text: "Les paramètres qui comptent",
      },
      {
        type: "ul",
        items: [
          "Le budget maximum que vous êtes prêt à allouer à la stratégie",
          "Le niveau de risque toléré par position",
          "Le nombre de positions simultanées et l'exposition totale",
          "La durée d'observation avant de tirer des conclusions sur une stratégie",
        ],
      },
      {
        type: "p",
        text: "Le copy trading, sportif ou non, reste un outil d'aide à la décision — pas un système qui élimine le risque. Garder le contrôle sur ses propres paramètres, et comprendre pourquoi une stratégie a pris telle décision, compte davantage que la promesse d'un rendement.",
      },
    ],
  },
  {
    slug: "les-bases-de-lanalyse-ia-appliquee-aux-paris",
    title: "Les bases de l'analyse IA appliquée aux paris",
    excerpt:
      "Ce qu'un modèle d'IA peut apporter à une décision de pari — et ce qu'il ne peut pas faire, pour éviter d'attendre l'impossible.",
    category: "Analyse IA",
    date: "21 août 2026",
    readMinutes: 6,
    content: [
      {
        type: "p",
        text: "Face à un marché de prédiction ou un pari sportif, une intelligence artificielle peut traiter rapidement une quantité d'information qu'un humain mettrait beaucoup plus de temps à rassembler et croiser. Mais comprendre ce qu'elle fait réellement — et ce qu'elle ne fait pas — évite d'en attendre plus qu'elle ne peut donner.",
      },
      {
        type: "h2",
        text: "Ce que fait un modèle d'analyse : estimer une probabilité",
      },
      {
        type: "p",
        text: "Le résultat d'une analyse IA est une estimation statistique : une probabilité, assortie d'une explication des facteurs pris en compte. Ce n'est ni une prédiction certaine, ni une martingale. Deux événements avec la même probabilité estimée de 70 % ne se réalisent pas tous les deux dans 70 % des cas si on ne les observe qu'une fois chacun — la probabilité ne prend tout son sens que sur un grand nombre de décisions similaires.",
      },
      {
        type: "h2",
        text: "La notion d'edge, ou l'écart entre estimation et prix affiché",
      },
      {
        type: "p",
        text: "L'edge désigne l'écart entre la probabilité estimée par l'analyse et le prix affiché par le marché. Un edge positif signifie que le marché semble sous-évaluer une issue par rapport à l'estimation — ce qui ne garantit pas que cette issue se produira, mais indique un potentiel décalage à examiner de plus près.",
      },
      {
        type: "h2",
        text: "Ce que l'IA aide à éviter : les biais cognitifs classiques",
      },
      {
        type: "ul",
        items: [
          "Le biais de confirmation : ne retenir que les informations qui confirment une intuition de départ",
          "L'aversion à la perte : refuser de sortir d'une position perdante par attachement plutôt que par analyse",
          "L'effet de récence : surpondérer les tout derniers résultats au détriment d'un historique plus large",
          "La surconfiance après une série de bonnes décisions consécutives",
        ],
      },
      {
        type: "p",
        text: "Une analyse systématique, appliquée de la même façon à chaque marché, réduit la place laissée à ces biais — sans les éliminer complètement, puisque la décision finale revient toujours à la personne qui lit l'analyse.",
      },
      {
        type: "h2",
        text: "Ce que l'IA ne peut pas faire",
      },
      {
        type: "p",
        text: "Un modèle d'analyse travaille avec des données publiques disponibles au moment de la demande. Il ne dispose d'aucune information privilégiée, ne prédit pas l'imprévisible (une blessure de dernière minute, une décision arbitrale, un événement extérieur), et ne garantit aucun résultat individuel. Le considérer comme un outil d'aide à la décision — et non comme un oracle — reste la façon la plus honnête de l'utiliser.",
      },
    ],
  },
];

export function getBlogArticle(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}
