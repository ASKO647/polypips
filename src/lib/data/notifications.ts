export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  read: boolean;
};

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Nouvelle opportunité détectée",
    description: "Djokovic vainqueur Roland Garros — edge +8%",
    timeAgo: "Il y a 12 min",
    read: false,
  },
  {
    id: "n2",
    title: "Mouvement Smart Money important",
    description:
      "whale_trader.eth a ouvert une position de 240 000 € sur le clasico",
    timeAgo: "Il y a 1h",
    read: false,
  },
  {
    id: "n3",
    title: "Résumé hebdomadaire disponible",
    description: "Votre bilan de performance de la semaine est prêt.",
    timeAgo: "Hier",
    read: true,
  },
];
