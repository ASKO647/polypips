"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import type { OwnerInfluencerDetail } from "@/lib/supabase/owner-influencers";

const inputClass =
  "h-10 w-full rounded-lg border border-white/10 bg-[#12151b] px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/60";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#0b0d10] hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}

type Action = (
  prevState: { error: string | null },
  formData: FormData
) => Promise<{ error: string | null }>;

export function InfluencerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: OwnerInfluencerDetail;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder="Ex : Sarah Martin"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="code_promo"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Code promo
          </label>
          <input
            id="code_promo"
            name="code_promo"
            type="text"
            defaultValue={defaultValues?.codePromo ?? ""}
            placeholder="Ex : SARAH20"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="tracking_slug"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Lien traçant (/i/...)
          </label>
          <input
            id="tracking_slug"
            name="tracking_slug"
            type="text"
            defaultValue={defaultValues?.trackingSlug ?? ""}
            placeholder="Ex : sarah"
            className={inputClass}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-500">
        Renseignez au moins l&apos;un des deux — code et lien peuvent aussi coexister.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commission_type"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Type de commission
          </label>
          <select
            id="commission_type"
            name="commission_type"
            defaultValue={defaultValues?.commissionType ?? "percent"}
            className={inputClass}
          >
            <option value="percent">Pourcentage</option>
            <option value="fixed">Montant fixe</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="commission_value"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Valeur (% ou €)
          </label>
          <input
            id="commission_value"
            name="commission_value"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultValues?.commissionValue}
            placeholder="Ex : 20"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Statut
        </label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          className={inputClass}
        >
          <option value="active">Actif</option>
          <option value="paused">En pause</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact_email"
          className="text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          Email de contact
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={defaultValues?.contactEmail ?? ""}
          placeholder="sarah@exemple.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
          placeholder="Accord, réseaux, contexte de la collaboration..."
          className="w-full resize-none rounded-lg border border-white/10 bg-[#12151b] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/60"
        />
      </div>

      <div>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
