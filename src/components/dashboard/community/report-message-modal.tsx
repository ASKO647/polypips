"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { reportMessage } from "@/lib/supabase/community";

export function ReportMessageModal({ messageId, onClose }: { messageId: string; onClose: () => void }) {
  const t = useTranslations("Community.ReportMessageModal");
  const REASONS = t.raw("reasons") as string[];
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      await reportMessage(supabase, {
        messageId,
        reason: details.trim() ? `${reason} — ${details.trim()}` : reason,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0808] p-6 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-bold text-white">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <p className="mt-5 text-sm text-emerald-400">
            {t("sentMessage")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 text-sm text-white/70">
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-brand-500"
                  />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("detailsPlaceholder")}
              rows={2}
              maxLength={280}
              className="resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
            />
            {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 w-full items-center justify-center rounded-full bg-rose-500 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
