import { Headphones, ShieldCheck, TrendingUp, Zap, type LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; label: string; sublabel: string }[] = [
  { icon: ShieldCheck, label: "Sécurisé", sublabel: "Données protégées" },
  { icon: Zap, label: "Accès instantané", sublabel: "En quelques secondes" },
  { icon: TrendingUp, label: "Analyses avancées", sublabel: "IA & Smart Money" },
  { icon: Headphones, label: "Support réactif", sublabel: "7j/7" },
];

export function LoginTrustRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
      {ITEMS.map(({ icon: Icon, label, sublabel }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs text-body-soft">{sublabel}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
