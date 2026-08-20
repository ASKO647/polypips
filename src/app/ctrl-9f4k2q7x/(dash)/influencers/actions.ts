"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOwnerUser } from "@/lib/supabase/owner";
import { logOwnerEvent } from "@/lib/supabase/owner-audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { OWNER_BASE_PATH } from "@/lib/owner-path";

const BASE = `${OWNER_BASE_PATH}/influencers`;

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (post-NFD combining marks)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

type InfluencerFormFields = {
  name: string;
  code_promo: string | null;
  tracking_slug: string | null;
  commission_type: "percent" | "fixed";
  commission_value: number;
  status: "active" | "paused";
  contact_email: string | null;
  notes: string | null;
};

/** Shared by create/update — reads and validates the exact same set of
 * fields both forms submit, returning a plain error string instead of
 * throwing so the calling action can redirect back with it. */
function parseInfluencerForm(formData: FormData): { fields: InfluencerFormFields } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom est obligatoire." };

  const rawCode = String(formData.get("code_promo") ?? "").trim();
  const rawSlugInput = String(formData.get("tracking_slug") ?? "").trim();
  const code_promo = rawCode ? normalizeCode(rawCode) : null;
  const tracking_slug = rawSlugInput ? slugify(rawSlugInput) : null;

  if (!code_promo && !tracking_slug) {
    return { error: "Renseignez au moins un code promo ou un lien traçant." };
  }

  const commission_type = formData.get("commission_type") === "fixed" ? "fixed" : "percent";
  const commission_value = Number(formData.get("commission_value"));
  if (!Number.isFinite(commission_value) || commission_value <= 0) {
    return { error: "La commission doit être un nombre positif." };
  }
  if (commission_type === "percent" && commission_value > 100) {
    return { error: "Une commission en pourcentage ne peut pas dépasser 100." };
  }

  const status = formData.get("status") === "paused" ? "paused" : "active";
  const contact_email = String(formData.get("contact_email") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  return {
    fields: { name, code_promo, tracking_slug, commission_type, commission_value, status, contact_email, notes },
  };
}

export async function createInfluencer(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const owner = await requireOwnerUser();
  if (!owner) return { error: "unauthorized" };

  const parsed = parseInfluencerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("influencers")
    .insert(parsed.fields)
    .select("id")
    .single();

  await logOwnerEvent({
    event: "owner_influencer_create",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { name: parsed.fields.name, error: error?.message },
  });

  if (error || !data) {
    return {
      error:
        error?.code === "23505"
          ? "Ce code promo ou ce lien traçant est déjà utilisé par un autre influenceur."
          : "Impossible de créer l'influenceur.",
    };
  }

  revalidatePath(BASE);
  redirect(`${BASE}/${data.id}`);
}

export async function updateInfluencer(
  id: string,
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const owner = await requireOwnerUser();
  if (!owner) return { error: "unauthorized" };

  const parsed = parseInfluencerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = createAdminClient();
  const { error } = await supabase.from("influencers").update(parsed.fields).eq("id", id);

  await logOwnerEvent({
    event: "owner_influencer_update",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { influencerId: id, error: error?.message },
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ce code promo ou ce lien traçant est déjà utilisé par un autre influenceur."
          : "Impossible d'enregistrer les modifications.",
    };
  }

  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
  redirect(`${BASE}/${id}`);
}

/** One-click pause/reactivate, separate from the full edit form — status
 * is the one field an owner needs to flip without opening the edit page. */
export async function setInfluencerStatus(id: string, status: "active" | "paused"): Promise<void> {
  const owner = await requireOwnerUser();
  if (!owner) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("influencers").update({ status }).eq("id", id);

  await logOwnerEvent({
    event: "owner_influencer_status_change",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { influencerId: id, status, error: error?.message },
  });

  revalidatePath(BASE);
  revalidatePath(`${BASE}/${id}`);
}

/** Manual-only, as specced — no automatic payout is triggered. Just flips
 * commission_status so the console's pending/paid totals reflect reality. */
export async function markCommissionPaid(referralId: string, influencerId: string): Promise<void> {
  const owner = await requireOwnerUser();
  if (!owner) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("influencer_referrals")
    .update({ commission_status: "paid" })
    .eq("id", referralId);

  await logOwnerEvent({
    event: "owner_influencer_commission_marked_paid",
    result: error ? "failure" : "success",
    userId: owner.id,
    email: owner.email,
    detail: { referralId, influencerId, error: error?.message },
  });

  revalidatePath(`${BASE}/${influencerId}`);
}
