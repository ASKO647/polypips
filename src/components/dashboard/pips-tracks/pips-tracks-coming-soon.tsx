"use client";

import { useEffect, useState } from "react";
import { Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoonBlur } from "@/components/dashboard/coming-soon-blur";

const STEPS = [
  {
    title: "Un flux, pas sept onglets",
    body: "Pips Tracks centralise en un seul flux ce qui se passe autour des wallets Fomo et Axiom que vous suivez : mouvements de wallets, actualités crypto pertinentes, et signaux détectés par l'IA de Polypips — plus besoin de recouper plusieurs pages pour comprendre pourquoi un token bouge.",
  },
  {
    title: "Chaque événement, expliqué",
    body: "Un mouvement de wallet ou une actualité n'apparaît jamais seul : Pips Tracks y associe le contexte (quel wallet, quel token, quelle actualité déclenchante) et, quand c'est pertinent, l'avis de l'IA sur ce que ça signifie — jamais une garantie, juste de quoi décider plus vite.",
  },
  {
    title: "Filtrable par ce qui vous intéresse",
    body: "Filtrez le flux par wallets suivis, par token, ou par type d'événement (mouvement, actualité, signal IA) pour ne garder que ce qui compte pour votre stratégie.",
  },
];

function ComingSoonModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" onClick={onClose}>
      <div
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#160b0c] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-white">Comment marchera Pips Tracks</h2>
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
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{step.body}</p>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={onClose} className="mt-6 w-full">
          J&apos;ai compris
        </Button>
      </div>
    </div>
  );
}

export function PipsTracksComingSoon() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <ComingSoonBlur
        icon={Activity}
        title="Pips Tracks arrive bientôt"
        description="Le flux d'actualités centralisé Fomo & Axiom — mouvements de wallets, actualités et signaux IA réunis au même endroit — est en cours de finalisation."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(true)}>
            Comment ça marche
          </Button>
        }
      />
      {showModal && <ComingSoonModal onClose={() => setShowModal(false)} />}
    </>
  );
}
