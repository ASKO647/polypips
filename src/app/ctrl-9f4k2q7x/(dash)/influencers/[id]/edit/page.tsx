import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InfluencerForm } from "../../influencer-form";
import { updateInfluencer } from "../../actions";
import { fetchOwnerInfluencerDetail } from "@/lib/supabase/owner-influencers";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OwnerEditInfluencerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await fetchOwnerInfluencerDetail(id);
  if (!detail) notFound();

  const boundUpdate = updateInfluencer.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`${OWNER_BASE_PATH}/influencers/${id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-white">
          Modifier {detail.influencer.name}
        </h1>
      </div>

      <div className="max-w-xl rounded-2xl border border-white/10 bg-[#12151b] p-6">
        <InfluencerForm
          action={boundUpdate}
          defaultValues={detail.influencer}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  );
}
