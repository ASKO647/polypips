import { RefreshCw, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Aucune carte requise" },
  { icon: RefreshCw, label: "Annulation à tout moment" },
  { icon: Zap, label: "Accès instantané" },
];

export function TrustStrip({ className }: { className?: string }) {
  return (
    <div className={cn("border-y border-border bg-surface-muted", className)}>
      <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5">
        {ITEMS.map(({ icon: Icon, label }) => (
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
