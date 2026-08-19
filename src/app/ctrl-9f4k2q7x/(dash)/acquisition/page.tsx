import type { Metadata } from "next";
import { OwnerEmptyState } from "@/components/owner/empty-state";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerAcquisitionPage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-white">Acquisition</h1>
      <OwnerEmptyState
        title="Aucune source d'acquisition trackée"
        reason="Le tunnel source de trafic → inscription → essai → Pro suppose des paramètres UTM capturés au moment de l'inscription. Rien dans le schéma actuel (aucune colonne sur les tables utilisateur/subscriptions) ne stocke la source d'un utilisateur — cette page restera vide tant que cette capture n'est pas ajoutée à l'inscription."
      />
    </div>
  );
}
