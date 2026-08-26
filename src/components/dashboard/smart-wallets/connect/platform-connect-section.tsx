import { AlertCircle, ExternalLink, LogIn, ShieldQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  authorizeStepDescription,
  type ConnectPlatformInfo,
} from "@/lib/data/fomo-axiom-connect";
import { cn } from "@/lib/utils";

function StepCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] font-display text-sm font-bold text-white/50">
        {number}
      </span>
      <div className="flex-1">
        <p className="font-display text-base font-bold text-white">{title}</p>
        <div className="mt-2 text-sm leading-relaxed text-white/60">{children}</div>
      </div>
    </div>
  );
}

/** One platform's full connection track (Axiom or Fomo) — identical shape
 * for both since neither offers more than "open the site and log in
 * yourself" today. Step 3 never renders a fake "Autoriser" button: see
 * lib/data/fomo-axiom-connect.ts's file comment for why. Step 4's status
 * is not a prop — it can only ever be "non connecté" until a real
 * integration exists, so showing it as a live toggle would misrepresent
 * what's actually happening. */
export function PlatformConnectSection({ platform }: { platform: ConnectPlatformInfo }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Connecter {platform.label}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/55">{platform.subtitle}</p>
      </div>

      <StepCard number="01" title={`Ouvrir ${platform.label}`}>
        <p>{platform.openStepDescription}</p>
        <a
          href={platform.officialUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3.5 w-fit")}
        >
          🌐 Ouvrir {platform.label}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </StepCard>

      <StepCard number="02" title="Se connecter">
        <p>{platform.loginStepDescription}</p>
      </StepCard>

      <StepCard number="03" title="Autoriser PolyPips">
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-3">
          <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" strokeWidth={2} />
          <p className="text-xs leading-relaxed text-amber-200/90">
            {authorizeStepDescription(platform)}
          </p>
        </div>
      </StepCard>

      <StepCard number="04" title="Vérification">
        <div className="flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-sm font-bold text-white">🔴 {platform.label} non connecté</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs text-white/45 sm:grid-cols-2">
            <span>Dernière synchronisation : —</span>
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white/30" />
              Aucune intégration officielle {platform.label} disponible aujourd&apos;hui
            </span>
          </div>
        </div>
      </StepCard>

      <p className="flex items-center gap-1.5 text-[11px] text-white/30">
        <LogIn className="h-3 w-3" strokeWidth={2} />
        PolyPips ne vous demandera jamais votre mot de passe {platform.label}, votre clé privée ou
        votre seed phrase.
      </p>
    </div>
  );
}
