"use client";

import { useState } from "react";
import { Music2, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { submitTiktokClip } from "@/app/[locale]/dashboard/settings/tiktok-actions";
import {
  TIKTOK_RATE_PER_1000_VIEWS_EUR,
  TIKTOK_STATUS_LABELS,
  type TiktokSubmission,
} from "@/lib/data/tiktok-clips";
import { cn } from "@/lib/utils";

const EUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function statusTone(status: TiktokSubmission["status"]): string {
  if (status === "paid") return "bg-emerald-500/15 text-emerald-300";
  if (status === "verified") return "bg-brand-500/15 text-brand-400";
  if (status === "rejected") return "bg-rose-500/15 text-rose-300";
  return "bg-white/10 text-white/60";
}

export function TiktokTab({ initialSubmissions }: { initialSubmissions: TiktokSubmission[] }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await submitTiktokClip(url);
      if (result.error || !result.submission) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }
      setSubmissions((prev) => [result.submission!, ...prev]);
      setUrl("");
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2.5 rounded-xl border border-brand-400/20 bg-brand-500/[0.06] px-4 py-3">
        <Music2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
        <p className="text-xs leading-relaxed text-white/70">
          Créez des clips ou des vidéos qui parlent de Polypips sur TikTok et soyez rémunéré selon
          leurs vues : {EUR.format(TIKTOK_RATE_PER_1000_VIEWS_EUR)} pour 1 000 vues, une fois les
          vues vérifiées manuellement par notre équipe.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold text-white">Comment faire une vidéo éligible ?</h3>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-white/60">
          <li>• Présentez concrètement ce que fait Polypips (analyse IA, marchés, copy trading...).</li>
          <li>• Montrez l&apos;application à l&apos;écran — capture ou enregistrement réel de l&apos;interface.</li>
          <li>• Restez factuel : aucune promesse de gains garantis, aucune performance inventée.</li>
          <li>• Mentionnez clairement le nom « Polypips » à l&apos;oral ou à l&apos;écrit.</li>
          <li>• La vidéo doit être publiée publiquement sur votre compte TikTok pour être comptabilisée.</li>
        </ul>
      </div>

      <div>
        <label htmlFor="tiktok-url" className="block text-sm font-semibold text-white">
          Soumettre une vidéo
        </label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row sm:items-start">
          <input
            id="tiktok-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSuccess(false);
              setError(null);
            }}
            placeholder="https://www.tiktok.com/@votrecompte/video/..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none sm:max-w-md"
          />
          <Button type="button" variant="outline" onClick={handleSubmit} disabled={submitting || !url.trim()}>
            {submitting ? "Envoi..." : "Soumettre pour rémunération"}
          </Button>
        </div>
        {success && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Vidéo soumise, en attente de vérification.
          </p>
        )}
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white">Historique de vos soumissions</h3>
        {submissions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center text-sm text-white/40">
            Aucune vidéo soumise pour l&apos;instant.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-medium">Vidéo</th>
                  <th className="px-4 py-3 font-medium">Soumise</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Rémunération</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className="max-w-[220px] truncate px-4 py-3 text-white/80">
                      <a
                        href={s.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {s.tiktokUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-white/60">{s.submittedAgo}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
                            statusTone(s.status)
                          )}
                        >
                          {TIKTOK_STATUS_LABELS[s.status]}
                          {s.status === "verified" && s.verifiedViews !== null
                            ? ` · ${s.verifiedViews.toLocaleString("fr-FR")} vues`
                            : ""}
                        </span>
                        {s.status === "rejected" && s.rejectionReason && (
                          <span className="text-xs text-white/40">{s.rejectionReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {s.paymentAmount !== null ? EUR.format(s.paymentAmount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-white/10 pt-6">
        <p className="text-sm text-white/50">Prêt à passer à la vitesse supérieure ?</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
        >
          <Mail className="h-4 w-4" /> Nous contacter
        </Link>
      </div>
    </div>
  );
}
