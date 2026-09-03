import { Headphones, ShieldCheck, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

const ITEMS: { icon: LucideIcon; key: "secure" | "instant" | "analyses" | "support" }[] = [
  { icon: ShieldCheck, key: "secure" },
  { icon: Zap, key: "instant" },
  { icon: TrendingUp, key: "analyses" },
  { icon: Headphones, key: "support" },
];

export async function LoginTrustRow() {
  const t = await getTranslations("Auth.LoginTrustRow");

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
      {ITEMS.map(({ icon: Icon, key }) => (
        <div key={key} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-ink">{t(`${key}.label`)}</span>
            <span className="text-xs text-body-soft">{t(`${key}.sublabel`)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
