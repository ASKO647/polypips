import {
  BadgeCheck,
  CircleUserRound,
  Clock,
  Copy,
  ListChecks,
  Plug,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button, ButtonIcon } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StepStatus = "available" | "pending";

type Step = {
  icon: typeof Wallet;
  title: string;
  description: string;
  status: StepStatus;
  statusNote: string;
};

/** Every step here is described honestly against what's actually wired up
 * today — see analyze-signal-bet's and sync-signal-wallets' file comments.
 * Fomo/Axiom expose no documented public/commercial API, so steps 2 and 3
 * cannot be a real OAuth/connect flow yet; saying otherwise here would
 * directly contradict the rest of this feature's demo-data honesty
 * guarantee (DemoDataBanner, execution_mode='demo', ...). */
const STEPS: Step[] = [
  {
    icon: CircleUserRound,
    title: "Connecter votre compte PolyPips",
    description:
      "Créez un compte ou connectez-vous à PolyPips (email ou Google) — c'est le compte sous lequel vos Smart Wallets suivis et vos paramètres de Copy Trading sont enregistrés.",
    status: "available",
    statusNote: "Disponible dès maintenant",
  },
  {
    icon: Plug,
    title: "Connecter ou autoriser Fomo",
    description:
      "Fomo ne propose aujourd'hui aucune API publique ou officielle permettant à PolyPips de se connecter directement à votre compte Fomo. Cette étape n'est pas encore possible — dès qu'une intégration officielle existera, elle sera ajoutée ici.",
    status: "pending",
    statusNote: "Pas encore disponible — aucune API officielle Fomo",
  },
  {
    icon: Plug,
    title: "Connecter ou autoriser Axiom",
    description:
      "Même situation qu'avec Fomo : Axiom ne propose aujourd'hui aucune API publique ou officielle. PolyPips ne contourne jamais cette limite (pas de scraping) — cette étape reste indisponible tant qu'aucune intégration officielle n'existe.",
    status: "pending",
    statusNote: "Pas encore disponible — aucune API officielle Axiom",
  },
  {
    icon: ListChecks,
    title: "Choisir les Smart Wallets à suivre",
    description:
      "Depuis la page \"Smart Wallet\", parcourez les wallets repérés, filtrez par source ou Win Rate, puis suivez ceux qui vous intéressent. Ils apparaissent ensuite dans \"Mes Smart Wallets\".",
    status: "available",
    statusNote: "Disponible dès maintenant",
  },
  {
    icon: Copy,
    title: "Activer le Copy Trading",
    description:
      "Depuis \"Mes Smart Wallets\", ouvrez les paramètres d'un wallet suivi et activez le Copy Trading : montant maximum par trade, % copié, limite quotidienne, positions simultanées, slippage maximum, tokens exclus.",
    status: "available",
    statusNote: "Disponible — fonctionne en mode démo",
  },
  {
    icon: ShieldCheck,
    title: "Vérifier que tout fonctionne",
    description:
      "Consultez \"Trades copiés\" pour voir les décisions COPY/IGNORE de l'IA et du Risk Engine sur les mouvements détectés. Tant qu'aucune source réelle n'est connectée, ces mouvements proviennent de données de démonstration clairement indiquées, pas de vrais trades Fomo/Axiom.",
    status: "available",
    statusNote: "Disponible — sur données de démonstration",
  },
  {
    icon: Wallet,
    title: "Lancer le Copy Trading automatique",
    description:
      "Une fois activé, le pipeline (détection → analyse IA → Risk Engine → décision) tourne automatiquement à chaque synchronisation. Aucune transaction réelle n'est exécutée aujourd'hui : le mode est toujours \"démo\", et aucune clé privée n'est jamais demandée ou stockée par PolyPips.",
    status: "pending",
    statusNote: "Mode démo uniquement — exécution réelle pas encore disponible",
  },
];

function StatusBadge({ status, note }: { status: StepStatus; note: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        status === "available" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"
      )}
    >
      {status === "available" ? <BadgeCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {note}
    </span>
  );
}

export function TutorialFlow() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Comment connecter PolyPips à Fomo &amp; Axiom
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
          Le guide complet pour suivre des Smart Wallets et activer le Copy Trading — étape par
          étape, avec un état honnête de ce qui fonctionne réellement aujourd&apos;hui.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-amber-200/90">
          Fomo et Axiom ne proposent aujourd&apos;hui aucune API publique ou officielle. PolyPips ne
          contourne jamais cette limite (aucun scraping, aucune clé privée demandée ou stockée).
          Les étapes de connexion directe à ces plateformes ne sont donc pas encore possibles — le
          reste du parcours (découverte, suivi, Copy Trading en mode démo) fonctionne dès
          aujourd&apos;hui.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white/70">
                {i + 1}
              </span>
              {i < STEPS.length - 1 && <span className="w-px flex-1 bg-white/10" />}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
                  <step.icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <p className="font-display text-base font-bold text-white">{step.title}</p>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-white/60">{step.description}</p>
              <div className="mt-3">
                <StatusBadge status={step.status} note={step.statusNote} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button href="/dashboard/smart-wallets" className="sm:flex-1">
          Découvrir les Smart Wallets
          <ButtonIcon>→</ButtonIcon>
        </Button>
        <Button href="/dashboard/smart-wallets/suivis" variant="outline" className="sm:flex-1">
          Aller à Mes Smart Wallets
        </Button>
      </div>
    </div>
  );
}
