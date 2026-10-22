const copy = {
  fr: {
    badge: "NOUVEAU · V2.0", title: ["La V2 est là.", "Plus d’outils.", "Plus de maîtrise."],
    description: "Sport et Smart Wallet : découvrez une nouvelle façon d’analyser, de suivre et de décider.",
    available: "Déjà disponible sur votre compte", cta: "Essayer la V2.0", note: "Découvrez toutes les nouveautés.",
    refresh: "9 marchés · Actualisés toutes les 24 h", sport: "Analyse IA Sport", new: "Nouveau",
    sports: ["Football", "Basket", "Tennis"], team: ["Équipe 1", "Équipe 2"], player: ["Joueur 1", "Joueur 2"],
    searchTeam: "Rechercher une équipe…", searchPlayer: "Rechercher un joueur…", upcoming: "Prochaines confrontations", matches: "Rechercher les prochaines rencontres",
    wallet: "Smart Wallet", position: "Nouvelle position détectée",
    pause: "Mettre en pause", resume: "Reprendre", preview: "Aperçus du produit",
    features: [
      { title: "Analyse IA Sport", description: "Recherchez deux équipes et leurs prochaines confrontations." },
      { title: "Smart Wallet", description: "Recherchez et suivez les portefeuilles Polymarket." },
      { title: "9 marchés sélectionnés", description: "Des sélections IA actualisées toutes les 24 h." },
      { title: "Notifications instantanées", description: "Une alerte lorsqu’un wallet suivi ouvre une position." },
      { title: "Historique sport", description: "Vos pronostics et analyses accessibles à tout moment." },
    ],
  },
  en: {
    badge: "NEW · V2.0", title: ["V2 is here.", "More tools.", "More control."],
    description: "Sport and Smart Wallet: discover a new way to analyse, track and decide.",
    available: "Already available in your account", cta: "Try V2.0", note: "Explore everything that’s new.",
    refresh: "9 markets · Updated every 24 hours", sport: "AI Sports Analysis", new: "New",
    sports: ["Football", "Basketball", "Tennis"], team: ["Team 1", "Team 2"], player: ["Player 1", "Player 2"],
    searchTeam: "Search for a team…", searchPlayer: "Search for a player…", upcoming: "Upcoming matchups", matches: "Find upcoming matches",
    wallet: "Smart Wallet", position: "New position detected",
    pause: "Pause", resume: "Resume", preview: "Product previews",
    features: [
      { title: "AI Sports Analysis", description: "Look up two teams and their upcoming matchups." },
      { title: "Smart Wallet", description: "Find and follow Polymarket portfolios." },
      { title: "9 selected markets", description: "AI selections updated every 24 hours." },
      { title: "Instant notifications", description: "An alert when a tracked wallet opens a position." },
      { title: "Sports history", description: "Your predictions and analyses, accessible anytime." },
    ],
  },
} as const;
export function getV2Copy(locale: string) { return copy[locale === "en" ? "en" : "fr"]; }
