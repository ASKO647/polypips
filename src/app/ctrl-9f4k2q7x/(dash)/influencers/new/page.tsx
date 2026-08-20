import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InfluencerForm } from "../influencer-form";
import { createInfluencer } from "../actions";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OwnerNewInfluencerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`${OWNER_BASE_PATH}/influencers`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-white">Ajouter un influenceur</h1>
      </div>

      <div className="max-w-xl rounded-2xl border border-white/10 bg-[#12151b] p-6">
        <InfluencerForm action={createInfluencer} submitLabel="Créer l'influenceur" />
      </div>
    </div>
  );
}
