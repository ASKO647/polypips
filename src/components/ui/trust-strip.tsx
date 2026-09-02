import { RefreshCw, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function TrustStrip({ className }: { className?: string }) {
  const t = useTranslations("UI");
  const items: { icon: LucideIcon; label: string }[] = [
    { icon: ShieldCheck, label: t("trustNoCard") },
    { icon: RefreshCw, label: t("trustCancelAnytime") },
    { icon: Zap, label: t("trustInstant") },
  ];

  return (
    <div className={cn("border-y border-border bg-surface-muted", className)}>
      <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-medium text-body">{label}</span>
          </div>
        ))}
      </Container>
    </div>
  );
}
