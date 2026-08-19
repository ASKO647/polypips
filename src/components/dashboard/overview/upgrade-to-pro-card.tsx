import { Button, ButtonIcon } from "@/components/ui/button";

export function UpgradeToProCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-brand-400/20 bg-brand-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-bold text-white">Passez à Pro</p>
        <p className="mt-0.5 text-xs leading-relaxed text-white/50">
          Accédez à toutes les fonctionnalités et boostez vos performances.
        </p>
      </div>
      <Button href="/dashboard/settings" size="sm" className="shrink-0">
        Passer à Pro
        <ButtonIcon>→</ButtonIcon>
      </Button>
    </div>
  );
}
