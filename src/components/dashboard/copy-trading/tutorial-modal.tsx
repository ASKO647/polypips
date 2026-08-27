"use client";

import { useEffect } from "react";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    title: "1. Comment ça marche",
    body: "Le copy trading Polypips est un système de suivi et d'alerte, pas d'exécution automatique. Polypips ne détient jamais votre clé privée et ne passe jamais d'ordre à votre place. Quand un portefeuille que vous suivez fait un mouvement qui correspond aux paramètres de risque que vous avez définis, vous recevez une notification avec un lien direct vers le marché concerné sur Polymarket — à vous de décider d'y donner suite ou non.",
  },
  {
    title: "2. Configurer une stratégie",
    body: "Suivez d'abord un ou plusieurs portefeuilles depuis la page Smart Money. Chaque portefeuille suivi apparaît ici comme une stratégie possible : configurez son montant maximum par mouvement, son exposition maximale, et le nombre de suggestions actives autorisées, puis activez-la.",
  },
  {
    title: "3. Interpréter une notification",
    body: "Une notification de copy trading indique le portefeuille concerné, le marché, le montant et le sens (YES/NO) du mouvement détecté. Cliquez sur le lien pour ouvrir directement la page du marché sur Polymarket et exécuter l'ordre vous-même si vous le souhaitez — la suggestion reste visible dans l'historique de la stratégie, avec son statut (nouvelle, vue, lien ouvert).",
  },
];

export function TutorialModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#160b0c] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-white">
            Comment fonctionne le copy trading
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-5">
          {STEPS.map((step) => (
            <div key={step.title}>
              <p className="text-sm font-bold text-white">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                {step.body}
              </p>
            </div>
          ))}

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
            <p className="text-xs leading-relaxed text-amber-100/70">
              Le copy trading comporte des risques. Les performances passées
              d&apos;un portefeuille ne préjugent pas de ses performances
              futures, et Polypips n&apos;exécute jamais d&apos;ordre à votre
              place : vous restez seul décisionnaire de chaque action sur
              Polymarket.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="mt-6 w-full"
        >
          J&apos;ai compris
        </Button>
      </div>
    </div>
  );
}
